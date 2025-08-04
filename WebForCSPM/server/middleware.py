"""
Authentication and Authorization Middleware

This module provides JWT-based authentication middleware for securing
API endpoints in the CSPM system. It validates user tokens and
provides user context for protected routes.

Features:
- JWT token validation and verification
- User authentication and authorization
- Request context enrichment with user information
- Secure token handling and error management
"""

import jwt
from functools import wraps
from flask import request, jsonify
from config import Config

def auth_middleware(f):
    """
    JWT authentication middleware decorator
    
    Validates JWT tokens from Authorization headers and provides
    user context for protected API endpoints. Extracts user ID
    and email from valid tokens for use in route handlers.
    
    Args:
        f: Function to be decorated (route handler)
        
    Returns:
        Decorated function with authentication checks
        
    Raises:
        401 Unauthorized: If token is missing, invalid, or expired
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            # Extract token from "Bearer <token>" format
            token = auth_header.split(' ')[1]
            if not token:
                return jsonify({'error': 'Invalid token format'}), 401
            
            # Verify the token
            decoded = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            request.user_id = decoded['id']
            request.user_email = decoded['email']
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': 'Token verification failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function 