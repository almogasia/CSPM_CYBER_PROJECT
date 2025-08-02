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
            print(f"Error adding log: {e}")
            return False
    
    @staticmethod
    def get_logs(limit=50, skip=0):
        """Get logs with pagination"""
        try:
            logs = list(logs_collection.find().sort('timestamp', -1).skip(skip).limit(limit))
            return logs
        except Exception as e:
            print(f"Error getting logs: {e}")
            return []
    
    @staticmethod
    def get_logs_count():
        """Get total number of logs"""
        try:
            return logs_collection.count_documents({})
        except Exception as e:
            print(f"Error getting logs count: {e}")
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
            print(f"Error getting stats: {e}")
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
            print(f"Error calculating trends: {e}")
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
            print(f"Error getting recent activity: {e}")
            return []

    @staticmethod
    def get_urgent_issue_groups(time_window_minutes=10, min_group_size=3):
        """Group logs by user_identity_type, source_ip, and time window. Return groups with >= min_group_size logs."""
        try:
            from datetime import datetime, timedelta
            from bson import ObjectId
            # Fetch all logs sorted by timestamp ascending
            logs = list(logs_collection.find().sort('timestamp', 1))
            groups = []
            used = set()
            for i, log in enumerate(logs):
                if i in used:
                    continue
                group = [log]
                used.add(i)
                t0 = log.get('timestamp')
                user = log.get('user_identity_type')
                ip = log.get('source_ip')
                # Group logs within the time window, same user and IP
                for j in range(i+1, len(logs)):
                    other = logs[j]
                    if j in used:
                        continue
                    if (other.get('user_identity_type') == user and
                        other.get('source_ip') == ip and
                        abs((other.get('timestamp') - t0).total_seconds()) <= time_window_minutes * 60):
                        group.append(other)
                        used.add(j)
                
                if len(group) >= min_group_size:
                    # Determine the main reason for grouping
                    time_span = (group[-1].get('timestamp') - group[0].get('timestamp')).total_seconds() / 60
                    unique_users = len(set(g.get('user_identity_type') for g in group))
                    unique_ips = len(set(g.get('source_ip') for g in group))
                    
                    if time_span <= 2:  # Very short time span
                        main_reason = f"Rapid activity within {time_span:.1f} minutes"
                    elif unique_users == 1 and unique_ips == 1:
                        main_reason = f"Same user ({user}) from same IP ({ip}) over {time_span:.1f} minutes"
                    elif unique_users == 1:
                        main_reason = f"Same user ({user}) from multiple IPs over {time_span:.1f} minutes"
                    elif unique_ips == 1:
                        main_reason = f"Multiple users from same IP ({ip}) over {time_span:.1f} minutes"
                    else:
                        main_reason = f"Activity cluster over {time_span:.1f} minutes"
                    
                    groups.append({
                        'user_identity_type': user,
                        'source_ip': ip,
                        'start_time': group[0].get('timestamp').isoformat() if group else None,
                        'end_time': group[-1].get('timestamp').isoformat() if group else None,
                        'main_reason': main_reason,
                        'logs': [
                            {k: (str(v) if k == '_id' and isinstance(v, ObjectId) else (v.isoformat() if k == 'timestamp' and hasattr(v, 'isoformat') else v)) for k, v in g.items()}
                            for g in group
                        ]
                    })
            return groups
        except Exception as e:
            print(f"Error grouping urgent issues: {e}")
            return []

    @staticmethod
    def get_chart_data():
        """Get chart data for pie charts showing distributions"""
        try:
            # Event Type Distribution
            event_type_pipeline = [
                {
                    '$group': {
                        '_id': '$event_name',
                        'count': {'$sum': 1}
                    }
                },
                {
                    '$sort': {'count': -1}
                },
                {
                    '$limit': 6  # Top 6 event types
                }
            ]
            
            event_type_result = list(logs_collection.aggregate(event_type_pipeline))
            event_type_labels = [item['_id'] for item in event_type_result]
            event_type_data = [item['count'] for item in event_type_result]
            
            # User Identity Types Distribution
            user_identity_pipeline = [
                {
                    '$group': {
                        '_id': '$user_identity_type',
                        'count': {'$sum': 1}
                    }
                },
                {
                    '$sort': {'count': -1}
                },
                {
                    '$limit': 5  # Top 5 user identity types
                }
            ]
            
            user_identity_result = list(logs_collection.aggregate(user_identity_pipeline))
            user_identity_labels = [item['_id'] for item in user_identity_result]
            user_identity_data = [item['count'] for item in user_identity_result]
            
            # Error Codes Distribution (mock data since we don't store error codes)
            # In a real implementation, you would extract error codes from logs
            error_codes_labels = ["NoError", "AccessDenied", "UnauthorizedOperation", "InvalidParameter", "Other"]
            error_codes_data = [70, 15, 8, 5, 2]  # Mock percentages
            
            # Color schemes for charts
            colors = [
                "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280",
                "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#A855F7", "#64748B"
            ]
            
            # If no real data, use fallback data
            if not event_type_labels:
                event_type_labels = ["AwsApiCall", "ConsoleLogin", "CreateUser", "DeleteUser", "ModifyUser", "Other"]
                event_type_data = [45, 25, 12, 8, 6, 4]
            
            if not user_identity_labels:
                user_identity_labels = ["IAMUser", "Root", "AssumedRole", "FederatedUser", "Other"]
                user_identity_data = [60, 15, 12, 8, 5]
            
            return {
                'eventTypeDistribution': {
                    'labels': event_type_labels,
                    'datasets': [{
                        'data': event_type_data,
                        'backgroundColor': colors[:len(event_type_labels)],
                        'borderColor': colors[:len(event_type_labels)],
                        'borderWidth': 2
                    }]
                },
                'userIdentityTypes': {
                    'labels': user_identity_labels,
                    'datasets': [{
                        'data': user_identity_data,
                        'backgroundColor': colors[:len(user_identity_labels)],
                        'borderColor': colors[:len(user_identity_labels)],
                        'borderWidth': 2
                    }]
                },
                'errorCodes': {
                    'labels': error_codes_labels,
                    'datasets': [{
                        'data': error_codes_data,
                        'backgroundColor': colors[:len(error_codes_labels)],
                        'borderColor': colors[:len(error_codes_labels)],
                        'borderWidth': 2
                    }]
                },
                # Line Charts
                'eventsOverTime': {
                    'labels': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    'datasets': [{
                        'label': "Total Events",
                        'data': [120, 145, 132, 168, 189, 156, 142],
                        'borderColor': "#3B82F6",
                        'backgroundColor': "rgba(59, 130, 246, 0.1)",
                        'tension': 0.4
                    }]
                },
                'errorsOverTime': {
                    'labels': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    'datasets': [{
                        'label': "Errors",
                        'data': [12, 18, 15, 22, 25, 19, 16],
                        'borderColor': "#EF4444",
                        'backgroundColor': "rgba(239, 68, 68, 0.1)",
                        'tension': 0.4
                    }]
                },
                'highRiskEventsTrend': {
                    'labels': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    'datasets': [{
                        'label': "High Risk Events",
                        'data': [8, 12, 9, 15, 18, 11, 10],
                        'borderColor': "#DC2626",
                        'backgroundColor': "rgba(220, 38, 38, 0.1)",
                        'tension': 0.4
                    }]
                },
                # Bar Charts
                'topEventNames': {
                    'labels': ["AwsApiCall", "ConsoleLogin", "CreateUser", "DeleteUser", "ModifyUser"],
                    'datasets': [{
                        'label': "Event Count",
                        'data': [45, 25, 12, 8, 6],
                        'backgroundColor': ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
                        'borderColor': ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
                        'borderWidth': 1
                    }]
                },
                'topIpSources': {
                    'labels': ["192.168.1.100", "10.0.0.50", "172.16.0.25", "203.0.113.0", "198.51.100.0"],
                    'datasets': [{
                        'label': "Request Count",
                        'data': [156, 89, 67, 45, 32],
                        'backgroundColor': ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
                        'borderColor': ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
                        'borderWidth': 1
                    }]
                },
                'topIamUsers': {
                    'labels': ["admin", "developer", "root", "user1", "user2"],
                    'datasets': [{
                        'label': "Event Count",
                        'data': [89, 67, 45, 32, 28],
                        'backgroundColor': ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
                        'borderColor': ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
                        'borderWidth': 1
                    }]
                },
                'regionActivity': {
                    'labels': ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
                    'datasets': [{
                        'label': "Log Count",
                        'data': [234, 189, 156, 123, 89],
                        'backgroundColor': ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
                        'borderColor': ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
                        'borderWidth': 1
                    }]
                },
                # Stacked Area Charts
                'userActivityByType': {
                    'labels': ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    'datasets': [
                        {
                            'label': "AwsApiCall",
                            'data': [45, 52, 48, 61, 67, 58, 49],
                            'borderColor': "#3B82F6",
                            'backgroundColor': "rgba(59, 130, 246, 0.3)",
                            'fill': True
                        },
                        {
                            'label': "ConsoleLogin",
                            'data': [25, 28, 22, 31, 35, 29, 26],
                            'borderColor': "#10B981",
                            'backgroundColor': "rgba(16, 185, 129, 0.3)",
                            'fill': True
                        },
                        {
                            'label': "CreateUser",
                            'data': [12, 15, 11, 18, 22, 16, 13],
                            'borderColor': "#F59E0B",
                            'backgroundColor': "rgba(245, 158, 11, 0.3)",
                            'fill': True
                        }
                    ]
                },
                'eventTypePerRegion': {
                    'labels': ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
                    'datasets': [
                        {
                            'label': "AwsApiCall",
                            'data': [89, 67, 45, 32, 28],
                            'borderColor': "#3B82F6",
                            'backgroundColor': "rgba(59, 130, 246, 0.3)",
                            'fill': True
                        },
                        {
                            'label': "ConsoleLogin",
                            'data': [45, 38, 29, 21, 18],
                            'borderColor': "#10B981",
                            'backgroundColor': "rgba(16, 185, 129, 0.3)",
                            'fill': True
                        },
                        {
                            'label': "CreateUser",
                            'data': [23, 19, 15, 11, 9],
                            'borderColor': "#F59E0B",
                            'backgroundColor': "rgba(245, 158, 11, 0.3)",
                            'fill': True
                        }
                    ]
                },
                # Heatmaps
                'hourlyActivityHeatmap': {
                    'labels': ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
                    'datasets': [{
                        'label': "Activity Level",
                        'data': [15, 8, 45, 89, 67, 34],
                        'backgroundColor': ["#10B981", "#34D399", "#6EE7B7", "#F59E0B", "#EF4444", "#DC2626"],
                        'borderColor': ["#059669", "#10B981", "#34D399", "#D97706", "#DC2626", "#B91C1C"],
                        'borderWidth': 1
                    }]
                },
                'regionVsEventTypeHeatmap': {
                    'labels': ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
                    'datasets': [{
                        'label': "Event Count",
                        'data': [234, 189, 156, 123, 89],
                        'backgroundColor': ["#10B981", "#34D399", "#6EE7B7", "#F59E0B", "#EF4444"],
                        'borderColor': ["#059669", "#10B981", "#34D399", "#D97706", "#DC2626"],
                        'borderWidth': 1
                    }]
                }
            }
        except Exception as e:
            print(f"Error getting chart data: {e}")
            # Return fallback data
            return {
                'eventTypeDistribution': {
                    'labels': ["AwsApiCall", "ConsoleLogin", "CreateUser", "DeleteUser", "ModifyUser", "Other"],
                    'datasets': [{
                        'data': [45, 25, 12, 8, 6, 4],
                        'backgroundColor': ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"],
                        'borderColor': ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#4B5563"],
                        'borderWidth': 2
                    }]
                },
                'userIdentityTypes': {
                    'labels': ["IAMUser", "Root", "AssumedRole", "FederatedUser", "Other"],
                    'datasets': [{
                        'data': [60, 15, 12, 8, 5],
                        'backgroundColor': ["#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#6B7280"],
                        'borderColor': ["#059669", "#DC2626", "#2563EB", "#D97706", "#4B5563"],
                        'borderWidth': 2
                    }]
                },
                'errorCodes': {
                    'labels': ["NoError", "AccessDenied", "UnauthorizedOperation", "InvalidParameter", "Other"],
                    'datasets': [{
                        'data': [70, 15, 8, 5, 2],
                        'backgroundColor': ["#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#6B7280"],
                        'borderColor': ["#059669", "#DC2626", "#D97706", "#2563EB", "#4B5563"],
                        'borderWidth': 2
                    }]
                }
            }

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
                # Fallback to manual preprocessing
                processed_data = self._preprocess_data(data)
                
                # Scale the features if scaler is available
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
            print(f"Error in prediction: {e}")
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
                print(f"Loaded model: {type(model_data)}")
            elif isinstance(model_data, dict):
                # It's a dictionary with separate components
                self.model = model_data.get('model')
                self.scaler = model_data.get('scaler')
                self.is_fitted = model_data.get('is_fitted', False)
            else:
                raise ValueError(f"Unknown model format: {type(model_data)}")
                
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

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