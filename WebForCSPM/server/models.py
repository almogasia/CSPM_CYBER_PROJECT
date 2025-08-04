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
deployments_collection = db.deployments
tickets_collection = db.tickets

class LogEntry:
    def __init__(self, event_id, event_name, user_identity_type, source_ip, 
                 risk_score, risk_level, model_loaded, anomaly_detected, 
                 rule_based_flags, timestamp=None, user_id=None, **kwargs):
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
        self.user_id = user_id  # Associate log with specific user
        
        # Store all 18 features from the original log
        self.eventID = kwargs.get('eventID')
        self.eventTime = kwargs.get('eventTime')
        self.sourceIPAddress = kwargs.get('sourceIPAddress')
        self.userAgent = kwargs.get('userAgent')
        self.eventSource = kwargs.get('eventSource')
        self.awsRegion = kwargs.get('awsRegion')
        self.eventVersion = kwargs.get('eventVersion')
        self.userIdentitytype = kwargs.get('userIdentitytype')
        self.eventType = kwargs.get('eventType')
        self.userIdentityaccountId = kwargs.get('userIdentityaccountId')
        self.userIdentityprincipalId = kwargs.get('userIdentityprincipalId')
        self.userIdentityarn = kwargs.get('userIdentityarn')
        self.userIdentityaccessKeyId = kwargs.get('userIdentityaccessKeyId')
        self.userIdentityuserName = kwargs.get('userIdentityuserName')
        self.errorCode = kwargs.get('errorCode')
        self.errorMessage = kwargs.get('errorMessage')
        self.requestParametersinstanceType = kwargs.get('requestParametersinstanceType')
    
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
            'timestamp': self.timestamp,
            'user_id': self.user_id,  # Include user_id in the dictionary
            # All 18 features from the original log
            'eventID': self.eventID,
            'eventTime': self.eventTime,
            'sourceIPAddress': self.sourceIPAddress,
            'userAgent': self.userAgent,
            'eventSource': self.eventSource,
            'awsRegion': self.awsRegion,
            'eventVersion': self.eventVersion,
            'userIdentitytype': self.userIdentitytype,
            'eventType': self.eventType,
            'userIdentityaccountId': self.userIdentityaccountId,
            'userIdentityprincipalId': self.userIdentityprincipalId,
            'userIdentityarn': self.userIdentityarn,
            'userIdentityaccessKeyId': self.userIdentityaccessKeyId,
            'userIdentityuserName': self.userIdentityuserName,
            'errorCode': self.errorCode,
            'errorMessage': self.errorMessage,
            'requestParametersinstanceType': self.requestParametersinstanceType
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
            timestamp=data.get('timestamp'),
            user_id=data.get('user_id')
        )

