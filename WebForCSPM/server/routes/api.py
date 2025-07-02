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

def process_calculation(data):
    """Process CSPM calculations based on input data"""
    return {
        'processed': True,
        'input_summary': f"Processed input with {len(data)} parameters"
    }
