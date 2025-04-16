from flask import Blueprint, request, jsonify
from supabase.client import supabase

api_bp = Blueprint('api', __name__)

@api_bp.route('/calculations', methods=['POST'])
def perform_calculation():
    """Endpoint to handle CSPM calculations and store in Supabase"""
    data = request.json
    
    # Perform your calculations here
    result = process_calculation(data)
    
    # Store result in Supabase
    try:
        response = supabase.table('calculations').insert({
            'input_data': data,
            'result': result,
            'created_at': 'now()'
        }).execute()
        
        return jsonify({
            'success': True,
            'result': result,
            'saved_id': response.data[0]['id'] if response.data else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/data', methods=['GET'])
def get_data():
    """Retrieve data from Supabase"""
    try:
        response = supabase.table('your_table_name').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    # Implement your calculation logic here
    # This is a placeholder
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }
