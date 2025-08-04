"""
User Authentication and Authorization Routes

This module provides authentication endpoints for user registration,
login, and profile management in the CSPM system. It handles secure
password hashing, JWT token generation, and user session management.

Features:
- Secure user registration with password hashing
- JWT-based authentication and session management
- User profile retrieval and management
- Password verification and security validation
"""

from flask import Blueprint, request, jsonify
import bcrypt
import jwt
from datetime import datetime, timedelta
from models import User
from config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user account
    
    Creates a new user account with secure password hashing and
    generates a JWT token for immediate authentication. Validates
    input data and ensures email uniqueness.
    
    Request Body:
        JSON with name, email, and password fields
        
    Returns:
        JSON response with JWT token and user name on success
        
    Raises:
        400 Bad Request: If required fields are missing or email already exists
        500 Internal Server Error: If registration process fails
    """
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
    """
    Authenticate user and generate session token
    
    Validates user credentials and generates a JWT token for
    authenticated session management. Performs secure password
    verification using bcrypt hashing.
    
    Request Body:
        JSON with email and password fields
        
    Returns:
        JSON response with JWT token and user name on successful authentication
        
    Raises:
        400 Bad Request: If required fields are missing
        401 Unauthorized: If email not found or password is invalid
        500 Internal Server Error: If authentication process fails
    """
    data = request.json
    
    if not data or not all(key in data for key in ['email', 'password']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    email = data['email'].lower()
    password = data['password']
    
    try:
        # Find user by email
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
    """
    Retrieve current user profile information
    
    Returns profile information for the currently authenticated user
    based on the JWT token in the Authorization header.
    
    Headers:
        Authorization: Bearer <JWT token>
        
    Returns:
        JSON response with user name and email
        
    Raises:
        401 Unauthorized: If token is invalid or missing
        404 Not Found: If user not found in database
        500 Internal Server Error: If profile retrieval fails
    """
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