class LogManager:
    @staticmethod
    def add_log(log_entry):
        """Add a new log entry and maintain only the latest 10000 logs per user"""
        try:
            # Get user_id from the log entry
            user_id = log_entry.user_id
    
            
            # Insert the new log
            logs_collection.insert_one(log_entry.to_dict())
            
            # Update user's log count atomically using MongoDB's atomic operations
            from pymongo import UpdateOne
            from bson import ObjectId
            
            # First, ensure the user has a log_count field
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if user and 'log_count' not in user:
        
                # Initialize log_count to current log count
                current_count = logs_collection.count_documents({'user_id': user_id})
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'log_count': current_count}}
                )
            
            # Increment the log count and get the new value atomically
            result = db.users.find_one_and_update(
                {'_id': ObjectId(user_id)},
                {'$inc': {'log_count': 1}},
                return_document=True
            )
            
    
            
            if result and result.get('log_count', 0) > 10000:
        
                # We're over the limit, do cleanup
                newest_10000 = list(logs_collection.find({'user_id': user_id}).sort('timestamp', -1).limit(10000))
                if newest_10000:
                    cutoff_timestamp = newest_10000[-1]['timestamp']
                    # Delete everything older than the 10000th newest log
                    deleted_count = logs_collection.delete_many({
                        'user_id': user_id,
                        'timestamp': {'$lt': cutoff_timestamp}
                    }).deleted_count
                    
            
                    
                    # Reset the log count to 10000
                    db.users.update_one(
                        {'_id': ObjectId(user_id)},
                        {'$set': {'log_count': 10000}}
                    )
            
            
            return True
        except Exception as e:
            print(f"Error adding log: {e}")
            return False
    
    @staticmethod
    def get_logs(limit=50, skip=0, user_id=None, log_ids=None):
        """Get logs with pagination, filtered by user if specified and optionally by log_ids"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            
            # Add log_ids filter if provided
            if log_ids:
                from bson import ObjectId
                # Convert string IDs to ObjectId for MongoDB query
                object_ids = [ObjectId(log_id) for log_id in log_ids if log_id]
                if object_ids:
                    query['_id'] = {'$in': object_ids}
            
            logs = list(logs_collection.find(query).sort('timestamp', -1).skip(skip).limit(limit))
            return logs
        except Exception as e:
            print(f"Error getting logs: {e}")
            return []
    
    @staticmethod
    def get_logs_count(user_id=None, log_ids=None):
        """Get total number of logs, filtered by user if specified and optionally by log_ids"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            
            # Add log_ids filter if provided
            if log_ids:
                from bson import ObjectId
                # Convert string IDs to ObjectId for MongoDB query
                object_ids = [ObjectId(log_id) for log_id in log_ids if log_id]
                if object_ids:
                    query['_id'] = {'$in': object_ids}
            
            return logs_collection.count_documents(query)
        except Exception as e:
            print(f"Error getting logs count: {e}")
            return 0
    
    @staticmethod
    def get_stats(user_id=None):
        """Get aggregated statistics from logs, filtered by user if specified"""
        try:
            match_stage = {}
            if user_id:
                match_stage['user_id'] = user_id
            
            pipeline = []
            if match_stage:
                pipeline.append({'$match': match_stage})
            
            pipeline.append({
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
                    'critical_risk_count': {
                        '$sum': {'$cond': [{'$eq': ['$risk_level', 'CRITICAL']}, 1, 0]}
                    },
                    'anomaly_count': {
                        '$sum': {'$cond': ['$anomaly_detected', 1, 0]}
                    },
                    'root_user_count': {
                        '$sum': {'$cond': [{'$eq': ['$user_identity_type', 'Root']}, 1, 0]}
                    }
                }
            })
            
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
    def get_trends(user_id=None):
        """Calculate trend percentages for the last 24 hours vs previous 24 hours, filtered by user if specified"""
        try:
            from datetime import datetime, timedelta
            
            now = datetime.utcnow()
            yesterday = now - timedelta(days=1)
            two_days_ago = now - timedelta(days=2)
            
            # Build match conditions
            current_match = {'timestamp': {'$gte': yesterday}}
            previous_match = {'timestamp': {'$gte': two_days_ago, '$lt': yesterday}}
            
            if user_id:
                current_match['user_id'] = user_id
                previous_match['user_id'] = user_id
            
            # Last 24 hours
            current_pipeline = [
                {'$match': current_match},
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
                {'$match': previous_match},
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
    def get_recent_activity(user_id=None):
        """Get recent activity for the last 24 hours, filtered by user if specified"""
        try:
            from datetime import datetime, timedelta
            yesterday = datetime.utcnow() - timedelta(days=1)
            
            # Build query
            query = {'timestamp': {'$gte': yesterday}}
            if user_id:
                query['user_id'] = user_id
            
            # Get the most recent log entries from the last 24 hours
            recent_logs = list(logs_collection.find(query).sort('timestamp', -1).limit(10))
            
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
    def get_urgent_issue_groups(time_window_minutes=10, min_group_size=3, user_id=None):
        """Group logs by user_identity_type, source_ip, and time window. Return groups with >= min_group_size logs."""
        try:
            from datetime import datetime, timedelta
            from bson import ObjectId
            
            # Build query
            query = {}
            if user_id:
                query['user_id'] = user_id
            
            # Fetch all logs sorted by timestamp ascending
            logs = list(logs_collection.find(query).sort('timestamp', 1))
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

# User model for authentication
class User:
    def __init__(self, name, email, password=None, _id=None, log_count=0, deployment_count=0, ticket_count=0):
        self.name = name
        self.email = email.lower() if email else None
        self.password = password
        self._id = _id
        self.log_count = log_count
        self.deployment_count = deployment_count
        self.ticket_count = ticket_count
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        user_data = db.users.find_one({"email": email.lower()})
        if user_data:
            return User(
                name=user_data['name'],
                email=user_data['email'],
                password=user_data['password'],
                _id=user_data['_id'],
                log_count=user_data.get('log_count', 0),
                deployment_count=user_data.get('deployment_count', 0),
                ticket_count=user_data.get('ticket_count', 0)
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
                _id=user_data['_id'],
                log_count=user_data.get('log_count', 0),
                deployment_count=user_data.get('deployment_count', 0),
                ticket_count=user_data.get('ticket_count', 0)
            )
        return None
    
    def save(self):
        """Save user to database"""
        user_data = {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "log_count": self.log_count,
            "deployment_count": self.deployment_count,
            "ticket_count": self.ticket_count
        }
        if self._id:
            # Update existing user
            db.users.update_one({"_id": self._id}, {"$set": user_data})
        else:
            # Create new user
            result = db.users.insert_one(user_data)
            self._id = result.inserted_id
        return self

class Deployment:
    def __init__(self, file_name, file_type, file_size, deployment_type, status="pending", timestamp=None, user_id=None, _id=None, 
                 file_created_time=None, file_modified_time=None, file_accessed_time=None, file_extension=None, 
                 file_path=None, file_owner=None, file_permissions=None, file_hash=None, file_encoding=None,
                 file_description=None, deployment_notes=None, target_environment=None, deployment_duration=None,
                 resources_allocated=None, security_scan_results=None, compliance_status=None):
        self.file_name = file_name
        self.file_type = file_type
        self.file_size = file_size
        self.deployment_type = deployment_type
        self.status = status
        self.timestamp = timestamp or datetime.utcnow()
        self.user_id = user_id
        self._id = _id
        
        self.file_created_time = file_created_time
        self.file_modified_time = file_modified_time
        self.file_accessed_time = file_accessed_time
        self.file_extension = file_extension
        self.file_path = file_path
        self.file_owner = file_owner
        self.file_permissions = file_permissions
        self.file_hash = file_hash
        self.file_encoding = file_encoding
        self.file_description = file_description
        
        # Deployment details
        self.deployment_notes = deployment_notes
        self.target_environment = target_environment
        self.deployment_duration = deployment_duration
        self.resources_allocated = resources_allocated
        self.security_scan_results = security_scan_results
        self.compliance_status = compliance_status
    
    def to_dict(self):
        return {
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'deployment_type': self.deployment_type,
            'status': self.status,
            'timestamp': self.timestamp,
            'user_id': self.user_id,
            
            'file_created_time': self.file_created_time,
            'file_modified_time': self.file_modified_time,
            'file_accessed_time': self.file_accessed_time,
            'file_extension': self.file_extension,
            'file_path': self.file_path,
            'file_owner': self.file_owner,
            'file_permissions': self.file_permissions,
            'file_hash': self.file_hash,
            'file_encoding': self.file_encoding,
            'file_description': self.file_description,
            
            # Deployment details
            'deployment_notes': self.deployment_notes,
            'target_environment': self.target_environment,
            'deployment_duration': self.deployment_duration,
            'resources_allocated': self.resources_allocated,
            'security_scan_results': self.security_scan_results,
            'compliance_status': self.compliance_status
        }
    
    @staticmethod
    def from_dict(data):
        return Deployment(
            file_name=data.get('file_name'),
            file_type=data.get('file_type'),
            file_size=data.get('file_size'),
            deployment_type=data.get('deployment_type'),
            status=data.get('status'),
            timestamp=data.get('timestamp'),
            user_id=data.get('user_id'),
            _id=data.get('_id'),
            
            file_created_time=data.get('file_created_time'),
            file_modified_time=data.get('file_modified_time'),
            file_accessed_time=data.get('file_accessed_time'),
            file_extension=data.get('file_extension'),
            file_path=data.get('file_path'),
            file_owner=data.get('file_owner'),
            file_permissions=data.get('file_permissions'),
            file_hash=data.get('file_hash'),
            file_encoding=data.get('file_encoding'),
            file_description=data.get('file_description'),
            
            # Deployment details
            deployment_notes=data.get('deployment_notes'),
            target_environment=data.get('target_environment'),
            deployment_duration=data.get('deployment_duration'),
            resources_allocated=data.get('resources_allocated'),
            security_scan_results=data.get('security_scan_results'),
            compliance_status=data.get('compliance_status')
        )

class DeploymentManager:
    @staticmethod
    def add_deployment(deployment):
        """Add a new deployment and maintain only the latest 100 deployments per user"""
        try:
            # Get user_id from the deployment
            user_id = deployment.user_id
    
            
            # Insert the new deployment
            deployments_collection.insert_one(deployment.to_dict())
            
            # Update user's deployment count atomically using MongoDB's atomic operations
            from pymongo import UpdateOne
            from bson import ObjectId
            
            # First, ensure the user has a deployment_count field
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if user and 'deployment_count' not in user:
        
                # Initialize deployment_count to current deployment count
                current_count = deployments_collection.count_documents({'user_id': user_id})
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'deployment_count': current_count}}
                )
            
            # Increment the deployment count and get the new value atomically
            result = db.users.find_one_and_update(
                {'_id': ObjectId(user_id)},
                {'$inc': {'deployment_count': 1}},
                return_document=True
            )
            
    
            
            if result and result.get('deployment_count', 0) > 100:
        
                # We're over the limit, do cleanup
                newest_100 = list(deployments_collection.find({'user_id': user_id}).sort('timestamp', -1).limit(100))
                if newest_100:
                    cutoff_timestamp = newest_100[-1]['timestamp']
                    # Delete everything older than the 100th newest deployment
                    deleted_count = deployments_collection.delete_many({
                        'user_id': user_id,
                        'timestamp': {'$lt': cutoff_timestamp}
                    }).deleted_count
                    
            
                    
                    # Reset the deployment count to 100
                    db.users.update_one(
                        {'_id': ObjectId(user_id)},
                        {'$set': {'deployment_count': 100}}
                    )
            
            
            return True
        except Exception as e:
            print(f"Error adding deployment: {e}")
            return False
    
    @staticmethod
    def get_deployments(user_id=None):
        """Get deployments for a user, filtered by user if specified"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            
            deployments = list(deployments_collection.find(query).sort('timestamp', -1))
            return deployments
        except Exception as e:
            print(f"Error getting deployments: {e}")
            return []
    
    @staticmethod
    def get_deployments_count(user_id=None):
        """Get total number of deployments, filtered by user if specified"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            
            return deployments_collection.count_documents(query)
        except Exception as e:
            print(f"Error getting deployments count: {e}")
            return 0

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

