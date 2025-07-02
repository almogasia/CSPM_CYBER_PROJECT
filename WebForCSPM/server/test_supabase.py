from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = 'https://fybazhbzdvkvkdfmibli.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5YmF6aGJ6ZHZrdmtkZm1pYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTcyNzIsImV4cCI6MjA2MDM3MzI3Mn0.FRBt-y2WoiTgmJ89sCNljnbpHmtQmgfVTTGk32qVyhc'

print(f"Using URL: {url}")
print(f"Using KEY (first 10 chars): {key[:10]}...")

try:
    print("Attempting to connect to Supabase...")
    supabase = create_client(url, key)
    
    # Get the list of tables
    print("Fetching list of tables...")
    
    try:
        # Try to query the aws_accounts table
        print("Trying to query aws_accounts table...")
        response = supabase.table('aws_accounts').select('*').limit(1).execute()
        print(f"aws_accounts table exists. Response: {response}")
    except Exception as e:
        print(f"Error querying aws_accounts: {str(e)}")
    
    try:
        # Try to query the logs table
        print("Trying to query logs table...")
        response = supabase.table('logs').select('*').limit(1).execute()
        print(f"logs table exists. Response: {response}")
    except Exception as e:
        print(f"Error querying logs: {str(e)}")
    
except Exception as e:
    print(f"Error connecting to Supabase: {str(e)}") 