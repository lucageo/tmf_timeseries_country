import pandas as pd

# Read the CSV file into a pandas DataFrame
df = pd.read_csv("/path/to/your/file.csv")

# Iterate over each column
for column in df.columns:
    # Check if the column contains "UndisturbedForest"
    if "UndisturbedForest" in column:
        # Extract the year from the first 4 characters of the column name
        year = column[:4]
        
        # Construct the corresponding "POLY_AREA" column name
        poly_area_column = year + "_POLY_AREA"
        
        # Check if the "POLY_AREA" column exists
        if poly_area_column in df.columns:
            # Calculate the percentage of UndisturbedForest against POLY_AREA
            df[column + "_" + year] = (df[column] / df[poly_area_column]) * 100

# Save the modified DataFrame back to a new CSV file
df.to_csv("/path/to/your/new_file.csv", index=False)