class Ticket:
    def __init__(self, title, description, priority, status, log_ids, user_id, assigned_to=None, 
                 created_at=None, updated_at=None, due_date=None, tags=None, notes=None, _id=None):
        self.title = title
        self.description = description
        self.priority = priority  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
        self.status = status  # "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"
        self.log_ids = log_ids if isinstance(log_ids, list) else [log_ids]  # Array of log IDs associated with this ticket
        self.user_id = user_id  # User who created the ticket
        self.assigned_to = assigned_to  # User assigned to handle the ticket
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self.due_date = due_date
        self.tags = tags or []
        self.notes = notes or []
        self._id = _id
    
    def to_dict(self):
        return {
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'log_ids': self.log_ids,
            'user_id': self.user_id,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'due_date': self.due_date,
            'tags': self.tags,
            'notes': self.notes
        }
    
    @staticmethod
    def from_dict(data):
        return Ticket(
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority'),
            status=data.get('status'),
            log_ids=data.get('log_ids', [data.get('log_id')] if data.get('log_id') else []),  # Handle migration from log_id to log_ids
            user_id=data.get('user_id'),
            assigned_to=data.get('assigned_to'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            due_date=data.get('due_date'),
            tags=data.get('tags', []),
            notes=data.get('notes', []),
            _id=data.get('_id')
        )

class TicketManager:
    @staticmethod
    def create_ticket(ticket):
        """Create a new ticket and maintain only the latest 100 tickets per user"""
        try:
            # Get user_id from the ticket
            user_id = ticket.user_id
    
            
            # Insert the new ticket
            result = tickets_collection.insert_one(ticket.to_dict())
            ticket._id = result.inserted_id
            
            # Update user's ticket count atomically using MongoDB's atomic operations
            from pymongo import UpdateOne
            from bson import ObjectId
            
            # First, ensure the user has a ticket_count field
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if user and 'ticket_count' not in user:
        
                # Initialize ticket_count to current ticket count
                current_count = tickets_collection.count_documents({'user_id': user_id})
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': {'ticket_count': current_count}}
                )
            
            # Increment the ticket count and get the new value atomically
            result = db.users.find_one_and_update(
                {'_id': ObjectId(user_id)},
                {'$inc': {'ticket_count': 1}},
                return_document=True
            )
            
    
            
            if result and result.get('ticket_count', 0) > 100:
        
                # We're over the limit, do cleanup
                newest_100 = list(tickets_collection.find({'user_id': user_id}).sort('created_at', -1).limit(100))
                if newest_100:
                    cutoff_timestamp = newest_100[-1]['created_at']
                    # Delete everything older than the 100th newest ticket
                    deleted_count = tickets_collection.delete_many({
                        'user_id': user_id,
                        'created_at': {'$lt': cutoff_timestamp}
                    }).deleted_count
                    
            
                    
                    # Reset the ticket count to 100
                    db.users.update_one(
                        {'_id': ObjectId(user_id)},
                        {'$set': {'ticket_count': 100}}
                    )
            
            
            return ticket
        except Exception as e:
            print(f"Error creating ticket: {e}")
            return None
    
    @staticmethod
    def get_tickets(user_id=None, status=None, priority=None, limit=50, skip=0):
        """Get tickets with optional filtering"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            if status:
                query['status'] = status
            if priority:
                query['priority'] = priority
            
            tickets = list(tickets_collection.find(query).sort('created_at', -1).skip(skip).limit(limit))
            return tickets
        except Exception as e:
            print(f"Error getting tickets: {e}")
            return []
    
    @staticmethod
    def get_ticket_by_id(ticket_id):
        """Get a specific ticket by ID"""
        try:
            from bson import ObjectId
            ticket_data = tickets_collection.find_one({'_id': ObjectId(ticket_id)})
            if ticket_data:
                return Ticket.from_dict(ticket_data)
            return None
        except Exception as e:
            print(f"Error getting ticket by ID: {e}")
            return None
    
    @staticmethod
    def update_ticket(ticket_id, update_data):
        """Update a ticket"""
        try:
            from bson import ObjectId
            update_data['updated_at'] = datetime.utcnow()
            result = tickets_collection.update_one(
                {'_id': ObjectId(ticket_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating ticket: {e}")
            return False
    
    @staticmethod
    def delete_ticket(ticket_id):
        """Delete a ticket and update user's ticket count"""
        try:
            from bson import ObjectId
            
            # Get the ticket first to get the user_id
            ticket_data = tickets_collection.find_one({'_id': ObjectId(ticket_id)})
            if not ticket_data:
                return False
            
            user_id = ticket_data.get('user_id')
            
            # Delete the ticket
            result = tickets_collection.delete_one({'_id': ObjectId(ticket_id)})
            
            if result.deleted_count > 0 and user_id:
                # Decrement the user's ticket count
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$inc': {'ticket_count': -1}}
                )
                print(f"Decremented ticket count for user {user_id}")
            
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting ticket: {e}")
            return False
    
    @staticmethod
    def get_tickets_count(user_id=None, status=None, priority=None):
        """Get total number of tickets with optional filtering"""
        try:
            query = {}
            if user_id:
                query['user_id'] = user_id
            if status:
                query['status'] = status
            if priority:
                query['priority'] = priority
            
            return tickets_collection.count_documents(query)
        except Exception as e:
            print(f"Error getting tickets count: {e}")
            return 0
    
    @staticmethod
    def get_ticket_stats(user_id=None):
        """Get ticket statistics"""
        try:
            match_stage = {}
            if user_id:
                match_stage['user_id'] = user_id
            
            pipeline = []
            if match_stage:
                pipeline.append({'$match': match_stage})
            
            pipeline.append({
                '$group': {
                    '_id': None,
                    'total_tickets': {'$sum': 1},
                    'open_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'OPEN']}, 1, 0]}
                    },
                    'in_progress_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'IN_PROGRESS']}, 1, 0]}
                    },
                    'resolved_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'RESOLVED']}, 1, 0]}
                    },
                    'closed_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$status', 'CLOSED']}, 1, 0]}
                    },
                    'critical_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$priority', 'CRITICAL']}, 1, 0]}
                    },
                    'high_priority_tickets': {
                        '$sum': {'$cond': [{'$eq': ['$priority', 'HIGH']}, 1, 0]}
                    }
                }
            })
            
            result = list(tickets_collection.aggregate(pipeline))
            if result:
                stats = result[0]
                stats.pop('_id', None)
                return stats
            else:
                return {
                    'total_tickets': 0,
                    'open_tickets': 0,
                    'in_progress_tickets': 0,
                    'resolved_tickets': 0,
                    'closed_tickets': 0,
                    'critical_tickets': 0,
                    'high_priority_tickets': 0
                }
        except Exception as e:
            print(f"Error getting ticket stats: {e}")
            return {
                'total_tickets': 0,
                'open_tickets': 0,
                'in_progress_tickets': 0,
                'resolved_tickets': 0,
                'closed_tickets': 0,
                'critical_tickets': 0,
                'high_priority_tickets': 0
            }
    
    @staticmethod
    def get_ticket_by_log_id(log_id, user_id=None):
        """Get ticket that contains a specific log ID"""
        try:
            query = {'log_ids': log_id}
            if user_id:
                query['user_id'] = user_id
            
            ticket_data = tickets_collection.find_one(query)
            if ticket_data:
                return Ticket.from_dict(ticket_data)
            return None
        except Exception as e:
            print(f"Error getting ticket by log ID: {e}")
            return None
    
    @staticmethod
    def add_log_to_ticket(ticket_id, log_id):
        """Add a log ID to an existing ticket"""
        try:
            from bson import ObjectId
            result = tickets_collection.update_one(
                {'_id': ObjectId(ticket_id)},
                {'$addToSet': {'log_ids': log_id}, '$set': {'updated_at': datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error adding log to ticket: {e}")
            return False
    
    @staticmethod
    def get_all_tickets_for_user(user_id):
        """Get all tickets for a user (for dropdown selection)"""
        try:
            tickets = list(tickets_collection.find({'user_id': user_id}).sort('created_at', -1))
            return [Ticket.from_dict(ticket) for ticket in tickets]
        except Exception as e:
            print(f"Error getting all tickets for user: {e}")
            return [] 