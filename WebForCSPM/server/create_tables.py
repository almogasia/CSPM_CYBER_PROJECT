"""
Database Schema Management for CSPM System

This module provides database schema analysis and collection creation guidance
for the Cloud Security Posture Management system. It analyzes Excel files
to determine appropriate field types and provides instructions for
setting up the required database collections in MongoDB.

Features:
- Excel file analysis for schema determination
- Field type inference and mapping
- Database schema generation guidance
- MongoDB collection creation instructions
"""

import pandas as pd
import os
import sys
from pymongo import MongoClient

# Load configuration from environment variables
from config import Config

# Initialize MongoDB client
print("Connecting to MongoDB...")
client = MongoClient(Config.MONGODB_URI)
db = client.cspm_db
print("Connected!")

print("\nIMPORTANT: MongoDB collections are created automatically when data is inserted.")
print("The following schema information is provided for reference:\n")

# For the logs table demonstration, let's analyze the Excel file
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    excel_file = sys.argv[1]
    print(f"Analyzing Excel file: {excel_file}")
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        
        # Clean column names (same function as in upload_logs.py)
        def clean_column_name(name):
            import re
            name = re.sub(r'[^a-zA-Z0-9]', '_', str(name))
            if name[0].isdigit():
                name = 'col_' + name
            return name.lower()
        
        # Get column names and data types
        columns = df.columns
        cleaned_columns = [clean_column_name(col) for col in columns]
        dtypes = df.dtypes
        
        print("\nFor the 'logs' collection, the following fields will be created:")
        print("_id: ObjectId (Primary Key, Auto-generated)")
        
        for i, (col, clean_col) in enumerate(zip(columns, cleaned_columns)):
            dtype = dtypes[i]
            pg_type = "text"  # Default to text for most columns
            
            if "float" in str(dtype).lower():
                pg_type = "double precision"
            elif "int" in str(dtype).lower():
                pg_type = "integer"
            elif "time" in str(dtype).lower() or "date" in str(dtype).lower():
                pg_type = "timestamp with time zone"
            
            print(f"{clean_col}: {pg_type} (Original name: {col})")
        
        print("uploaded_at: datetime")
        
    except Exception as e:
        print(f"Error analyzing Excel file: {str(e)}")
else:
    print("\nFor the 'logs' collection, the following fields will be created:")
    print("_id: ObjectId (Primary Key, Auto-generated)")
    print("eventid: string")
    print("eventtime: datetime")
    print("sourceipaddress: string")
    print("useragent: string")
    print("eventname: string")
    print("eventsource: string")
    print("awsregion: string")
    print("eventversion: string")
    print("useridentitytype: string")
    print("eventtype: string")
    print("useridentityaccountid: string")
    print("useridentityprincipalid: string")
    print("useridentityarn: string")
    print("useridentityaccesskeyid: string")
    print("useridentityusername: string")
    print("errorcode: string")
    print("errormessage: string")
    print("requestparametersinstancetype: string")
    print("uploaded_at: datetime")

print("\nFor the 'aws_accounts' collection, the following fields will be created:")
print("_id: ObjectId (Primary Key, Auto-generated)")
print("account_id: string")
print("account_name: string")
print("created_at: datetime")

print("\nAfter setting up the database, run the upload_logs.py script to upload your data.")
print("If you need help, please refer to the MongoDB documentation: https://docs.mongodb.com/") 