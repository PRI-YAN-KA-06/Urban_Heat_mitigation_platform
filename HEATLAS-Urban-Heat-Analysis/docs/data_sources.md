# Data Sources and Temporal Configuration

This document records the external datasets referenced by the current Google Earth Engine implementation in [`GEE/Jaipur_Heat_v3.js`](../GEE/Jaipur_Heat_v3.js). It distinguishes the datasets actually called by the script from datasets mentioned in earlier proposal material.

The Jaipur pilot combines eight Earth-observation, environmental and population datasets with one administrative boundary layer. All collections are accessed through the Google Earth Engine data catalogue. The 1 km analysis grid is a common reporting framework; it does not change the native resolution, observation period or uncertainty of the source data.

## 1. Dataset inventory

| Dataset / product | Earth Engine asset ID | Information used in the script | Source-data characteristics |
|---|---|---|---|
| FAO Global Administrative Unit Layers (GAUL), 2015, Level 2 | `FAO/GAUL/2015/level2` | Jaipur district boundary, selected using `ADM2_NAME = 'Jaipur'` | Administrative boundary FeatureCollection; not a satellite observation. |
| MODIS Terra Land Surface Temperature and Emissivity, MOD11A2 v6.1 | `MODIS/061/MOD11A2` | `LST_Day_1km` and `LST_Night_1km` for daytime and nighttime land-surface temperature | 8-day composite; nominal 1 km pixel size. |
| Sentinel-2 MSI Level-2A Surface Reflectance, Harmonized | `COPERNICUS/S2_SR_HARMONIZED` | B2, B3, B4, B8 and B11 for spectral indices and the script's albedo estimate; SCL for masking | Multispectral surface-reflectance product; band pixel sizes vary (the bands used here include 10 m and 20 m bands); nominal 5-day revisit. |
| ERA5-Land Hourly | `ECMWF/ERA5_LAND/HOURLY` | Air temperature, dew point, 10 m wind components, surface pressure, precipitation, solar radiation, evaporation, soil temperature, soil moisture and vegetation LAI components | Hourly reanalysis; approximately 11,132 m grid spacing. |
| Sentinel-5P TROPOMI OFFL Level-3 Aerosol Index | `COPERNICUS/S5P/OFFL/L3_AER_AI` | `absorbing_aerosol_index` | Offline UV absorbing-aerosol index product; nominal 2-day revisit. |
| SRTM Global 1 arc-second DEM | `USGS/SRTMGL1_003` | Elevation; slope and aspect are derived from the DEM using `ee.Terrain` | Static elevation product with approximately 30 m pixels. |
| ESA WorldCover 10 m v200 (2021) | `ESA/WorldCover/v200` | `Map` land-cover class band | 2021 land-cover map at 10 m resolution. |
| WorldPop Global Project population, 100 m | `WorldPop/GP/100m/pop` | `population` band for the 2020 period | Gridded estimated residential population at approximately 100 m. |
| MODIS Terra Net Evapotranspiration, MOD16A2 v6.1 | `MODIS/061/MOD16A2` | `ET` band for the evapotranspiration input | 8-day composite at 500 m pixel size. |

