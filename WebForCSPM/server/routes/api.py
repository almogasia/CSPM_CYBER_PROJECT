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
        
        # Select a random line
        random_line = random.choice(lines).strip()
        
        # Parse the log line - it should already be in pipe-separated format
        parts = random_line.split('|')
        if len(parts) < 18:
            return jsonify({'error': 'Invalid log format'}), 400
        
        # Take first 18 parts and join them back into pipe-separated format
        log_data = '|'.join(parts[:18])
        
        # Initialize the multi-model CSPM system
        cspm = MultiModelCSPM()
        
        # Evaluate the log
        result = cspm.evaluate_log(log_data)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        # Extract features for additional context
        features = log_data.split('|')
        
        # Save log to MongoDB
        log_entry = LogEntry(
            event_id=features[0],
            event_name=features[4],
            user_identity_type=features[8],
            source_ip=features[2],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            model_loaded=True,  # Models are always loaded in new system
            anomaly_detected=result['model_predictions']['isolation_anomaly'],
            rule_based_flags=len(result['risk_reasons']),
            timestamp=datetime.now()
        )
        
        LogManager.add_log(log_entry)
        
        # Add the original log data to the result
        result['original_log'] = random_line
        result['parsed_features'] = {
            'eventID': features[0],
            'eventName': features[4],
            'userIdentitytype': features[8],
            'sourceIPAddress': features[2],
            'errorCode': features[15] if len(features) > 15 else 'NoError'
            }
        
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
    
    # Handle both old format (list) and new format (pipe-separated string)
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
        
        # Evaluate the log
        result = cspm.evaluate_log(log_data)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        # Extract features for logging
        features = log_data.split('|')
        
        # Save log to MongoDB
        log_entry = LogEntry(
            event_id=features[0],
            event_name=features[4],
            user_identity_type=features[8],
            source_ip=features[2],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            model_loaded=True,  # Models are always loaded in new system
            anomaly_detected=result['model_predictions']['isolation_anomaly'],
            rule_based_flags=len(result['risk_reasons']),
            timestamp=datetime.now()
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
            'model_anomaly_detected': result['model_predictions']['isolation_anomaly'],
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

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }
