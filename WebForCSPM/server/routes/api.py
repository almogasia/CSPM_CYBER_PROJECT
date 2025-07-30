from flask import Blueprint, request, jsonify

api_bp = Blueprint('api', __name__)

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
        # Create DataFrame with original column names from training
        columns = [
            'eventID', 'eventTime', 'sourceIPAddress', 'userAgent', 'eventName',
            'eventSource', 'awsRegion', 'eventVersion', 'userIdentitytype', 'eventType',
            'userIdentityaccountId', 'userIdentityprincipalId', 'userIdentityarn',
            'userIdentityaccessKeyId', 'userIdentityuserName', 'errorCode',
            'errorMessage', 'requestParametersinstanceType'
        ]
        
        # Convert input to DataFrame (handle mixed types)
        df = pd.DataFrame([data], columns=columns)
        
        # Apply the same preprocessing as in training
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
        
        # All feature columns
        all_feature_columns = categorical_columns + feature_columns
        
        # Use the CSPMCalculator which loads the trained model
        calculator = CSPMCalculator()
        result = calculator.analyze_logs(df)
        
        # Add risk scoring logic from Kaggle training
        # Check if model is loaded and fitted
        model_loaded = calculator.anomaly_detector.is_fitted
        
        if model_loaded:
            # Get model predictions
            model_predictions = calculator.anomaly_detector.predict(df[all_feature_columns])
        else:
            # Model not loaded, use rule-based detection only
            model_predictions = np.array([1])  # Assume normal (1) if model not available
        
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
            base_scores = np.where(model_predictions == -1, 50, 0)
        else:
            base_scores = np.zeros(len(df))
        
        # Additional risk from rules (0-20)
        rule_scores = rule_flags * 20
        
        # Combine scores
        risk_scores = base_scores + rule_scores
        
        # Adjust based on specific features
        # Add 10 points for root user activities
        risk_scores += df['isRootUser'] * 10
        
        # Add 10 points for sensitive actions
        risk_scores += df['is_sensitive_action'] * 10
        
        # Add 10 points for errors
        risk_scores += df['has_error'] * 10
        
        # Get risk level for this specific log
        risk_score = int(risk_scores[0])
        
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
            'model_anomaly_detected': bool(model_predictions[0] == -1) if model_loaded else False,
            'rule_based_flags': int(rule_flags[0]),
            'base_score': int(base_scores[0]),
            'rule_score': int(rule_scores[0]),
            'root_user_bonus': int(df['isRootUser'].iloc[0] * 10),
            'sensitive_action_bonus': int(df['is_sensitive_action'].iloc[0] * 10),
            'error_bonus': int(df['has_error'].iloc[0] * 10)
        }
        
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
