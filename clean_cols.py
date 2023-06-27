import pandas as pd
import os

# Set the folder path containing the tables
folder_path = "/Users/lucabattistella/Downloads/tmf"

# Get the list of files in the folder
file_list = os.listdir(folder_path)

# Iterate over each file
for file_name in file_list:
    # Check if the file is a CSV file
    if file_name.endswith(".csv"):
        file_path = os.path.join(folder_path, file_name)
        
        # Read the CSV file into a pandas DataFrame
        df = pd.read_csv(file_path)
        
        # Remove columns from the DataFrame
        columns_to_remove = ['FID_terres','pid']  # Replace with your column names
        
        # Check if the columns exist in the DataFrame
        columns_present = all(column in df.columns for column in columns_to_remove)
        
        if columns_present:
            # Remove columns from the DataFrame
            df.drop(columns=columns_to_remove, inplace=True)
            
            # Save the modified DataFrame back to the file
            df.to_csv(file_path, index=False)
        else:
            print(f"Columns not found in file: {file_name}")
