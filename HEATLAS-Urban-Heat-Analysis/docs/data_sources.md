# Data sources referenced by the GEE script

The collection identifiers below are taken from `GEE/Jaipur_Heat_v3.js`. They document what the script references; they are not a substitute for checking each product's catalogue documentation, processing level, temporal coverage, scale and terms of use.

| Dataset / Earth Engine collection | Role in the current workflow |
|---|---|
| `FAO/GAUL/2015/level2` | Administrative boundary; filtered to the Jaipur district feature. |
| `MODIS/061/MOD11A2` | Daytime and nighttime land surface temperature bands. The script applies the MODIS scale factor and converts Kelvin to Celsius. |
| `COPERNICUS/S2_SR_HARMONIZED` | Surface reflectance used to derive NDVI, NDBI, NDWI, albedo and fractional vegetation cover (FVC). |
| `ECMWF/ERA5_LAND/HOURLY` | Meteorological and land variables, including temperature, dew point, humidity-related inputs, wind, precipitation, radiation, evaporation, soil temperature and soil moisture. |
| `COPERNICUS/S5P/OFFL/L3_AER_AI` | Absorbing aerosol index input. |
| `USGS/SRTMGL1_003` | Elevation and terrain derivatives, including slope and aspect. |
| `ESA/WorldCover/v200` | Land-cover classification. |
| `MODIS/061/MOD16A2` | Evapotranspiration input. The script also derives an ET collection count over a fixed 2025 date range. |
| `WorldPop/GP/100m/pop` | Gridded population input, identified in the script as the 100 m population product. |

## Temporal windows visible in the current script

- A rolling 16-day window is defined from the run date and used by several collections, including Sentinel-2, ERA5-Land and Sentinel-5P.
- MODIS MOD11A2 LST is filtered over the preceding 40 days.
- MODIS MOD16A2 ET is filtered using the fixed interval `2025-01-01` to `2025-12-31`.
- WorldPop is a static population layer rather than a contemporaneous observation matching the satellite windows.

The aim of this architechture was to make every data update together, if some datasets and satellite analysis are updated while others still need time then analysis can go wrong.
