# Author: Daniel Lyon 174531x
import pandas as pd

# Setup
YEAR = 2021;

# Load raw CSV
df = pd.read_csv("data/dirty/hospital-expenditure-all.csv")

# Strip whitespace from important fields
df["PROVIDER"] = df["PROVIDER"].astype(str).str.strip()
df["FUNCTION"] = df["FUNCTION"].astype(str).str.strip()
df["UNIT_MEASURE"] = df["UNIT_MEASURE"].astype(str).str.strip()

# Filter: 2016, Percentage of GDP, Curative care, General hospitals
filtered = df[
    (df["TIME_PERIOD"] == YEAR) & #Adjust to obtain data from a specific year.
    (df["UNIT_MEASURE"] == "PT_B1GQ") &
    (df["FUNCTION"] == "HC1") &
    (df["PROVIDER"] == "HP1") &
    (df["OBS_VALUE"].notnull())
]

# Rename and convert
filtered["Value"] = pd.to_numeric(filtered["OBS_VALUE"], errors="coerce")
filtered = filtered[["Reference area", "TIME_PERIOD", "Value"]].copy()
filtered.columns = ["Country", "Year", "Value"]

# Keep only highest value per country in case of duplicates
output = filtered.groupby(["Country", "Year"], as_index=False)["Value"].max()

# Save to JSON
output.to_json(f"data/clean/hospital-expenditure-{YEAR}.json", orient="records", indent=2)

print(f"✅ Exported {len(output)} clean records to 'hospital-expenditure-{YEAR}.json'")
