from flask import Blueprint, request, jsonify
from models import LogEntry, LogManager, Deployment, DeploymentManager
import os
from datetime import datetime, timedelta

api_bp = Blueprint('api', __name__)

@api_bp.route('/logs', methods=['GET'])
def get_logs():
    """Get logs with pagination"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 100))
            skip = (page - 1) * limit
            
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            logs = LogManager.get_logs(limit=limit, skip=skip, user_id=user_id)
            total_count = LogManager.get_logs_count(user_id=user_id)
            
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
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch logs: {str(e)}'}), 500

@api_bp.route('/logs/stats', methods=['GET'])
def get_logs_stats():
    """Get aggregated statistics from logs"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            stats = LogManager.get_stats(user_id=user_id)
            return jsonify({
                'success': True,
                'stats': stats
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

@api_bp.route('/logs/trends', methods=['GET'])
def get_logs_trends():
    """Get trend data for the last 24 hours vs previous 24 hours"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            trends = LogManager.get_trends(user_id=user_id)
            return jsonify({
                'success': True,
                'trends': trends
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch trends: {str(e)}'}), 500

@api_bp.route('/logs/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity for the last 24 hours"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            activity = LogManager.get_recent_activity(user_id=user_id)
            return jsonify({
                'success': True,
                'activity': activity
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent activity: {str(e)}'}), 500

@api_bp.route('/urgent-issues', methods=['GET'])
def get_urgent_issues():
    """Get all logs for urgent issues page with filtering capabilities"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get all logs from the database for this user
            logs = LogManager.get_logs(limit=1000, skip=0, user_id=user_id)  # Get more logs for urgent issues
            
            # Convert ObjectId to string for JSON serialization
            for log in logs:
                log['_id'] = str(log['_id'])
                if 'timestamp' in log and hasattr(log['timestamp'], 'isoformat'):
                    log['timestamp'] = log['timestamp'].isoformat()
            
            return jsonify({'success': True, 'urgent_issues': logs})
        
        return protected_route()
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
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            import random
            from model import MultiModelCSPM
            from datetime import datetime
            
            # Get user_id from the authenticated request
            user_id = request.user_id
            
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
                user_id=user_id,  # Associate with the authenticated user
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
        
        return protected_route()
        
    except FileNotFoundError:
        return jsonify({'error': 'aws_logs.txt not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Failed to process random log: {str(e)}'}), 500

@api_bp.route('/model-evaluate', methods=['POST'])
def model_evaluate():
    """Evaluate a log using the new multi-model CSPM system"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            from model import MultiModelCSPM
            from datetime import datetime
            
            # Get user_id from the authenticated request
            user_id = request.user_id
            
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
                user_id=user_id,  # Associate with the authenticated user
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
        
        return protected_route()
        
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 400

@api_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for visualization and trend analysis"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get user's logs for analytics
            user_logs = LogManager.get_logs(limit=1000, skip=0, user_id=user_id)
            
            # Calculate analytics based on user's actual logs
            user_resource_data = []
            if user_logs:
                # Group by event_name (resource) and calculate metrics
                resource_stats = {}
                for log in user_logs:
                    resource = log.get('event_name', 'Unknown')
                    if resource not in resource_stats:
                        resource_stats[resource] = {'count': 0, 'total_risk': 0}
                    resource_stats[resource]['count'] += 1
                    resource_stats[resource]['total_risk'] += log.get('risk_score', 0)
                
                for resource, stats in resource_stats.items():
                    user_resource_data.append({
                        'user': 'You',  # Since it's user-specific
                        'resource': resource,
                        'interactionCount': stats['count'],
                        'riskScore': stats['total_risk'] / stats['count'] if stats['count'] > 0 else 0
                    })
            else:
                # Fallback data if no logs
                user_resource_data = [
                    {'user': 'You', 'resource': 'EC2', 'interactionCount': 0, 'riskScore': 0},
                    {'user': 'You', 'resource': 'S3', 'interactionCount': 0, 'riskScore': 0},
                ]
            
            # Mock analytics data - in a real implementation, this would be calculated from user's logs
            analytics_data = {
                'userResourceGraph': user_resource_data,
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
                        {'user': 'You', 'activityCount': len(user_logs), 'riskScore': sum(log.get('risk_score', 0) for log in user_logs) / len(user_logs) if user_logs else 0, 'trend': 'stable'},
                    ]
                }
            }
            return jsonify({'success': True, 'analytics': analytics_data})
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }

@api_bp.route('/deployments', methods=['GET'])
def get_deployments():
    """Get deployments for the authenticated user"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            deployments = DeploymentManager.get_deployments(user_id=user_id)
            
            # Convert ObjectId to string for JSON serialization
            for deployment in deployments:
                deployment['_id'] = str(deployment['_id'])
                if 'timestamp' in deployment:
                    deployment['timestamp'] = deployment['timestamp'].isoformat()
            
            return jsonify({
                'success': True,
                'deployments': deployments
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch deployments: {str(e)}'}), 500

@api_bp.route('/deploy', methods=['POST'])
def deploy_file():
    """Deploy a file and track the deployment with comprehensive file details"""
    try:
        from middleware import auth_middleware
        import hashlib
        import mimetypes
        import os
        from datetime import datetime
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get file information from request
            data = request.json
            file_name = data.get('file_name', 'Unknown File')
            file_type = data.get('file_type', 'Unknown')
            file_size = data.get('file_size', 0)
            deployment_type = data.get('deployment_type', 'General')
            target_environment = data.get('target_environment', 'Production')
            deployment_notes = data.get('deployment_notes', '')
            
            # Extract file extension
            file_extension = os.path.splitext(file_name)[1] if '.' in file_name else ''
            
            # Generate file hash (simulated - in real scenario you'd hash the actual file content)
            file_hash = hashlib.md5(f"{file_name}{file_size}{datetime.utcnow().isoformat()}".encode()).hexdigest()
            
            # Determine file encoding based on type
            file_encoding = 'UTF-8'  # Default encoding
            if file_type.startswith('text/'):
                file_encoding = 'UTF-8'
            elif file_type.startswith('image/'):
                file_encoding = 'Binary'
            elif file_type.startswith('application/'):
                file_encoding = 'Binary'
            
            # Use real file timestamps from frontend
            file_created_time = data.get('file_created_time')
            file_modified_time = data.get('file_modified_time')
            file_accessed_time = data.get('file_accessed_time')
            
            # Simulate file properties
            file_path = data.get('file_path', f'/uploads/{file_name}')
            file_owner = data.get('file_owner', 'current_user')
            file_permissions = data.get('file_permissions', '644')
            file_description = data.get('file_description', f'{file_type} file for {deployment_type} deployment')
            
            # Simulate deployment details
            deployment_duration = data.get('deployment_duration', '5-10 minutes')
            resources_allocated = data.get('resources_allocated', ['EC2', 'S3', 'CloudWatch'])
            security_scan_results = data.get('security_scan_results', {
                'vulnerabilities_found': 0,
                'security_score': 95,
                'scan_status': 'passed'
            })
            compliance_status = data.get('compliance_status', {
                'hipaa': 'compliant',
                'sox': 'compliant',
                'pci': 'compliant'
            })
            
            # Create deployment record with comprehensive details
            deployment = Deployment(
                file_name=file_name,
                file_type=file_type,
                file_size=file_size,
                deployment_type=deployment_type,
                status="completed",  # Simulate successful deployment
                user_id=user_id,
                
                # Enhanced file properties
                file_created_time=file_created_time,
                file_modified_time=file_modified_time,
                file_accessed_time=file_accessed_time,
                file_extension=file_extension,
                file_path=file_path,
                file_owner=file_owner,
                file_permissions=file_permissions,
                file_hash=file_hash,
                file_encoding=file_encoding,
                file_description=file_description,
                
                # Deployment details
                deployment_notes=deployment_notes,
                target_environment=target_environment,
                deployment_duration=deployment_duration,
                resources_allocated=resources_allocated,
                security_scan_results=security_scan_results,
                compliance_status=compliance_status
            )
            
            # Add deployment to database
            success = DeploymentManager.add_deployment(deployment)
            
            if success:
                # Get the deployment from database to get the _id
                deployments = DeploymentManager.get_deployments(user_id=user_id)
                latest_deployment = deployments[0] if deployments else None
                
                if latest_deployment:
                    # Convert ObjectId to string for JSON serialization
                    latest_deployment['_id'] = str(latest_deployment['_id'])
                    if 'timestamp' in latest_deployment:
                        latest_deployment['timestamp'] = latest_deployment['timestamp'].isoformat()
                
                return jsonify({
                    'success': True,
                    'message': f'Successfully deployed {file_name}',
                    'deployment': latest_deployment or {
                        'file_name': file_name,
                        'file_type': file_type,
                        'file_size': file_size,
                        'deployment_type': deployment_type,
                        'status': 'completed',
                        'timestamp': deployment.timestamp.isoformat(),
                        
                        # Enhanced file properties
                        'file_created_time': file_created_time,
                        'file_modified_time': file_modified_time,
                        'file_accessed_time': file_accessed_time,
                        'file_extension': file_extension,
                        'file_path': file_path,
                        'file_owner': file_owner,
                        'file_permissions': file_permissions,
                        'file_hash': file_hash,
                        'file_encoding': file_encoding,
                        'file_description': file_description,
                        
                        # Deployment details
                        'deployment_notes': deployment_notes,
                        'target_environment': target_environment,
                        'deployment_duration': deployment_duration,
                        'resources_allocated': resources_allocated,
                        'security_scan_results': security_scan_results,
                        'compliance_status': compliance_status
                    }
                })
            else:
                return jsonify({'error': 'Failed to save deployment'}), 500
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Deployment failed: {str(e)}'}), 500
