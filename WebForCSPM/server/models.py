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

# Initialize MongoDB connection
client = MongoClient(Config.MONGODB_URI)
db = client.get_database('DataForCSPM')  # Explicitly specify the database name

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
        
        # Preprocess the data
        processed_data = self._preprocess_data(data)
        
        # Scale the features
        scaled_data = self.scaler.transform(processed_data)
        
        # Make predictions (-1 for anomalies, 1 for normal)
        predictions = self.model.predict(scaled_data)
        
        # Convert to boolean (True for anomalies, False for normal)
        anomalies = predictions == -1
        
        return anomalies
    
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
        
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.is_fitted = model_data['is_fitted']

# CSPM Calculator
class CSPMCalculator:
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
    
    def calculate_security_score(self, data):
        """Calculate CSPM security score based on input data"""
        try:
            # Load pre-trained model if available
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
            
            # Load pre-trained model if available
            model_path = 'aws_security_anomaly_detector_.pkl'
            if os.path.exists(model_path):
                try:
                    self.anomaly_detector.load_model(model_path)
                except Exception as e:
                    print(f"Warning: Could not load model from {model_path}: {e}")
            
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
            
            # Detect anomalies if model is available and fitted
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