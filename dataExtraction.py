import pandas as pd
import numpy as np



emissions = pd.read_csv("historical_emissions.csv")
print(emissions.columns)
ghg_unique = emissions.Gas.unique()
bad_columns = ['Country', 'Data source', 'Sector', 'Gas', 'Unit']
years = []
for col in emissions.columns:
    if col not in bad_columns:
        years.append(col)
country_unqiue = emissions.Country.unique()
column_names = np.concatenate((["Year", "Country"], ghg_unique), axis=None)
ghg_table = pd.DataFrame(columns = column_names)

# currently a dictionary
data = {}
for country in country_unqiue:
    data[country] = {}
    for year in years:
        data[country][year] = {}
for index, row in emissions.iterrows():
    for year in years:
        data[row['Country']][year][row['Gas']] = row[year]
print(data['Jamaica'])
