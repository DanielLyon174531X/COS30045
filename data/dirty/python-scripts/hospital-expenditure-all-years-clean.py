# Author: Daniel Lyon 174531x
import pandas as pd

# Load raw CSV
df = pd.read_csv("data/dirty/hospital-expenditure-all.csv")

# Strip whitespace
df["PROVIDER"] = df["PROVIDER"].astype(str).str.strip()
df["FUNCTION"] = df["FUNCTION"].astype(str).str.strip()
df["UNIT_MEASURE"] = df["UNIT_MEASURE"].astype(str).str.strip()

# Filter: All years, % of GDP, Curative care, General hospitals
filtered = df[
    (df["UNIT_MEASURE"] == "PT_B1GQ") &
    (df["FUNCTION"] == "HC1") &
    (df["PROVIDER"] == "HP1") &
    (df["OBS_VALUE"].notnull())
]

# Convert values
filtered["Value"] = pd.to_numeric(filtered["OBS_VALUE"], errors="coerce")
filtered = filtered[["Reference area", "TIME_PERIOD", "Value"]].copy()
filtered.columns = ["Country", "Year", "Value"]

# In case of duplicate rows per year, keep highest value
output = filtered.groupby(["Country", "Year"], as_index=False)["Value"].max()

# Save output
output.to_json("data/clean/hospital-expenditure.json", orient="records", indent=2)

print(f"✅ Exported {len(output)} records across multiple years to 'hospital-expenditure.json'")
