from flask import Blueprint, request, jsonify
from models import LogEntry, LogManager, Deployment, DeploymentManager
import os
from datetime import datetime, timedelta
from collections import defaultdict

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

@api_bp.route('/logs/chart-data', methods=['GET'])
def get_chart_data():
    """Get chart data for analytics visualization"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get user's logs for chart data
            user_logs = LogManager.get_logs(limit=1000, skip=0, user_id=user_id)
            
            if not user_logs:
                # Return empty chart data if no logs
                return jsonify({
                    'success': True,
                    'chartData': {
                        'eventTypeDistribution': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 2}]},
                        'userIdentityTypes': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 2}]},
                        'errorCodes': {'labels': [], 'datasets': [{'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 2}]},
                        'eventsOverTime': {'labels': [], 'datasets': [{'label': 'Total Events', 'data': [], 'borderColor': '#3B82F6', 'backgroundColor': 'rgba(59, 130, 246, 0.1)', 'tension': 0.4}]},
                        'errorsOverTime': {'labels': [], 'datasets': [{'label': 'Errors', 'data': [], 'borderColor': '#EF4444', 'backgroundColor': 'rgba(239, 68, 68, 0.1)', 'tension': 0.4}]},
                        'highRiskEventsTrend': {'labels': [], 'datasets': [{'label': 'High Risk Events', 'data': [], 'borderColor': '#DC2626', 'backgroundColor': 'rgba(220, 38, 38, 0.1)', 'tension': 0.4}]},
                        'topEventNames': {'labels': [], 'datasets': [{'label': 'Event Count', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]},
                        'topIpSources': {'labels': [], 'datasets': [{'label': 'Request Count', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]},
                        'topIamUsers': {'labels': [], 'datasets': [{'label': 'Event Count', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]},
                        'regionActivity': {'labels': [], 'datasets': [{'label': 'Log Count', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]},
                        'userActivityByType': {'labels': [], 'datasets': []},
                        'eventTypePerRegion': {'labels': [], 'datasets': []},
                        'hourlyActivityHeatmap': {'labels': [], 'datasets': [{'label': 'Activity Level', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]},
                        'regionVsEventTypeHeatmap': {'labels': [], 'datasets': [{'label': 'Event Count', 'data': [], 'backgroundColor': [], 'borderColor': [], 'borderWidth': 1}]}
                    }
                })
            
            # Process real log data for charts
            from collections import Counter, defaultdict
            import json
            
            # Event Type Distribution
            event_types = Counter(log.get('event_name', 'Unknown') for log in user_logs)
            event_type_data = {
                'labels': list(event_types.keys())[:6],  # Top 6
                'datasets': [{
                    'data': list(event_types.values())[:6],
                    'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'],
                    'borderColor': ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#4B5563'],
                    'borderWidth': 2
                }]
            }
            
            # User Identity Types
            user_identity_types = Counter(log.get('user_identity_type', 'Unknown') for log in user_logs)
            user_identity_data = {
                'labels': list(user_identity_types.keys())[:5],  # Top 5
                'datasets': [{
                    'data': list(user_identity_types.values())[:5],
                    'backgroundColor': ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#6B7280'],
                    'borderColor': ['#059669', '#DC2626', '#2563EB', '#D97706', '#4B5563'],
                    'borderWidth': 2
                }]
            }
            
            # Error Codes
            error_codes = Counter(log.get('error_code', 'NoError') for log in user_logs if log.get('error_code') != 'NoError')
            if not error_codes:
                error_codes = Counter(['NoError'])
            error_codes_data = {
                'labels': list(error_codes.keys())[:5],  # Top 5
                'datasets': [{
                    'data': list(error_codes.values())[:5],
                    'backgroundColor': ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#6B7280'],
                    'borderColor': ['#059669', '#DC2626', '#D97706', '#2563EB', '#4B5563'],
                    'borderWidth': 2
                }]
            }
            
            # Events Over Time (last 7 days)
            daily_events = defaultdict(int)
            for log in user_logs:
                if 'timestamp' in log:
                    try:
                        if isinstance(log['timestamp'], str):
                            date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
                        else:
                            date = log['timestamp'].date()
                        daily_events[date] += 1
                    except:
                        continue
            
            # Fill in missing days
            for i in range(7):
                date = datetime.now().date() - timedelta(days=6-i)
                if date not in daily_events:
                    daily_events[date] = 0
            
            sorted_dates = sorted(daily_events.keys())
            events_over_time_data = {
                'labels': [date.strftime('%a') for date in sorted_dates[-7:]],
                'datasets': [{
                    'label': 'Total Events',
                    'data': [daily_events[date] for date in sorted_dates[-7:]],
                    'borderColor': '#3B82F6',
                    'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                    'tension': 0.4
                }]
            }
            
            # Errors Over Time
            daily_errors = defaultdict(int)
            for log in user_logs:
                if log.get('error_code') and log.get('error_code') != 'NoError':
                    if 'timestamp' in log:
                        try:
                            if isinstance(log['timestamp'], str):
                                date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
                            else:
                                date = log['timestamp'].date()
                            daily_errors[date] += 1
                        except:
                            continue
            
            # Fill in missing days
            for i in range(7):
                date = datetime.now().date() - timedelta(days=6-i)
                if date not in daily_errors:
                    daily_errors[date] = 0
            
            sorted_error_dates = sorted(daily_errors.keys())
            errors_over_time_data = {
                'labels': [date.strftime('%a') for date in sorted_error_dates[-7:]],
                'datasets': [{
                    'label': 'Errors',
                    'data': [daily_errors[date] for date in sorted_error_dates[-7:]],
                    'borderColor': '#EF4444',
                    'backgroundColor': 'rgba(239, 68, 68, 0.1)',
                    'tension': 0.4
                }]
            }
            
            # High Risk Events Trend
            daily_high_risk = defaultdict(int)
            for log in user_logs:
                if log.get('risk_level') == 'HIGH':
                    if 'timestamp' in log:
                        try:
                            if isinstance(log['timestamp'], str):
                                date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
                            else:
                                date = log['timestamp'].date()
                            daily_high_risk[date] += 1
                        except:
                            continue
            
            # Fill in missing days
            for i in range(7):
                date = datetime.now().date() - timedelta(days=6-i)
                if date not in daily_high_risk:
                    daily_high_risk[date] = 0
            
            sorted_risk_dates = sorted(daily_high_risk.keys())
            high_risk_trend_data = {
                'labels': [date.strftime('%a') for date in sorted_risk_dates[-7:]],
                'datasets': [{
                    'label': 'High Risk Events',
                    'data': [daily_high_risk[date] for date in sorted_risk_dates[-7:]],
                    'borderColor': '#DC2626',
                    'backgroundColor': 'rgba(220, 38, 38, 0.1)',
                    'tension': 0.4
                }]
            }
            
            # Top Event Names (Bar Chart)
            top_events = event_types.most_common(5)
            top_event_names_data = {
                'labels': [event[0] for event in top_events],
                'datasets': [{
                    'label': 'Event Count',
                    'data': [event[1] for event in top_events],
                    'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    'borderColor': ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
                    'borderWidth': 1
                }]
            }
            
            # Top IP Sources
            ip_sources = Counter(log.get('source_ip', 'Unknown') for log in user_logs)
            top_ips = ip_sources.most_common(5)
            top_ip_sources_data = {
                'labels': [ip[0] for ip in top_ips],
                'datasets': [{
                    'label': 'Request Count',
                    'data': [ip[1] for ip in top_ips],
                    'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    'borderColor': ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
                    'borderWidth': 1
                }]
            }
            
            # Top IAM Users
            iam_users = Counter(log.get('user_identity_user_name', 'Unknown') for log in user_logs if log.get('user_identity_user_name'))
            top_users = iam_users.most_common(5)
            top_iam_users_data = {
                'labels': [user[0] for user in top_users],
                'datasets': [{
                    'label': 'Event Count',
                    'data': [user[1] for user in top_users],
                    'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    'borderColor': ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
                    'borderWidth': 1
                }]
            }
            
            # Region Activity
            regions = Counter(log.get('aws_region', 'Unknown') for log in user_logs)
            top_regions = regions.most_common(5)
            region_activity_data = {
                'labels': [region[0] for region in top_regions],
                'datasets': [{
                    'label': 'Log Count',
                    'data': [region[1] for region in top_regions],
                    'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                    'borderColor': ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
                    'borderWidth': 1
                }]
            }
            
            # User Activity by Type (Stacked Area Chart)
            user_activity_by_type_data = {
                'labels': [date.strftime('%a') for date in sorted_dates[-7:]],
                'datasets': []
            }
            
            # Get top 3 event types for stacked chart
            top_3_events = event_types.most_common(3)
            colors = ['#3B82F6', '#10B981', '#F59E0B']
            
            for i, (event_name, _) in enumerate(top_3_events):
                daily_event_counts = defaultdict(int)
                for log in user_logs:
                    if log.get('event_name') == event_name and 'timestamp' in log:
                        try:
                            if isinstance(log['timestamp'], str):
                                date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
                            else:
                                date = log['timestamp'].date()
                            daily_event_counts[date] += 1
                        except:
                            continue
                
                # Fill in missing days
                event_data = []
                for date in sorted_dates[-7:]:
                    event_data.append(daily_event_counts.get(date, 0))
                
                user_activity_by_type_data['datasets'].append({
                    'label': event_name,
                    'data': event_data,
                    'borderColor': colors[i],
                    'backgroundColor': colors[i].replace(')', ', 0.3)').replace('rgb', 'rgba'),
                    'fill': True
                })
            
            # Event Type per Region (Stacked Area Chart)
            event_type_per_region_data = {
                'labels': [region[0] for region in top_regions],
                'datasets': []
            }
            
            for i, (event_name, _) in enumerate(top_3_events):
                region_event_counts = []
                for region, _ in top_regions:
                    count = sum(1 for log in user_logs 
                              if log.get('event_name') == event_name and log.get('aws_region') == region)
                    region_event_counts.append(count)
                
                event_type_per_region_data['datasets'].append({
                    'label': event_name,
                    'data': region_event_counts,
                    'borderColor': colors[i],
                    'backgroundColor': colors[i].replace(')', ', 0.3)').replace('rgb', 'rgba'),
                    'fill': True
                })
            
            # Hourly Activity Heatmap
            hourly_activity = defaultdict(int)
            for log in user_logs:
                if 'timestamp' in log:
                    try:
                        if isinstance(log['timestamp'], str):
                            dt = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                        else:
                            dt = log['timestamp']
                        hour = dt.hour
                        hourly_activity[hour] += 1
                    except:
                        continue
            
            # Fill in missing hours
            hourly_data = []
            hourly_labels = []
            for hour in range(24):
                hourly_labels.append(f"{hour:02d}:00")
                hourly_data.append(hourly_activity.get(hour, 0))
            
            hourly_activity_heatmap_data = {
                'labels': hourly_labels[::4],  # Show every 4 hours
                'datasets': [{
                    'label': 'Activity Level',
                    'data': hourly_data[::4],
                    'backgroundColor': ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#EF4444', '#DC2626'],
                    'borderColor': ['#059669', '#10B981', '#34D399', '#D97706', '#DC2626', '#B91C1C'],
                    'borderWidth': 1
                }]
            }
            
            # Region vs Event Type Heatmap
            region_vs_event_heatmap_data = {
                'labels': [region[0] for region in top_regions],
                'datasets': [{
                    'label': 'Event Count',
                    'data': [region[1] for region in top_regions],
                    'backgroundColor': ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#EF4444'],
                    'borderColor': ['#059669', '#10B981', '#34D399', '#D97706', '#DC2626'],
                    'borderWidth': 1
                }]
            }
            
            chart_data = {
                'eventTypeDistribution': event_type_data,
                'userIdentityTypes': user_identity_data,
                'errorCodes': error_codes_data,
                'eventsOverTime': events_over_time_data,
                'errorsOverTime': errors_over_time_data,
                'highRiskEventsTrend': high_risk_trend_data,
                'topEventNames': top_event_names_data,
                'topIpSources': top_ip_sources_data,
                'topIamUsers': top_iam_users_data,
                'regionActivity': region_activity_data,
                'userActivityByType': user_activity_by_type_data,
                'eventTypePerRegion': event_type_per_region_data,
                'hourlyActivityHeatmap': hourly_activity_heatmap_data,
                'regionVsEventTypeHeatmap': region_vs_event_heatmap_data
            }
            
            return jsonify({
                'success': True,
                'chartData': chart_data
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch chart data: {str(e)}'}), 500

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
            
            # Generate real time heatmap data from logs
            time_heatmap_data = []
            if user_logs:
                # Group logs by hour and day
                hourly_stats = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'total_risk': 0}))
                for log in user_logs:
                    if 'timestamp' in log:
                        try:
                            if isinstance(log['timestamp'], str):
                                dt = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                            else:
                                dt = log['timestamp']
                            hour = dt.hour
                            day = dt.strftime('%a')[:3]  # Mon, Tue, etc.
                            hourly_stats[hour][day]['count'] += 1
                            hourly_stats[hour][day]['total_risk'] += log.get('risk_score', 0)
                        except:
                            continue
                
                # Generate heatmap data
                days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                for hour in range(24):
                    for day in days:
                        stats = hourly_stats[hour][day]
                        avg_risk = stats['total_risk'] / stats['count'] if stats['count'] > 0 else 0
                        time_heatmap_data.append({
                            'hour': hour,
                            'day': day,
                            'riskLevel': avg_risk,
                            'activityCount': stats['count']
                        })
            else:
                # Fallback heatmap data
                for i in range(168):  # 24 hours * 7 days
                    time_heatmap_data.append({
                        'hour': i % 24,
                        'day': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i // 24],
                        'riskLevel': 0,
                        'activityCount': 0
                    })
            
            # Generate real trend analysis from logs
            daily_trends = []
            if user_logs:
                # Group logs by date
                daily_stats = defaultdict(lambda: {'total': 0, 'high_risk': 0, 'total_risk': 0})
                for log in user_logs:
                    if 'timestamp' in log:
                        try:
                            if isinstance(log['timestamp'], str):
                                date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
                            else:
                                date = log['timestamp'].date()
                            daily_stats[date]['total'] += 1
                            daily_stats[date]['total_risk'] += log.get('risk_score', 0)
                            if log.get('risk_level') == 'HIGH':
                                daily_stats[date]['high_risk'] += 1
                        except:
                            continue
                
                # Generate trend data for last 30 days
                for i in range(30):
                    date = datetime.now().date() - timedelta(days=29-i)
                    stats = daily_stats.get(date, {'total': 0, 'high_risk': 0, 'total_risk': 0})
                    avg_risk = stats['total_risk'] / stats['total'] if stats['total'] > 0 else 0
                    daily_trends.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'totalLogs': stats['total'],
                        'highRiskCount': stats['high_risk'],
                        'avgRiskScore': avg_risk
                    })
            else:
                # Fallback trend data
                for i in range(30):
                    date = datetime.now().date() - timedelta(days=29-i)
                    daily_trends.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'totalLogs': 0,
                        'highRiskCount': 0,
                        'avgRiskScore': 0
                    })
            
            # Generate user activity trends
            user_activity_trends = []
            if user_logs:
                # Calculate overall user activity
                total_activity = len(user_logs)
                avg_risk_score = sum(log.get('risk_score', 0) for log in user_logs) / len(user_logs) if user_logs else 0
                
                # Determine trend based on recent activity vs older activity
                recent_logs = [log for log in user_logs if 'timestamp' in log]
                if len(recent_logs) >= 2:
                    # Split logs into two halves
                    mid_point = len(recent_logs) // 2
                    recent_activity = len(recent_logs[mid_point:])
                    older_activity = len(recent_logs[:mid_point])
                    
                    if recent_activity > older_activity * 1.2:
                        trend = 'increasing'
                    elif recent_activity < older_activity * 0.8:
                        trend = 'decreasing'
                    else:
                        trend = 'stable'
                else:
                    trend = 'stable'
                
                user_activity_trends.append({
                    'user': 'You',
                    'activityCount': total_activity,
                    'riskScore': avg_risk_score,
                    'trend': trend
                })
            else:
                user_activity_trends.append({
                    'user': 'You',
                    'activityCount': 0,
                    'riskScore': 0,
                    'trend': 'stable'
                })
            
            analytics_data = {
                'userResourceGraph': user_resource_data,
                'timeHeatmap': time_heatmap_data,
                'trendAnalysis': {
                    'dailyTrends': daily_trends,
                    'userActivityTrends': user_activity_trends
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

@api_bp.route('/assessments/recent', methods=['GET'])
def get_recent_assessments():
    """Get recent assessments based on log data"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get user's log stats to create assessments
            stats = LogManager.get_stats(user_id=user_id)
            
            # Create assessments based on real data
            assessments = []
            
            if stats and stats.get('total_logs', 0) > 0:
                # Calculate security score based on risk distribution
                total_logs = stats.get('total_logs', 0)
                critical_count = stats.get('critical_risk_count', 0)
                high_count = stats.get('high_risk_count', 0)
                medium_count = stats.get('medium_risk_count', 0)
                anomaly_count = stats.get('anomaly_count', 0)
                root_count = stats.get('root_user_count', 0)
                
                # Security score calculation (higher is better)
                risk_penalty = (critical_count * 20) + (high_count * 10) + (medium_count * 5) + (anomaly_count * 3) + (root_count * 5)
                max_possible_penalty = total_logs * 20
                security_score = max(0, 100 - (risk_penalty / max_possible_penalty * 100)) if max_possible_penalty > 0 else 100
                
                # Infrastructure Security Assessment
                assessments.append({
                    'id': '1',
                    'name': 'Infrastructure Security Assessment',
                    'type': 'Infrastructure Security',
                    'status': 'completed',
                    'score': round(security_score, 1),
                    'date': datetime.utcnow().isoformat(),
                    'findings': {
                        'high': critical_count + high_count,
                        'medium': medium_count,
                        'low': total_logs - (critical_count + high_count + medium_count)
                    }
                })
                
                # Data Security Assessment
                data_security_score = max(0, 100 - (anomaly_count * 5))
                assessments.append({
                    'id': '2',
                    'name': 'Data Security Assessment',
                    'type': 'Data Security',
                    'status': 'completed',
                    'score': round(data_security_score, 1),
                    'date': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                    'findings': {
                        'high': anomaly_count,
                        'medium': root_count,
                        'low': max(0, total_logs - anomaly_count - root_count)
                    }
                })
                
                # Compliance Assessment
                compliance_score = max(0, 100 - (critical_count * 15) - (high_count * 8))
                assessments.append({
                    'id': '3',
                    'name': 'Compliance Assessment',
                    'type': 'Compliance Check',
                    'status': 'completed',
                    'score': round(compliance_score, 1),
                    'date': (datetime.utcnow() - timedelta(hours=4)).isoformat(),
                    'findings': {
                        'high': critical_count,
                        'medium': high_count,
                        'low': medium_count
                    }
                })
            
            return jsonify({
                'success': True,
                'assessments': assessments
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to fetch assessments: {str(e)}'}), 500

@api_bp.route('/assessments/start', methods=['POST'])
def start_assessment():
    """Start a new assessment"""
    try:
        from middleware import auth_middleware
        
        @auth_middleware
        def protected_route():
            # Get user_id from the authenticated request
            user_id = request.user_id
            
            # Get assessment parameters
            data = request.json
            provider = data.get('provider', 'Unknown')
            assessment_type = data.get('type', 'General')
            scope = data.get('scope', 'default-scope')
            
            # For now, return a success response
            # In a real implementation, this would start an actual assessment process
            return jsonify({
                'success': True,
                'message': f'Assessment started for {provider} - {assessment_type}',
                'assessment_id': f'assessment_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}'
            })
        
        return protected_route()
    except Exception as e:
        return jsonify({'error': f'Failed to start assessment: {str(e)}'}), 500
