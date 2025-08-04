import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta
import json
from pymongo import MongoClient
from config import Config

# MongoDB connection
client = MongoClient(Config.MONGODB_URI)
db = client.cspm_db

# Collections
logs_collection = db.logs
stats_collection = db.stats

class LogEntry:
    def __init__(self, event_id, event_name, user_identity_type, source_ip, 
                 risk_score, risk_level, model_loaded, anomaly_detected, 
                 rule_based_flags, timestamp=None):
        self.event_id = event_id
        self.event_name = event_name
        self.user_identity_type = user_identity_type
        self.source_ip = source_ip
        self.risk_score = risk_score
        self.risk_level = risk_level
        self.model_loaded = model_loaded
        self.anomaly_detected = anomaly_detected
        self.rule_based_flags = rule_based_flags
        self.timestamp = timestamp or datetime.utcnow()
    
    def to_dict(self):
        return {
            'event_id': self.event_id,
            'event_name': self.event_name,
            'user_identity_type': self.user_identity_type,
            'source_ip': self.source_ip,
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'model_loaded': self.model_loaded,
            'anomaly_detected': self.anomaly_detected,
            'rule_based_flags': self.rule_based_flags,
            'timestamp': self.timestamp
        }
    
    @staticmethod
    def from_dict(data):
        return LogEntry(
            event_id=data.get('event_id'),
            event_name=data.get('event_name'),
            user_identity_type=data.get('user_identity_type'),
            source_ip=data.get('source_ip'),
            risk_score=data.get('risk_score'),
            risk_level=data.get('risk_level'),
            model_loaded=data.get('model_loaded'),
            anomaly_detected=data.get('anomaly_detected'),
            rule_based_flags=data.get('rule_based_flags'),
            timestamp=data.get('timestamp')
        )

class LogManager:
    @staticmethod
    def add_log(log_entry):
        """Add a new log entry and maintain only the latest 100 logs"""
        try:
            # Insert the new log
            logs_collection.insert_one(log_entry.to_dict())
            
            # Count total logs
            total_logs = logs_collection.count_documents({})
            
            # If we have more than 100 logs, remove the oldest ones
            if total_logs > 100:
                # Find the oldest logs to remove
                oldest_logs = logs_collection.find().sort('timestamp', 1).limit(total_logs - 100)
                oldest_ids = [log['_id'] for log in oldest_logs]
                
                # Remove the oldest logs
                if oldest_ids:
                    logs_collection.delete_many({'_id': {'$in': oldest_ids}})
            
            return True
        except Exception as e:
            return False
    
    @staticmethod
    def get_logs(limit=50, skip=0):
        """Get logs with pagination"""
        try:
            logs = list(logs_collection.find().sort('timestamp', -1).skip(skip).limit(limit))
            return logs
        except Exception as e:
            return []
    
    @staticmethod
    def get_logs_count():
        """Get total number of logs"""
        try:
            return logs_collection.count_documents({})
        except Exception as e:
            return 0
    
    @staticmethod
    def get_stats():
        """Get aggregated statistics from logs"""
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': None,
                        'total_logs': {'$sum': 1},
                        'avg_risk_score': {'$avg': '$risk_score'},
                        'high_risk_count': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'HIGH']}, 1, 0]}
                        },
                        'medium_risk_count': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'MEDIUM']}, 1, 0]}
                        },
                        'low_risk_count': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'LOW']}, 1, 0]}
                        },
                        'anomaly_count': {
                            '$sum': {'$cond': ['$anomaly_detected', 1, 0]}
                        },
                        'root_user_count': {
                            '$sum': {'$cond': [{'$eq': ['$user_identity_type', 'Root']}, 1, 0]}
                        }
                    }
                }
            ]
            
            result = list(logs_collection.aggregate(pipeline))
            if result:
                stats = result[0]
                stats.pop('_id', None)
                return stats
            else:
                return {
                    'total_logs': 0,
                    'avg_risk_score': 0,
                    'high_risk_count': 0,
                    'medium_risk_count': 0,
                    'low_risk_count': 0,
                    'anomaly_count': 0,
                    'root_user_count': 0
                }
        except Exception as e:
            return {
                'total_logs': 0,
                'avg_risk_score': 0,
                'high_risk_count': 0,
                'medium_risk_count': 0,
                'low_risk_count': 0,
                'anomaly_count': 0,
                'root_user_count': 0
            }
    
    @staticmethod
    def get_trends():
        """Calculate trend percentages for the last 24 hours vs previous 24 hours"""
        try:
            from datetime import datetime, timedelta
            
            now = datetime.utcnow()
            yesterday = now - timedelta(days=1)
            two_days_ago = now - timedelta(days=2)
            
            # Current 24 hours
            current_pipeline = [
                {'$match': {'timestamp': {'$gte': yesterday}}},
                {
                    '$group': {
                        '_id': None,
                        'current_total': {'$sum': 1},
                        'current_high_risk': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'HIGH']}, 1, 0]}
                        },
                        'current_medium_risk': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'MEDIUM']}, 1, 0]}
                        },
                        'current_anomalies': {
                            '$sum': {'$cond': ['$anomaly_detected', 1, 0]}
                        },
                        'current_root_users': {
                            '$sum': {'$cond': [{'$eq': ['$user_identity_type', 'Root']}, 1, 0]}
                        }
                    }
                }
            ]
            
            # Previous 24 hours
            previous_pipeline = [
                {'$match': {'timestamp': {'$gte': two_days_ago, '$lt': yesterday}}},
                {
                    '$group': {
                        '_id': None,
                        'previous_total': {'$sum': 1},
                        'previous_high_risk': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'HIGH']}, 1, 0]}
                        },
                        'previous_medium_risk': {
                            '$sum': {'$cond': [{'$eq': ['$risk_level', 'MEDIUM']}, 1, 0]}
                        },
                        'previous_anomalies': {
                            '$sum': {'$cond': ['$anomaly_detected', 1, 0]}
                        },
                        'previous_root_users': {
                            '$sum': {'$cond': [{'$eq': ['$user_identity_type', 'Root']}, 1, 0]}
                        }
                    }
                }
            ]
            
            current_result = list(logs_collection.aggregate(current_pipeline))
            previous_result = list(logs_collection.aggregate(previous_pipeline))
            
            current = current_result[0] if current_result else {
                'current_total': 0, 'current_high_risk': 0, 'current_medium_risk': 0,
                'current_anomalies': 0, 'current_root_users': 0
            }
            previous = previous_result[0] if previous_result else {
                'previous_total': 0, 'previous_high_risk': 0, 'previous_medium_risk': 0,
                'previous_anomalies': 0, 'previous_root_users': 0
            }
            
            # Calculate percentage changes
            def calculate_change(current, previous):
                if previous == 0:
                    return 100.0 if current > 0 else 0.0
                return ((current - previous) / previous) * 100
            
            trends = {
                'total_change': calculate_change(current.get('current_total', 0), previous.get('previous_total', 0)),
                'high_risk_change': calculate_change(current.get('current_high_risk', 0), previous.get('previous_high_risk', 0)),
                'medium_risk_change': calculate_change(current.get('current_medium_risk', 0), previous.get('previous_medium_risk', 0)),
                'anomalies_change': calculate_change(current.get('current_anomalies', 0), previous.get('previous_anomalies', 0)),
                'root_users_change': calculate_change(current.get('current_root_users', 0), previous.get('previous_root_users', 0))
            }
            
            return trends
            
        except Exception as e:
            return {
                'total_change': 0.0,
                'high_risk_change': 0.0,
                'medium_risk_change': 0.0,
                'anomalies_change': 0.0,
                'root_users_change': 0.0
            }
    
    @staticmethod
    def get_recent_activity():
        """Get recent activity for the last 24 hours"""
        try:
            from datetime import datetime, timedelta
            yesterday = datetime.utcnow() - timedelta(days=1)
            
            # Get the most recent log entries from the last 24 hours
            recent_logs = list(logs_collection.find(
                {'timestamp': {'$gte': yesterday}}
            ).sort('timestamp', -1).limit(10))
            
            # Convert to the format expected by the frontend
            activity = []
            for log in recent_logs:
                activity.append({
                    'event_name': log.get('event_name', 'Unknown Event'),
                    'timestamp': log.get('timestamp', datetime.utcnow()).isoformat(),
                    'risk_level': log.get('risk_level', 'LOW'),
                    'source_ip': log.get('source_ip', 'Unknown IP'),
                    'user_identity_type': log.get('user_identity_type', 'Unknown User'),
                    'risk_score': log.get('risk_score', 0),
                    'anomaly_detected': log.get('anomaly_detected', False),
                    'rule_based_flags': log.get('rule_based_flags', 0)
                })
            
            return activity
        except Exception as e:
            return []

# User model for authentication
class User:
    def __init__(self, name, email, password=None, _id=None):
        self.name = name
        self.email = email.lower() if email else None
        self.password = password
        self._id = _id
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        user_data = db.users.find_one({"email": email.lower()})
        if user_data:
            return User(
                name=user_data['name'],
                email=user_data['email'],
                password=user_data['password'],
                _id=user_data['_id']
            )
        return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        from bson import ObjectId
        user_data = db.users.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(
                name=user_data['name'],
                email=user_data['email'],
                password=user_data['password'],
                _id=user_data['_id']
            )
        return None
    
    def save(self):
        """Save user to database"""
        user_data = {
            "name": self.name,
            "email": self.email,
            "password": self.password
        }
        if self._id:
            # Update existing user
            db.users.update_one({"_id": self._id}, {"$set": user_data})
        else:
            # Create new user
            result = db.users.insert_one(user_data)
            self._id = result.inserted_id
        return self

# Anomaly Detection Model
class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_fitted = False
    
    def fit(self, data):
        """Fit the anomaly detection model"""
        # Preprocess the data
        processed_data = self._preprocess_data(data)
        
        # Scale the features
        scaled_data = self.scaler.fit_transform(processed_data)
        
        # Initialize and fit the Isolation Forest model
        self.model = IsolationForest(
            contamination=0.1,  # Expected proportion of anomalies
            random_state=42,
            n_estimators=100
        )
        self.model.fit(scaled_data)
        self.is_fitted = True
    
    def predict(self, data):
        """Predict anomalies in the data"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
        
        try:
            # If we have a Pipeline, use it directly
            if hasattr(self.model, 'predict'):
                # The Pipeline handles preprocessing internally
                predictions = self.model.predict(data)
                
                # For Isolation Forest, -1 means anomaly, 1 means normal
                # Convert to boolean (True for anomalies, False for normal)
                anomalies = predictions == -1
                
                return anomalies
            else:
                # Use manual preprocessing
                processed_data = self._preprocess_data(data)
                
                # Apply feature scaling
                if self.scaler:
                    scaled_data = self.scaler.transform(processed_data)
                else:
                    scaled_data = processed_data
                
                # Make predictions (-1 for anomalies, 1 for normal)
                predictions = self.model.predict(scaled_data)
                
                # Convert to boolean (True for anomalies, False for normal)
                anomalies = predictions == -1
                
                return anomalies
                
        except Exception as e:
            raise
    
    def _preprocess_data(self, data):
        """Preprocess the input data for anomaly detection"""
        # Convert to DataFrame if it's not already
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = data
        
        # Select numerical features for anomaly detection
        numerical_columns = df.select_dtypes(include=[np.number]).columns
        
        if len(numerical_columns) == 0:
            raise ValueError("No numerical features found for anomaly detection")
        
        return df[numerical_columns]
    
    def save_model(self, filepath):
        """Save the trained model to disk"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before saving")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'is_fitted': self.is_fitted
        }
        joblib.dump(model_data, filepath)
    
    def load_model(self, filepath):
        """Load a trained model from disk"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        try:
            model_data = joblib.load(filepath)
            
            # Check if it's a Pipeline object (which is what we actually have)
            if hasattr(model_data, 'predict'):
                # It's a Pipeline or model object, use it directly
                self.model = model_data
                self.scaler = None  # Scaler is part of the pipeline
                self.is_fitted = True

            elif isinstance(model_data, dict):
                # It's a dictionary with separate components
                self.model = model_data.get('model')
                self.scaler = model_data.get('scaler')
                self.is_fitted = model_data.get('is_fitted', False)
            else:
                raise ValueError(f"Unknown model format: {type(model_data)}")
                
        except Exception as e:
            raise

# CSPM Calculator
class CSPMCalculator:
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
    
    def calculate_security_score(self, data):
        """Calculate CSPM security score based on input data"""
        try:
            # Load anomaly detection model if available
            model_path = 'aws_security_anomaly_detector_.pkl'
            if os.path.exists(model_path):
                self.anomaly_detector.load_model(model_path)
            
            # Detect anomalies
            anomalies = self.anomaly_detector.predict(data)
            
            # Calculate security score based on anomaly ratio
            anomaly_ratio = np.mean(anomalies)
            security_score = max(0, 100 - (anomaly_ratio * 100))
            
            return {
                'security_score': round(security_score, 2),
                'anomaly_ratio': round(anomaly_ratio, 4),
                'total_records': len(data),
                'anomalies_detected': int(np.sum(anomalies)),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'security_score': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    def analyze_logs(self, logs_data):
        """Analyze security logs for anomalies"""
        try:
            # Convert logs to DataFrame
            if isinstance(logs_data, list):
                df = pd.DataFrame(logs_data)
            else:
                df = logs_data
            
            # Load anomaly detection model if available
            model_path = 'aws_security_anomaly_detector_.pkl'
            if os.path.exists(model_path):
                try:
                    self.anomaly_detector.load_model(model_path)
                except Exception as e:
                    pass
            
            # Basic log analysis
            analysis_result = {
                'total_logs': len(df),
                'unique_sources': df.get('source', pd.Series()).nunique() if 'source' in df.columns else 0,
                'unique_events': df.get('event_type', pd.Series()).nunique() if 'event_type' in df.columns else 0,
                'timestamp_range': {
                    'start': df.get('timestamp', pd.Series()).min() if 'timestamp' in df.columns else None,
                    'end': df.get('timestamp', pd.Series()).max() if 'timestamp' in df.columns else None
                }
            }
            
            # Perform anomaly detection if model is fitted
            try:
                if self.anomaly_detector.is_fitted:
                    anomalies = self.anomaly_detector.predict(df)
                    analysis_result['anomalies_detected'] = int(np.sum(anomalies))
                    analysis_result['anomaly_ratio'] = round(np.mean(anomalies), 4)
                else:
                    # Model not loaded, use rule-based detection only
                    analysis_result['anomalies_detected'] = 0
                    analysis_result['anomaly_ratio'] = 0
                    analysis_result['model_loaded'] = False
            except Exception as e:
                analysis_result['anomalies_detected'] = 0
                analysis_result['anomaly_ratio'] = 0
                analysis_result['model_error'] = str(e)
            
            return analysis_result
        
        except Exception as e:
            return {
                'error': str(e),
                'total_logs': 0
            } 