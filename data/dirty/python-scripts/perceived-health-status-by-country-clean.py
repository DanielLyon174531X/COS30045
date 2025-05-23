# Author: Daniel Lyon 174531x
import pandas as pd
import json

# Load the CSV file
csv_path = "..\perceived-health-status-by-country.csv" 
df = pd.read_csv(csv_path)

# Drop rows where OBS_VALUE is missing
df_clean = df.dropna(subset=["OBS_VALUE"])

# Keep only rows for Q1 and Q5 income quintiles
df_clean = df_clean[df_clean["SOCIO_ECON_STATUS"].isin(["Q1", "Q5"])]

# Map ISO country codes to readable names
country_map = {
    "AUS": "Australia", "AUT": "Austria", "BEL": "Belgium", "BGR": "Bulgaria",
    "CAN": "Canada", "CRI": "Costa Rica", "HRV": "Croatia", "CYP": "Cyprus",
    "CZE": "Czechia", "DNK": "Denmark", "EST": "Estonia", "FIN": "Finland",
    "FRA": "France", "DEU": "Germany", "GRC": "Greece", "HUN": "Hungary",
    "ISL": "Iceland", "IRL": "Ireland", "ISR": "Israel", "ITA": "Italy",
    "JPN": "Japan", "KOR": "Korea", "LVA": "Latvia", "LTU": "Lithuania",
    "LUX": "Luxembourg", "MLT": "Malta", "MEX": "Mexico", "NLD": "Netherlands",
    "NOR": "Norway", "POL": "Poland", "PRT": "Portugal", "ROU": "Romania",
    "SVK": "Slovak Republic", "SVN": "Slovenia", "ESP": "Spain", "SWE": "Sweden",
    "CHE": "Switzerland", "GBR": "United Kingdom", "USA": "United States",
    "NZL": "New Zealand"
}

df_clean["Country"] = df_clean["REF_AREA"].map(country_map)

# Only keep required columns and rename them
df_final = df_clean[["Country", "SOCIO_ECON_STATUS", "TIME_PERIOD", "OBS_VALUE"]].copy()
df_final.columns = ["Country", "IncomeQuintile", "Year", "Value"]
df_final["Year"] = df_final["Year"].astype(int)
df_final["Value"] = df_final["Value"].astype(float)

# Sort data for readability
df_final = df_final.sort_values(by=["Country", "IncomeQuintile", "Year"])

# Output to JSON
output_path = "..\..\clean\perceived-health-status-by-country.json"
df_final.to_json(output_path, orient="records", indent=2)
print(f"✅ JSON saved to: {output_path}")
