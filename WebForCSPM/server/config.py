import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-replace-in-production'

    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/cspm_db'
    JWT_SECRET = os.environ.get('JWT_SECRET') or 'fallback-secret-key'