Dataset descriptions, band details, spatial characteristics and terms should be checked in the linked [Google Earth Engine Data Catalog](https://developers.google.com/earth-engine/datasets) pages. Direct catalogue references are provided in Section 5.

## 2. How each source is processed

### 2.1 Administrative boundary: FAO GAUL

The script loads the Level-2 GAUL FeatureCollection and selects the feature whose `ADM2_NAME` property equals `Jaipur`. This geometry is used to clip imagery, filter source collections by location, create the 1 km grid and define the study area.

GAUL is a 2015 administrative boundary reference. It should not be described as a newly surveyed or automatically updated municipal boundary. Check FAO's dataset terms before redistributing the source boundary or derivative boundary data.

### 2.2 MODIS MOD11A2: day and night LST

The script filters the MOD11A2 collection to Jaipur and the 40 days preceding the run date. It calculates a collection mean separately for `LST_Day_1km` and `LST_Night_1km`, multiplies the values by 0.02, subtracts 273.15 to convert Kelvin to degrees Celsius, renames the bands and clips them to Jaipur.

The collection is an 8-day composite product with a nominal 1 km pixel size. The script does not select or apply a separate quality-control band mask in this section; the current outputs should therefore be interpreted with that processing choice in mind.

### 2.3 Sentinel-2: surface-reflectance indicators

The Sentinel-2 SR Harmonized collection is filtered to Jaipur and the rolling 16-day interval. Scenes are additionally filtered using `CLOUDY_PIXEL_PERCENTAGE < 20`. The script then applies a Scene Classification Layer mask, excluding SCL values 3, 8, 9 and 10, before creating a median composite.

The composite bands are used as follows:

- B8 and B4: NDVI.
- B11 and B8: NDBI.
- B3 and B8: NDWI.
- B2, B3, B4 and B8: the albedo expression currently implemented in the script.

The bands do not all have the same native pixel size: B2, B3, B4 and B8 are 10 m, while B11 is 20 m in the Sentinel-2 catalogue. The albedo expression and its suitability for quantitative use are flagged for review in the methodology document.

The cloud procedure here consists of a scene-level cloudy-pixel-percentage filter and an SCL-based mask. The script does not call a separate Sentinel-2 cloud-probability or Cloud Score+ collection.

### 2.4 ERA5-Land: meteorological and land variables

The ERA5-Land Hourly collection is filtered to Jaipur and the same rolling 16-day interval used by Sentinel-2 and Sentinel-5P. The script forms a mean image for selected variables and derives:

- Air temperature from `temperature_2m`, converted from Kelvin to Celsius.
- Dew-point temperature from `dewpoint_temperature_2m`, converted from Kelvin to Celsius.
- Wind speed from the 10 m `u_component_of_wind_10m` and `v_component_of_wind_10m` components.
- Relative humidity from air temperature and dew point using the coded saturation-vapour-pressure relationship.
- Surface pressure from `surface_pressure`, converted to hPa.
- Soil temperature from `soil_temperature_level_1`, converted to Celsius.
- Soil moisture from `volumetric_soil_water_layer_1`.
- LAI by adding `leaf_area_index_high_vegetation` and `leaf_area_index_low_vegetation`.

For accumulated variables, precipitation is summed and converted to millimetres; `total_evaporation` is also summed and converted using the script's sign and unit conversion. Solar radiation is averaged and divided by 1,000,000 in the current implementation. These transformations should be interpreted in the context of ERA5-Land's hourly accumulation conventions. The Earth Engine catalogue also documents known swapped values among three ERA5-Land evaporation components; validate evaporation-derived results before relying on them quantitatively.

ERA5-Land has an approximately 11.1 km native grid. Its values are therefore much coarser than the 1 km reporting grid and the Sentinel-2 bands. Aggregating or displaying these values on a 1 km grid does not create 1 km meteorological information.

### 2.5 Sentinel-5P: absorbing aerosol index

The script filters `COPERNICUS/S5P/OFFL/L3_AER_AI` to Jaipur and the rolling 16-day interval, calculates the mean and selects `absorbing_aerosol_index`. The output is renamed `Aerosol` and clipped to the district.

The absorbing aerosol index is an indicator related to UV-absorbing aerosols such as dust and smoke. It is not the same measurement as aerosol optical depth or particulate-matter concentration.

### 2.6 SRTM: terrain

The script loads `USGS/SRTMGL1_003` as a static elevation image. It clips elevation to Jaipur and derives slope and aspect using `ee.Terrain.slope()` and `ee.Terrain.aspect()`. No date filter is applied.

### 2.7 ESA WorldCover: land cover

The script loads `ESA/WorldCover/v200`, selects the first image, renames the `Map` band to `LandCover` and clips it to Jaipur. This catalogue asset represents the ESA WorldCover 2021 v200 map at 10 m resolution. The script does not dynamically select a newer WorldCover year.

### 2.8 WorldPop: population

The script filters `WorldPop/GP/100m/pop` to the 2020 calendar-year interval, selects the first image, renames the population band and clips it to Jaipur. The values represent estimated residential population at approximately 100 m grid spacing.

The current final grid aggregation applies a mean reducer to the population band. As a result, the grid-level value is a mean of source pixel values, not a sum of residents in each 1 km cell. This is an identified limitation; a population-total output would require an appropriate sum-based aggregation.

### 2.9 MODIS MOD16A2: evapotranspiration

The script filters `MODIS/061/MOD16A2` to Jaipur using `filterDate('2025-01-01', '2025-12-31')`, selects `ET`, and calculates the mean of the selected 8-day composite images. Earth Engine's `filterDate()` uses an exclusive end date, so the upper bound is not itself included. It masks values not greater than -3000, multiplies by 0.1, renames the result `ET` and clips it to Jaipur. A separate collection count is printed using the same fixed date interval.

This is a fixed 2025 window in the current code, not a rolling 16-day window or an automatically refreshed latest-available period. The script uses the mean of the selected ET composite band images; it does not calculate an annual sum of all ET observations.

## 3. Temporal configuration in the current script

| Input | Date selection in code | Temporal operation |
|---|---|---|
| Sentinel-2 SR Harmonized | Rolling 16 days ending at script run date | Scene filter, SCL mask, then median composite |
| ERA5-Land Hourly | Rolling 16 days ending at script run date | Mean image for selected variables; sums for precipitation and evaporation |
| Sentinel-5P Aerosol Index | Rolling 16 days ending at script run date | Collection mean |
| MODIS MOD11A2 LST | 40 days preceding script run date | Separate collection means for day and night LST |
| MODIS MOD16A2 ET | Fixed `2025-01-01` to `2025-12-31` interval | Mean of selected ET composite images; separate count printed |
| WorldPop | Fixed 2020 calendar-year filter | First matching image selected |
| ESA WorldCover v200 | No date filter in the script | First image selected; catalogue product is the 2021 map |
| SRTM DEM | No date filter in the script | Static DEM image |
| FAO GAUL Level 2 | No date filter in the script | Static administrative boundary reference |

The rolling window is defined once as `startDate = endDate.advance(-16, 'day')`, where `endDate` is set from the script run date. The collection filters use `endDate` as an exclusive upper bound. MODIS LST uses a separate 40-day window. The inputs therefore do not represent a single synchronised observation period. The hackathon proposal described a broader adaptive update policy, but that complete multi-source update policy is not implemented by this script.

## 4. Datasets mentioned in proposal material but not used by this GEE script

The following should not be listed as inputs to the current `Jaipur_Heat_v3.js` workflow:

- **NASA SMAP soil moisture:** not called by the current GEE script. The soil-moisture variable in this implementation comes from ERA5-Land.
- **MODIS Aqua LST (`MYD11A2`):** not called. The current day/night LST source is MODIS Terra `MOD11A2`.
- **Landsat thermal imagery:** not used in this GEE analysis script. A separate Landsat reference exists in the backend prototype, but that is not the source for the GEE v3 analysis documented here.

Listing these separately avoids confusing proposal-stage dataset plans with implemented data inputs.

## 5. Dataset catalogue references and attribution

Use the following official Earth Engine catalogue pages for full band descriptions, dataset provenance, citation guidance and terms of use:

1. [FAO GAUL 2015 Level 2](https://developers.google.com/earth-engine/datasets/catalog/FAO_GAUL_2015_level2)
2. [MODIS MOD11A2 v6.1](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2)
3. [Sentinel-2 SR Harmonized](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
4. [ERA5-Land Hourly](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_HOURLY)
5. [Sentinel-5P OFFL Level-3 Aerosol Index](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_AER_AI)
6. [SRTM Global 1 arc-second DEM](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003)
7. [ESA WorldCover 10 m v200](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200)
8. [WorldPop Global Project 100 m Population](https://developers.google.com/earth-engine/datasets/catalog/WorldPop_GP_100m_pop)
9. [MODIS MOD16A2 v6.1](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD16A2)

The project should retain appropriate dataset acknowledgements in any public reports, derived-data releases or publications. Check each source's current terms before redistributing source data or derived products, with particular attention to the stated FAO GAUL licence conditions, Copernicus Sentinel terms and WorldPop attribution requirements.

## 6. Reproducibility note

A reproducible data run should record at least the script version, run date, exact start and end dates used for each collection, collection counts, source product identifiers, processing choices and any missing-data conditions. The current script prints selected counts and results in the Earth Engine console, but it does not yet create a persistent export manifest or export the final grid table automatically. That export and run-metadata workflow remains future work.
