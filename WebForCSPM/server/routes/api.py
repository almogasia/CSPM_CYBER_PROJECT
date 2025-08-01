from flask import Blueprint, request, jsonify
from models import LogEntry, LogManager
import os
from datetime import datetime, timedelta

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

@api_bp.route('/urgent-issues', methods=['GET'])
def get_urgent_issues():
    """Get grouped urgent issues (groups of 3+ logs by user, IP, and time window)"""
    try:
        groups = LogManager.get_urgent_issue_groups()
        return jsonify({'success': True, 'urgent_issues': groups})
    except Exception as e:
        return jsonify({'error': f'Failed to fetch urgent issues: {str(e)}'}), 500

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
    """Process a random log from aws_logs.txt using the new multi-model system"""
    try:
        import random
        from model import MultiModelCSPM
        from datetime import datetime
        
        # Read aws_logs.txt
        with open('aws_logs.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            return jsonify({'error': 'No logs found in aws_logs.txt'}), 400
        
        # Select a random line - the model will handle parsing
        random_line = random.choice(lines).strip()
        
        # Initialize the multi-model CSPM system
        cspm = MultiModelCSPM()
        
        # Evaluate the log - model handles all parsing internally
        result = cspm.evaluate_log(random_line)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        # Save log to MongoDB using the parsed features from the model
        input_features = result['input_features']
        log_entry = LogEntry(
            event_id=input_features['eventID'],
            event_name=input_features['eventName'],
            user_identity_type=input_features['userIdentitytype'],
            source_ip=input_features['sourceIPAddress'],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            model_loaded=True,  # Models are always loaded in new system
            anomaly_detected=result['model_predictions']['anomaly_detected'],
            rule_based_flags=len(result['risk_reasons']),
            timestamp=datetime.now(),
            # Pass all 18 features
            eventID=input_features['eventID'],
            eventTime=input_features['eventTime'],
            sourceIPAddress=input_features['sourceIPAddress'],
            userAgent=input_features['userAgent'],
            eventName=input_features['eventName'],
            eventSource=input_features['eventSource'],
            awsRegion=input_features['awsRegion'],
            eventVersion=input_features['eventVersion'],
            userIdentitytype=input_features['userIdentitytype'],
            eventType=input_features['eventType'],
            userIdentityaccountId=input_features['userIdentityaccountId'],
            userIdentityprincipalId=input_features['userIdentityprincipalId'],
            userIdentityarn=input_features['userIdentityarn'],
            userIdentityaccessKeyId=input_features['userIdentityaccessKeyId'],
            userIdentityuserName=input_features['userIdentityuserName'],
            errorCode=input_features['errorCode'],
            errorMessage=input_features['errorMessage'],
            requestParametersinstanceType=input_features['requestParametersinstanceType']
        )
        
        LogManager.add_log(log_entry)
        
        # Add the original log data to the result
        result['original_log'] = random_line
        
        return jsonify(result)
        
    except FileNotFoundError:
        return jsonify({'error': 'aws_logs.txt not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Failed to process random log: {str(e)}'}), 500

@api_bp.route('/model-evaluate', methods=['POST'])
def model_evaluate():
    """Evaluate a log using the new multi-model CSPM system"""
    from model import MultiModelCSPM
    from datetime import datetime
    
    data = request.json
    
    # Handle both string format (pipe-separated) and list format
    if isinstance(data, list):
        if len(data) != 18:
            return jsonify({'error': 'Input must be a list of 18 features'}), 400
        # Convert list to pipe-separated string
        log_data = '|'.join(str(feature) for feature in data)
    elif isinstance(data, str):
        log_data = data
    else:
        return jsonify({'error': 'Input must be a list of 18 features or a pipe-separated string'}), 400
    
    try:
        # Initialize the multi-model CSPM system
        cspm = MultiModelCSPM()
        
        # Evaluate the log - model handles all parsing internally
        result = cspm.evaluate_log(log_data)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        # Save log to MongoDB using the parsed features from the model
        input_features = result['input_features']
        log_entry = LogEntry(
            event_id=input_features['eventID'],
            event_name=input_features['eventName'],
            user_identity_type=input_features['userIdentitytype'],
            source_ip=input_features['sourceIPAddress'],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            model_loaded=True,  # Models are always loaded in new system
            anomaly_detected=result['model_predictions']['anomaly_detected'],
            rule_based_flags=len(result['risk_reasons']),
            timestamp=datetime.now(),
            # Pass all 18 features
            eventID=input_features['eventID'],
            eventTime=input_features['eventTime'],
            sourceIPAddress=input_features['sourceIPAddress'],
            userAgent=input_features['userAgent'],
            eventName=input_features['eventName'],
            eventSource=input_features['eventSource'],
            awsRegion=input_features['awsRegion'],
            eventVersion=input_features['eventVersion'],
            userIdentitytype=input_features['userIdentitytype'],
            eventType=input_features['eventType'],
            userIdentityaccountId=input_features['userIdentityaccountId'],
            userIdentityprincipalId=input_features['userIdentityprincipalId'],
            userIdentityarn=input_features['userIdentityarn'],
            userIdentityaccessKeyId=input_features['userIdentityaccessKeyId'],
            userIdentityuserName=input_features['userIdentityuserName'],
            errorCode=input_features['errorCode'],
            errorMessage=input_features['errorMessage'],
            requestParametersinstanceType=input_features['requestParametersinstanceType']
        )
        
        LogManager.add_log(log_entry)
            
        # Add additional context for compatibility
        result['anomalies_detected'] = 1 if result['risk_score'] >= 80 else 0
        result['anomaly_ratio'] = 1.0 if result['risk_score'] >= 80 else 0.0
        result['model_loaded'] = True  # Models are always loaded in new system
        
        # Add risk assessment breakdown for compatibility
        result['risk_assessment'] = {
            'risk_score': result['risk_score'],
            'risk_level': result['risk_level'],
            'model_loaded': True,  # Models are always loaded in new system
            'model_anomaly_detected': result['model_predictions']['anomaly_detected'],
            'rule_based_flags': len(result['risk_reasons']),
            'calculation_breakdown': {
                'risk_score': result['risk_score'],
                'risk_level': result['risk_level'],
                'model_predictions': result['model_predictions'],
                'risk_reasons': result['risk_reasons']
            }
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 400

@api_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for visualization and trend analysis"""
    try:
        # Mock analytics data - in a real implementation, this would be calculated from logs
        analytics_data = {
            'userResourceGraph': [
                {'user': 'admin', 'resource': 'EC2', 'interactionCount': 45, 'riskScore': 85},
                {'user': 'admin', 'resource': 'S3', 'interactionCount': 23, 'riskScore': 72},
                {'user': 'developer', 'resource': 'EC2', 'interactionCount': 12, 'riskScore': 45},
                {'user': 'developer', 'resource': 'Lambda', 'interactionCount': 8, 'riskScore': 30},
                {'user': 'root', 'resource': 'IAM', 'interactionCount': 15, 'riskScore': 95},
                {'user': 'root', 'resource': 'CloudTrail', 'interactionCount': 5, 'riskScore': 88},
            ],
            'timeHeatmap': [
                # Generate 168 data points (24 hours * 7 days)
                {'hour': i % 24, 'day': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i // 24], 
                 'riskLevel': 50 + (i % 20), 'activityCount': 10 + (i % 30)}
                for i in range(168)
            ],
            'trendAnalysis': {
                'dailyTrends': [
                    # Generate 30 days of trend data
                    {'date': (datetime.now() - timedelta(days=29-i)).strftime('%Y-%m-%d'),
                     'totalLogs': 100 + (i * 3), 'highRiskCount': 5 + (i % 10), 
                     'avgRiskScore': 30 + (i % 20)}
                    for i in range(30)
                ],
                'userActivityTrends': [
                    {'user': 'admin', 'activityCount': 156, 'riskScore': 78, 'trend': 'increasing'},
                    {'user': 'developer', 'activityCount': 89, 'riskScore': 45, 'trend': 'stable'},
                    {'user': 'root', 'activityCount': 23, 'riskScore': 92, 'trend': 'decreasing'},
                ]
            }
        }
        return jsonify({'success': True, 'analytics': analytics_data})
    except Exception as e:
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }
