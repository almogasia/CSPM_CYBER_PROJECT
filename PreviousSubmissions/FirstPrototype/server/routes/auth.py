from flask import Blueprint, request, jsonify
import bcrypt
import jwt
from datetime import datetime, timedelta
from models import User
from config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    if not data or not all(key in data for key in ['name', 'email', 'password']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    name = data['name']
    email = data['email'].lower()
    password = data['password']
    
    try:
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({'message': 'Email already exists'}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create new user
        user = User(name=name, email=email, password=hashed_password.decode('utf-8'))
        user.save()
        
        # Generate JWT token
        token = jwt.encode({
            'id': str(user._id),
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(hours=2)
        }, Config.JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'name': user.name
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    
    if not data or not all(key in data for key in ['email', 'password']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    email = data['email'].lower()
    password = data['password']
    
    try:
        # Retrieve user by email address
        user = User.find_by_email(email)
        if not user:
            return jsonify({'message': 'Email not found'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'message': 'Invalid password'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'id': str(user._id),
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(hours=2)
        }, Config.JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'name': user.name
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Server error'}), 500

@auth_bp.route('/me', methods=['GET'])
def get_user():
    """Get current user information"""
    from middleware import auth_middleware
    
    @auth_middleware
    def protected_route():
        try:
            user = User.find_by_id(request.user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({
                'name': user.name,
                'email': user.email
            }), 200
        except Exception as e:
            return jsonify({'error': 'Server error'}), 500
    
    return protected_route() 