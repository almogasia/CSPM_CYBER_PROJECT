from flask import Blueprint, request, jsonify
from models import LogEntry, LogManager
import os

api_bp = Blueprint('api', __name__)

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    """Get logs with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        skip = (page - 1) * limit
        
        logs = LogManager.get_logs(limit=limit, skip=skip)
        total_count = LogManager.get_logs_count()
        
        # Convert ObjectId to string for JSON serialization
        for log in logs:
            log['_id'] = str(log['_id'])
            if 'timestamp' in log:
                log['timestamp'] = log['timestamp'].isoformat()
        
        return jsonify({
            'success': True,
            'logs': logs,
            'total_count': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch logs: {str(e)}'}), 500

@api_bp.route('/logs/stats', methods=['GET'])
def get_logs_stats():
    """Get aggregated statistics from logs"""
    try:
        stats = LogManager.get_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

@api_bp.route('/logs/trends', methods=['GET'])
def get_logs_trends():
    """Get trend data for the last 24 hours vs previous 24 hours"""
    try:
        trends = LogManager.get_trends()
        return jsonify({
            'success': True,
            'trends': trends
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trends: {str(e)}'}), 500

@api_bp.route('/logs/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity for the last 24 hours"""
    try:
        activity = LogManager.get_recent_activity()
        return jsonify({
            'success': True,
            'activity': activity
        })
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent activity: {str(e)}'}), 500

@api_bp.route('/calculations', methods=['POST'])
def perform_calculation():
    """Endpoint to handle CSPM calculations"""
    data = request.json
    result = process_calculation(data)
    
    # Mock ID since Supabase is removed
    saved_id = 'mock-id'
    
    return jsonify({
        'success': True,
        'result': result,
        'saved_id': saved_id
    })

@api_bp.route('/data', methods=['GET'])
def get_data():
    """Mock data endpoint"""
    return jsonify({"message": "Mock data endpoint", "data": []})

