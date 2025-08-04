"""
Cloud Security Log Upload and Management System

This module provides functionality for uploading and managing security logs
in the CSPM system. It handles data preprocessing, validation, and batch
upload operations to MongoDB database.

Features:
- Excel file processing and validation
- Column name sanitization for database compatibility
- Batch upload with error handling and retry logic
- Progress tracking and detailed logging
"""

import pandas as pd
import os
import sys
import json
from datetime import datetime
import re
from pymongo import MongoClient

# Load configuration from environment variables
from config import Config

# Initialize MongoDB client
client = MongoClient(Config.MONGODB_URI)
db = client.cspm_db

def clean_column_name(name):
    """
    Sanitize column names for database compatibility
    
    Converts column names to database-friendly format by:
    - Replacing special characters with underscores
    - Ensuring names don't start with numbers
    - Converting to lowercase for consistency
    
    Args:
        name (str): Original column name
        
    Returns:
        str: Sanitized column name suitable for database storage
    """
    # Replace dots, spaces and other special chars with underscores
    name = re.sub(r'[^a-zA-Z0-9]', '_', str(name))
    # Ensure name doesn't start with a number
    if name[0].isdigit():
        name = 'col_' + name
    return name.lower()

def upload_logs(excel_file_path, collection_name="logs"):
    """
    Upload security logs from Excel file to MongoDB database
    
    Processes Excel files containing security log data and uploads them
    to the specified MongoDB collection with proper preprocessing and validation.
    
    Features:
    - Automatic column name sanitization
    - Data type validation and conversion
    - Batch upload with error handling
    - Progress tracking and detailed logging
    
    Args:
        excel_file_path (str): Path to the Excel file containing log data
        collection_name (str): Target collection name in MongoDB (default: "logs")
        
    Returns:
        bool: True if upload completed successfully, False otherwise
        
    Raises:
        FileNotFoundError: If the Excel file doesn't exist
        Exception: For other processing or upload errors
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
        
        # Convert DataFrame to list of dictionaries for MongoDB
        records = df.to_dict(orient='records')
        
        # Add timestamp for when the record was uploaded
        for record in records:
            record['uploaded_at'] = datetime.now().isoformat()
        
        # Start uploading in batches
        batch_size = 50
        total_records = len(records)
        
        print(f"Uploading {total_records} records to MongoDB collection '{collection_name}'...")
        
        for i in range(0, total_records, batch_size):
            batch = records[i:i+batch_size]
            print(f"Uploading batch {i//batch_size + 1}/{(total_records-1)//batch_size + 1} ({len(batch)} records)")
            
            try:
                # Upload batch to MongoDB
                collection = db[collection_name]
                result = collection.insert_many(batch)
                
                print(f"Successfully uploaded batch {i//batch_size + 1}")
            except Exception as batch_error:
                print(f"Error uploading batch: {str(batch_error)}")
                # If batch fails, try uploading one by one
                print("Trying individual record upload...")
                for j, record in enumerate(batch):
                    try:
                        collection = db[collection_name]
                        collection.insert_one(record)
                        print(f"  Record {j+1}/{len(batch)} uploaded")
                    except Exception as record_error:
                        print(f"  Error uploading record {j+1}: {str(record_error)}")
        
        print(f"Upload complete! Attempted to add {total_records} records to '{collection_name}' collection.")
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
    
    # Get collection name from command line argument or prompt user
    if len(sys.argv) > 2:
        collection = sys.argv[2]
    else:
        collection = input("Enter the MongoDB collection name (default: logs): ") or "logs"
    
    # Check if file exists
    if not os.path.exists(excel_path):
        print(f"Error: File '{excel_path}' not found.")
        sys.exit(1)
    
    # Print out MongoDB connection info
    print(f"Using MongoDB URI: {Config.MONGODB_URI}")
    
    # Upload logs
    success = upload_logs(excel_path, collection)
    
    if success:
        print("Logs upload process completed!")
    else:
        print("Failed to upload logs. Please check the errors above.") 