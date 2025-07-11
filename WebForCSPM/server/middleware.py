import jwt
from functools import wraps
from flask import request, jsonify
from config import Config

def auth_middleware(f):
    """JWT authentication middleware"""
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