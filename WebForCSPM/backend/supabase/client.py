from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize the Supabase client
supabase = create_client(
    'https://fybazhbzdvkvkdfmibli.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5YmF6aGJ6ZHZrdmtkZm1pYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTcyNzIsImV4cCI6MjA2MDM3MzI3Mn0.FRBt-y2WoiTgmJ89sCNljnbpHmtQmgfVTTGk32qVyhc'
)
