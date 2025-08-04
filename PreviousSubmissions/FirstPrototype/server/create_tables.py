from supabase import create_client
import pandas as pd
import os
import sys

# Supabase credentials
url = 'https://fybazhbzdvkvkdfmibli.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5YmF6aGJ6ZHZrdmtkZm1pYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTcyNzIsImV4cCI6MjA2MDM3MzI3Mn0.FRBt-y2WoiTgmJ89sCNljnbpHmtQmgfVTTGk32qVyhc'

# Initialize Supabase client
supabase = create_client(url, key)

# Unfortunately, Supabase Python client doesn't support creating tables directly
# We need to use SQL queries via the REST API or use the Supabase dashboard

print("\nIMPORTANT: You need to manually create tables in your Supabase database.")
print("Please go to https://app.supabase.io/ and navigate to your project.")
print("Then go to 'Table Editor' and create the tables with the following steps:\n")

# For the logs table demonstration,  analyze the Excel file
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
        
        print("\nFor the 'logs' table, create the following columns:")
        print("id: uuid (Primary Key, Default: uuid_generate_v4())")
        
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
        
        print("uploaded_at: timestamp with time zone")
        
    except Exception as e:
        print(f"Error analyzing Excel file: {str(e)}")
else:
    print("\nFor the 'logs' table, create the following columns:")
    print("id: uuid (Primary Key, Default: uuid_generate_v4())")
    print("eventid: text")
    print("eventtime: timestamp with time zone")
    print("sourceipaddress: text")
    print("useragent: text")
    print("eventname: text")
    print("eventsource: text")
    print("awsregion: text")
    print("eventversion: text")
    print("useridentitytype: text")
    print("eventtype: text")
    print("useridentityaccountid: text")
    print("useridentityprincipalid: text")
    print("useridentityarn: text")
    print("useridentityaccesskeyid: text")
    print("useridentityusername: text")
    print("errorcode: text")
    print("errormessage: text")
    print("requestparametersinstancetype: text")
    print("uploaded_at: timestamp with time zone")

print("\nFor the 'aws_accounts' table, create the following columns:")
print("id: uuid (Primary Key, Default: uuid_generate_v4())")
print("account_id: text")
print("account_name: text")
print("created_at: timestamp with time zone (Default: now())")

print("\nAfter creating the tables, run the upload_logs.py script again to upload your data.")
print("If you need help, please refer to the Supabase documentation: https://supabase.com/docs") 