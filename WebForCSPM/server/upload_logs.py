import pandas as pd
import os
import sys
from supabase import create_client
import json
from datetime import datetime
import re

# Supabase credentials
url = 'https://fybazhbzdvkvkdfmibli.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5YmF6aGJ6ZHZrdmtkZm1pYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTcyNzIsImV4cCI6MjA2MDM3MzI3Mn0.FRBt-y2WoiTgmJ89sCNljnbpHmtQmgfVTTGk32qVyhc'

# Initialize Supabase client
supabase = create_client(url, key)

def clean_column_name(name):
    """Clean column names to make them database-friendly"""
    # Replace dots, spaces and other special chars with underscores
    name = re.sub(r'[^a-zA-Z0-9]', '_', str(name))
    # Ensure name doesn't start with a number
    if name[0].isdigit():
        name = 'col_' + name
    return name.lower()

def upload_logs(excel_file_path, table_name="logs"):
    """
    Upload logs from Excel file to Supabase
    
    Parameters:
    - excel_file_path: Path to the Excel file
    - table_name: Name of the table in Supabase to upload to
    """
    try:
        print(f"Reading Excel file: {excel_file_path}")
        # Read Excel file
        df = pd.read_excel(excel_file_path)
        
        # Display basic info about the data
        print(f"Excel file contains {len(df)} rows and {len(df.columns)} columns")
        print(f"Original columns: {', '.join(df.columns)}")
        
        # Clean column names to make them database-friendly
        df.columns = [clean_column_name(col) for col in df.columns]
        print(f"Cleaned columns: {', '.join(df.columns)}")
        
        # Check for NaN values and convert to None (null in JSON)
        df = df.where(pd.notnull(df), None)
        
        # Preview the first row as JSON to check format
        first_row = df.iloc[0].to_dict()
        print(f"First row preview: {json.dumps(first_row, default=str)[:200]}...")
        
        # Convert DataFrame to list of dictionaries for Supabase
        records = df.to_dict(orient='records')
        
        # Add timestamp for when the record was uploaded
        for record in records:
            record['uploaded_at'] = datetime.now().isoformat()
        
        # Start uploading in batches (to avoid hitting API limits)
        batch_size = 50
        total_records = len(records)
        
        print(f"Uploading {total_records} records to Supabase table '{table_name}'...")
        
        for i in range(0, total_records, batch_size):
            batch = records[i:i+batch_size]
            print(f"Uploading batch {i//batch_size + 1}/{(total_records-1)//batch_size + 1} ({len(batch)} records)")
            
            try:
                # Upload batch to Supabase
                response = supabase.table(table_name).insert(batch).execute()
                
                # Check for errors
                if hasattr(response, 'error') and response.error:
                    print(f"Error uploading batch: {response.error}")
                    continue
                
                print(f"Successfully uploaded batch {i//batch_size + 1}")
            except Exception as batch_error:
                print(f"Error uploading batch: {str(batch_error)}")
                # If batch fails, try uploading one by one
                print("Trying individual record upload...")
                for j, record in enumerate(batch):
                    try:
                        individual_response = supabase.table(table_name).insert(record).execute()
                        print(f"  Record {j+1}/{len(batch)} uploaded")
                    except Exception as record_error:
                        print(f"  Error uploading record {j+1}: {str(record_error)}")
        
        print(f"Upload complete! Attempted to add {total_records} records to '{table_name}' table.")
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Get Excel file path from command line argument or prompt user
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        excel_path = input("Enter the path to your Excel file: ")
    
    # Get table name from command line argument or prompt user
    if len(sys.argv) > 2:
        table = sys.argv[2]
    else:
        table = input("Enter the Supabase table name (default: logs): ") or "logs"
    
    # Check if file exists
    if not os.path.exists(excel_path):
        print(f"Error: File '{excel_path}' not found.")
        sys.exit(1)
    
    # Print out Supabase URL and key first characters to verify
    print(f"Using Supabase URL: {url}")
    print(f"Using Supabase key (first 10 chars): {key[:10]}...")
    
    # Upload logs
    success = upload_logs(excel_path, table)
    
    if success:
        print("Logs upload process completed!")
    else:
        print("Failed to upload logs. Please check the errors above.") 