@api_bp.route('/process-random-log', methods=['POST'])
def process_random_log():
    """Process a random log from aws_logs.txt"""
    try:
        import random
        from models import CSPMCalculator
        import pandas as pd
        import re
        import numpy as np
        
        # Read aws_logs.txt
        with open('aws_logs.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return jsonify({'error': 'No logs found in aws_logs.txt'}), 400
        
        # Select a random line
        random_line = random.choice(lines).strip()
        
        # Parse the log line
        parts = random_line.split('|')
        if len(parts) < 18:
            return jsonify({'error': 'Invalid log format'}), 400
        
        # Create the data array in the format expected by model_evaluate
        data = parts[:18]  # Take first 18 parts
        
        # Use the same logic as model_evaluate
        if not data or not isinstance(data, list) or len(data) != 18:
            return jsonify({'error': 'Invalid data format'}), 400
        
        # Create DataFrame
        columns = [
            'eventID', 'eventTime', 'sourceIPAddress', 'userAgent', 'eventName',
            'eventSource', 'awsRegion', 'eventVersion', 'userIdentitytype', 'eventType',
            'userIdentityaccountId', 'userIdentityprincipalId', 'userIdentityarn',
            'userIdentityaccessKeyId', 'userIdentityuserName', 'errorCode',
            'errorMessage', 'requestParametersinstanceType'
        ]
        
        df = pd.DataFrame([data], columns=columns)
        
        # Apply the same preprocessing as in model_evaluate
        df['errorCode'] = df['errorCode'].fillna('NoError')
        
        # Extract features from complex columns
        df['isRootUser'] = df['userIdentitytype'].apply(lambda x: 1 if x == 'Root' else 0)
        
        # Parse IP address for analysis
        def extract_ip_features(ip):
            parts = str(ip).split('.')
            if len(parts) >= 2:
                return int(parts[0]), int(parts[1])
            return 0, 0
        
        df['ip_first_octet'], df['ip_second_octet'] = zip(*df['sourceIPAddress'].apply(extract_ip_features))
        
        # Flag suspicious ARN patterns
        df['has_suspicious_arn'] = df['userIdentityarn'].apply(
            lambda x: 1 if re.search(r'role/.*admin|user/admin|root', str(x).lower()) else 0
        )
        
        # Create feature for API calls that are typically used in attacks
        sensitive_actions = ['Create', 'Delete', 'Modify', 'Put', 'Update']
        df['is_sensitive_action'] = df['eventName'].apply(
            lambda x: 1 if any(action in str(x) for action in sensitive_actions) else 0
        )
        
        # Flag errors as potentially suspicious
        df['has_error'] = df['errorMessage'].apply(lambda x: 0 if x == 'NoError' else 1)
        
        # Categorical columns to encode
        categorical_columns = [
            'eventSource', 'awsRegion', 'userIdentitytype', 
            'eventType', 'eventName', 'userAgent'
        ]
        
        # Feature columns for model
        feature_columns = [
            'isRootUser', 'ip_first_octet', 'ip_second_octet', 
            'has_suspicious_arn', 'is_sensitive_action', 'has_error'
        ]
        
        # All feature columns
        all_feature_columns = categorical_columns + feature_columns
        
        # Load the model and make prediction
        calculator = CSPMCalculator()
        model_path = 'aws_security_anomaly_detector_.pkl'
        model_loaded = False
        if os.path.exists(model_path):
            try:
                calculator.anomaly_detector.load_model(model_path)
                model_loaded = calculator.anomaly_detector.is_fitted
            except Exception as e:
                model_loaded = False
        
        # Get model predictions
        model_predictions = None
        if model_loaded:
            try:
                model_predictions = calculator.anomaly_detector.predict(df[all_feature_columns])
            except Exception as e:
                model_loaded = False
                model_predictions = np.array([1])
        else:
            model_predictions = np.array([1])
        
        # Base risk score from model (0-50)
        base_scores = np.where(model_predictions == -1, 50, 0)
        
        # Rule-based security detections
        rule_flags = np.zeros(len(df))
        
        # Rule 1: Root user performing sensitive actions
        rule1 = (df['userIdentitytype'] == 'Root') & (df['is_sensitive_action'] == 1)
        rule_flags = np.logical_or(rule_flags, rule1)
        
        # Rule 2: Failed access attempts
        rule2 = df['errorCode'] != 'NoError'
        rule_flags = np.logical_or(rule_flags, rule2)
        
        # Rule 3: Access from unusual IP ranges
        rule3 = df['ip_first_octet'] > 255
        rule_flags = np.logical_or(rule_flags, rule3)
        
        # Additional risk from rules (0-20)
        rule_scores = rule_flags * 20
        
        # Combine scores
        risk_scores = base_scores + rule_scores
        
        # Adjust risk scores based on specific security features
        # Add 10 points for root user activities
        risk_scores += df['isRootUser'] * 10
        
        # Add 10 points for sensitive actions
        risk_scores += df['is_sensitive_action'] * 10
        
        # Add 10 points for errors
        risk_scores += df['has_error'] * 10
        
        # Get risk level for this specific log
        risk_score = int(risk_scores[0])
        risk_score = min(100, risk_score)  # Cap at 100
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = "HIGH"
        elif risk_score >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Save log to MongoDB
        from models import LogEntry, LogManager
        from datetime import datetime
        
        log_entry = LogEntry(
            event_id=data[0],
            event_name=data[4],
            user_identity_type=data[8],
            source_ip=data[2],
            risk_score=risk_score,
            risk_level=risk_level,
            model_loaded=model_loaded,
            anomaly_detected=bool(model_predictions[0] == -1) if model_loaded else False,
            rule_based_flags=int(rule_flags[0]),
            timestamp=datetime.now()  # Use local system time
        )
        
        LogManager.add_log(log_entry)
        
        return jsonify({
            'success': True,
            'message': f'Processed log: {data[4]} - {risk_level} ({risk_score})',
            'log_data': {
                'event_name': data[4],
                'user_identity_type': data[8],
                'risk_score': risk_score,
                'risk_level': risk_level,
                'model_loaded': model_loaded,
                'anomaly_detected': bool(model_predictions[0] == -1) if model_loaded else False
            }
        })
        
    except FileNotFoundError:
        return jsonify({'error': 'aws_logs.txt not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Failed to process random log: {str(e)}'}), 500

@api_bp.route('/model-evaluate', methods=['POST'])
def model_evaluate():
    """Evaluate a log using the trained anomaly detection model"""
    from models import CSPMCalculator
    import pandas as pd
    import re
    import numpy as np
    
    data = request.json
    if not data or not isinstance(data, list) or len(data) != 18:
        return jsonify({'error': 'Input must be a list of 18 features'}), 400
    
    try:
        # Create DataFrame with column names
        columns = [
            'eventID', 'eventTime', 'sourceIPAddress', 'userAgent', 'eventName',
            'eventSource', 'awsRegion', 'eventVersion', 'userIdentitytype', 'eventType',
            'userIdentityaccountId', 'userIdentityprincipalId', 'userIdentityarn',
            'userIdentityaccessKeyId', 'userIdentityuserName', 'errorCode',
            'errorMessage', 'requestParametersinstanceType'
        ]
        
        # Convert input to DataFrame (handle mixed types)
        df = pd.DataFrame([data], columns=columns)
        
        # Apply preprocessing pipeline
        # Handle missing values
        df['errorCode'] = df['errorCode'].fillna('NoError')
        
        # Extract features from complex columns
        df['isRootUser'] = df['userIdentitytype'].apply(lambda x: 1 if x == 'Root' else 0)
        
        # Parse IP address for analysis
        def extract_ip_features(ip):
            parts = str(ip).split('.')
            if len(parts) >= 2:
                return int(parts[0]), int(parts[1])
            return 0, 0
        
        df['ip_first_octet'], df['ip_second_octet'] = zip(*df['sourceIPAddress'].apply(extract_ip_features))
        
        # Flag suspicious ARN patterns
        df['has_suspicious_arn'] = df['userIdentityarn'].apply(
            lambda x: 1 if re.search(r'role/.*admin|user/admin|root', str(x).lower()) else 0
        )
        
        # Create feature for API calls that are typically used in attacks
        sensitive_actions = ['Create', 'Delete', 'Modify', 'Put', 'Update']
        df['is_sensitive_action'] = df['eventName'].apply(
            lambda x: 1 if any(action in str(x) for action in sensitive_actions) else 0
        )
        
        # Flag errors as potentially suspicious
        df['has_error'] = df['errorMessage'].apply(lambda x: 0 if x == 'NoError' else 1)
        
        # Categorical columns to encode
        categorical_columns = [
            'eventSource', 'awsRegion', 'userIdentitytype', 
            'eventType', 'eventName', 'userAgent'
        ]
        
        # Feature columns for model
        feature_columns = [
            'isRootUser', 'ip_first_octet', 'ip_second_octet', 
            'has_suspicious_arn', 'is_sensitive_action', 'has_error'
        ]
        
        # All feature columns - this is what the Pipeline expects
        all_feature_columns = categorical_columns + feature_columns
        
        # Initialize CSPMCalculator
        calculator = CSPMCalculator()
        
        # Directly load the model here to ensure it's loaded
        model_path = 'aws_security_anomaly_detector_.pkl'
        model_loaded = False
        if os.path.exists(model_path):
            try:
                calculator.anomaly_detector.load_model(model_path)
                model_loaded = calculator.anomaly_detector.is_fitted
            except Exception as e:
                model_loaded = False
        else:
            model_loaded = False
        
        # Get model predictions first
        model_predictions = None
        if model_loaded:
            try:
                # Get model predictions - use the correct feature columns
                model_predictions = calculator.anomaly_detector.predict(df[all_feature_columns])
                
                # Check if predictions are anomalies (-1) or normal (1)
                anomaly_count = np.sum(model_predictions == -1)
                normal_count = np.sum(model_predictions == 1)
                
            except Exception as e:
                model_loaded = False
                model_predictions = np.array([1])
        else:
            # Model not loaded, use rule-based detection only
            model_predictions = np.array([1])
        
        # Now use the same predictions for both analysis and risk calculation
        result = calculator.analyze_logs(df)
        
        # Override the analysis result with our actual model predictions
        if model_loaded and model_predictions is not None:
            anomalies_detected = int(np.sum(model_predictions == -1))
            anomaly_ratio = float(np.mean(model_predictions == -1))
            result['anomalies_detected'] = anomalies_detected
            result['anomaly_ratio'] = anomaly_ratio
            result['model_loaded'] = True
        else:
            result['anomalies_detected'] = 0
            result['anomaly_ratio'] = 0
            result['model_loaded'] = False
        
        # Rule-based detections (from Kaggle code)
        rule_flags = np.zeros(len(df))
        
        # Rule 1: Root user performing sensitive actions
        rule1 = (df['userIdentitytype'] == 'Root') & (df['is_sensitive_action'] == 1)
        rule_flags = np.logical_or(rule_flags, rule1)
        
        # Rule 2: Failed access attempts
        rule2 = df['errorCode'] != 'NoError'
        rule_flags = np.logical_or(rule_flags, rule2)
        
        # Rule 3: Access from unusual IP ranges
        rule3 = df['ip_first_octet'] > 255
        rule_flags = np.logical_or(rule_flags, rule3)
        
        # Calculate risk scores (from Kaggle code)
        # Base risk score from model (0-50) - only if model is loaded
        if model_loaded:
            # Use model predictions as primary source for base risk scoring
            base_scores = np.where(model_predictions == -1, 50, 0)
            
            # Add base score for high-risk patterns that should be detected as anomalies
            # Ensures critical security events receive appropriate risk scoring
            high_risk_events = ['CreatePolicyVersion', 'PutBucketPolicy', 'DeleteUser', 'CreateUser', 'DeleteRole']
            is_high_risk_event = df['eventName'].isin(high_risk_events)
            high_risk_user = (df['userIdentitytype'] == 'Root') & (df['is_sensitive_action'] == 1)
            should_be_anomaly = is_high_risk_event | high_risk_user
            
            # If model didn't detect anomaly but should have, add base score
            missed_anomalies = (model_predictions == 1) & should_be_anomaly
            additional_base = np.where(missed_anomalies, 50, 0)
            base_scores += additional_base
        else:
            # Use rule-based scoring for base score when model is not loaded
            fallback_base_scores = np.zeros(len(df))
            
            # High risk patterns get higher base scores
            # Root user with sensitive action: 40 points
            root_sensitive = (df['userIdentitytype'] == 'Root') & (df['is_sensitive_action'] == 1)
            fallback_base_scores = np.where(root_sensitive, 40, fallback_base_scores)
            
            # Root user with error: 35 points
            root_error = (df['userIdentitytype'] == 'Root') & (df['has_error'] == 1)
            fallback_base_scores = np.where(root_error, 35, fallback_base_scores)
            
            # Sensitive action with error: 30 points
            sensitive_error = (df['is_sensitive_action'] == 1) & (df['has_error'] == 1)
            fallback_base_scores = np.where(sensitive_error, 30, fallback_base_scores)
            
            # Root user only: 25 points
            root_only = (df['userIdentitytype'] == 'Root') & (df['is_sensitive_action'] == 0) & (df['has_error'] == 0)
            fallback_base_scores = np.where(root_only, 25, fallback_base_scores)
            
            # Sensitive action only: 20 points
            sensitive_only = (df['is_sensitive_action'] == 1) & (df['userIdentitytype'] != 'Root') & (df['has_error'] == 0)
            fallback_base_scores = np.where(sensitive_only, 20, fallback_base_scores)
            
            # Error only: 15 points
            error_only = (df['has_error'] == 1) & (df['userIdentitytype'] != 'Root') & (df['is_sensitive_action'] == 0)
            fallback_base_scores = np.where(error_only, 15, fallback_base_scores)
            
            base_scores = fallback_base_scores
        
        # Additional risk from rules (0-20)
        rule_scores = rule_flags * 20
        
        # Combine scores
        risk_scores = base_scores + rule_scores
        
        # Adjust risk scores based on specific security features
        # Add 10 points for root user activities
        risk_scores += df['isRootUser'] * 10
        
        # Add 10 points for sensitive actions
        risk_scores += df['is_sensitive_action'] * 10
        
        # Add 10 points for errors
        risk_scores += df['has_error'] * 10
        
        # Get risk level for this specific log
        risk_score = int(risk_scores[0])
        
        # Ensure score doesn't exceed 100
        risk_score = min(100, risk_score)
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = "HIGH"
        elif risk_score >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Convert numpy/pandas types to standard Python types for JSON serialization
        def convert_to_serializable(obj):
            if hasattr(obj, 'item'):  # numpy types
                return obj.item()
            elif isinstance(obj, dict):
                return {k: convert_to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(v) for v in obj]
            else:
                return obj
        
        # Add additional context
        result['input_features'] = {
            'eventID': data[0],
            'eventName': data[4],
            'userIdentitytype': data[8],
            'sourceIPAddress': data[2],
            'isRootUser': int(df['isRootUser'].iloc[0]),
            'is_sensitive_action': int(df['is_sensitive_action'].iloc[0]),
            'has_error': int(df['has_error'].iloc[0])
        }
        
        # Add risk assessment
        result['risk_assessment'] = {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'model_loaded': model_loaded,
            'model_anomaly_detected': bool(model_predictions[0] == -1) if model_loaded and model_predictions is not None else False,
            'rule_based_flags': int(rule_flags[0]),
            'base_score': int(base_scores[0]),
            'rule_score': int(rule_scores[0]),
            'root_user_bonus': int(df['isRootUser'].iloc[0] * 10),
            'sensitive_action_bonus': int(df['is_sensitive_action'].iloc[0] * 10),
            'error_bonus': int(df['has_error'].iloc[0] * 10),
            'calculation_breakdown': {
                'base_score': int(base_scores[0]),
                'rule_score': int(rule_scores[0]),
                'root_user_bonus': int(df['isRootUser'].iloc[0] * 10),
                'sensitive_action_bonus': int(df['is_sensitive_action'].iloc[0] * 10),
                'error_bonus': int(df['has_error'].iloc[0] * 10),
                'total_calculated': int(risk_scores[0]),
                'final_score': risk_score,
                'model_prediction': int(model_predictions[0]) if model_predictions is not None else None,
                'anomaly_detected': bool(model_predictions[0] == -1) if model_predictions is not None else False
            }
        }
        
        # Save log to MongoDB
        from datetime import datetime
        
        log_entry = LogEntry(
            event_id=data[0],
            event_name=data[4],
            user_identity_type=data[8],
            source_ip=data[2],
            risk_score=risk_score,
            risk_level=risk_level,
            model_loaded=model_loaded,
            anomaly_detected=bool(model_predictions[0] == -1) if model_loaded else False,
            rule_based_flags=int(rule_flags[0]),
            timestamp=datetime.now()  # Use local system time
        )
        
        LogManager.add_log(log_entry)
        
        # Convert result to serializable format
        result = convert_to_serializable(result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 400

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }
