import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-replace-in-production'
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://almogasia:almog123123@cluster0.tdqiwjv.mongodb.net/cspm_db?retryWrites=true&w=majority&appName=Cluster0'
    JWT_SECRET = os.environ.get('JWT_SECRET') or 'fallback-secret-key'
