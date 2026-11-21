# Google Earth Engine (GEE) Analysis

This directory contains the Google Earth Engine implementation used for the Jaipur pilot of **HEATLAS — Urban Heat Intelligence and Mitigation Platform**.

The main script combines satellite, land-surface, terrain, population and meteorological datasets to build a nominal 1 km analysis grid, derive urban and environmental indicators, calculate composite heat-related indices, and display spatial layers in the Google Earth Engine Code Editor.

> **Implementation scope:** This README describes the code currently present in `Jaipur_Heat_v3.js`. The script is an analytical prototype. Its outputs and indices should not be treated as independently validated measurements or operational recommendations. Known limitations are listed below.


## Study area and spatial framework

- **Pilot area:** Jaipur district, Rajasthan, India.
- **Administrative boundary:** `FAO/GAUL/2015/level2`, filtered using `ADM2_NAME = 'Jaipur'`.
- **Grid:** `coveringGrid()` using `EPSG:3857` and a nominal cell size of 1,000 metres.
- **Grid attributes:** grid identifier, country, state, district, cell area, centroid latitude and longitude, update date and a quality-status field.

The project status report describes the grid as approximately 14,739 cells. The feature count should be checked in the GEE Console for each run rather than assumed to be constant.

## Data sources referenced in the script

| Data source | Earth Engine collection ID | Use in this workflow |
|---|---|---|
| FAO GAUL administrative boundaries | `FAO/GAUL/2015/level2` | Jaipur district boundary. |
| MODIS Terra 8-day LST | `MODIS/061/MOD11A2` | Daytime and nighttime land surface temperature. The script applies the scale factor and converts Kelvin to Celsius. |
| Sentinel-2 Surface Reflectance Harmonized | `COPERNICUS/S2_SR_HARMONIZED` | Spectral inputs for NDVI, NDBI, NDWI, albedo and fractional vegetation cover. |
| ERA5-Land Hourly | `ECMWF/ERA5_LAND/HOURLY` | Meteorological and land variables, including air temperature, dew point, wind, humidity-related inputs, precipitation, solar radiation, evaporation, soil temperature, soil moisture and leaf area index inputs. |
| Sentinel-5P Aerosol Index | `COPERNICUS/S5P/OFFL/L3_AER_AI` | Absorbing aerosol index. |
| SRTM elevation | `USGS/SRTMGL1_003` | Elevation, slope and aspect. |
| ESA WorldCover | `ESA/WorldCover/v200` | Land-cover classification. |
| MODIS Evapotranspiration | `MODIS/061/MOD16A2` | Evapotranspiration input. |
| WorldPop population | `WorldPop/GP/100m/pop` | Population input, filtered to the 2020 calendar year. |

These are the collection identifiers referenced by the script. Their native spatial resolutions, temporal coverage, band definitions and processing characteristics differ; the nominal 1 km grid does not make every source a 1 km-resolution observation.

## Processing workflow

The main processing sequence in `Jaipur_Heat_v3.js` is:

1. **Select the study area** using the Jaipur district feature from GAUL.
2. **Define input time windows.** A rolling 16-day window is defined for several collections; MODIS LST uses the previous 40 days; MODIS ET uses a fixed 2025 date interval; WorldPop is filtered to 2020.
3. **Create the spatial grid** and attach administrative and geometric metadata to each grid cell.
4. **Prepare input layers.** The script filters and masks Sentinel-2 imagery, calculates a mean MODIS LST image, processes ERA5-Land variables and obtains the other environmental datasets.
5. **Derive spectral and environmental indicators** such as NDVI, NDBI, NDWI, albedo, FVC, built-density proxy, green-cover mask, terrain, population exposure, ET, LAI and soil moisture.
6. **Calculate composite indices** for heat storage, cooling capacity, day heat risk, night heat risk, exposure, vulnerability and resilience.
7. **Create categorical classes and intervention-suitability masks** using the thresholds encoded in the script.
8. **Aggregate selected image bands to the grid** using `reduceRegions()` with a mean reducer at a nominal scale of 1,000 metres, print sample results to the Console and display the resulting grid layer.

A more detailed description and formulation is available in [`../docs/methodology.md`](../docs/methodology.md).

## Main derived indicators and analytical layers

### Spectral and environmental indicators

- **NDVI:** vegetation greenness, calculated from Sentinel-2 B8 and B4.
- **NDBI:** built-up spectral proxy, calculated from B11 and B8.
- **NDWI:** water/moisture-related spectral indicator, calculated from B3 and B8.
- **Albedo:** reflectance-derived estimate using Sentinel-2 bands in the expression coded in the script.
- **FVC:** fractional vegetation cover estimate derived from NDVI and clamped to the 0–1 range.
- **Built Density:** neighbourhood mean of a binary NDBI-greater-than-zero mask using a 500 m focal radius. This is a proxy, not a mapped building-footprint density.
- **Green Cover:** binary mask where NDVI is greater than 0.30; the script also prints a district-level percentage estimate.
- **Population Exposure:** a normalised population input used in the exposure calculations.
- **Terrain and other inputs:** elevation, aspect, land cover, aerosol index, air/dew-point temperature, relative humidity, wind, precipitation, solar radiation, evaporation, soil temperature, evapotranspiration, LAI and soil moisture.

### Composite indices

- **Heat Storage Index:** weighted combination of normalised day and night LST, built density, NDBI, albedo deficit and vegetation deficit.
- **Cooling Capacity Index:** weighted combination of NDVI, ET, soil moisture, NDWI, FVC and LAI.
- **Day Heat Risk:** combines daytime heat drivers, cooling deficit and environmental stress.
- **Night Heat Risk:** combines nighttime LST, heat storage, built density, NDBI and cooling deficit.
- **Exposure:** population-related normalised input and its categorical class.
- **Vulnerability:** weighted combination of day heat risk, night heat risk and exposure.
- **Resilience:** weighted combination of vegetation, ET, soil moisture, NDWI, FVC and LAI.
- **Heat Class:** categorical classification derived from Day Heat Risk.

The indices are constructed from normalised inputs and chosen weights. They are not direct measurements of heat storage, cooling performance, vulnerability or resilience. Their interpretation depends on input quality, normalisation ranges, spatial and temporal scale, and the selected weights.

### Mitigation-suitability masks

Four rule-based masks are generated:

| Layer | Rule currently encoded in the script |
|---|---|
| `Cool Roof Zones` | Day Heat Risk > 0.70, NDBI > 0 and NDVI < 0.30. |
| `Urban Forest Zones` | Day Heat Risk > 0.60, NDVI < 0.30 and FVC < 0.40. |
| `Water Cooling Zones` | Day Heat Risk > 0.60, NDWI < 0 and soil moisture < 0.20. |
| `Reflective Surface Zones` | Day Heat Risk > 0.65, albedo < 0.20 and NDBI > 0. |

These masks identify cells meeting the coded screening conditions. They do not estimate the temperature reduction, cost, feasibility, land availability or effectiveness of an intervention.

## Map layers displayed in the GEE Code Editor

The following names correspond to the `Map.addLayer()` labels in the current script. Layer visibility and order can be managed from the **Layers** panel in the Code Editor.

| Group | Displayed layer names |
|---|---|
| Study area and grid | `Jaipur Boundary`, `Grid`, `COMPLETE HEAT DATASET` |
| Thermal | `MODIS Day LST`, `MODIS Night LST`, `Heat Zones`, `Heat Class` |
| Spectral and land surface | `NDVI`, `NDBI`, `NDWI`, `Albedo`, `FVC`, `Green Cover`, `Built Density`, `Land Cover` |
| Terrain and atmosphere | `DEM`, `Aspect`, `Aerosol` |
| Population and environment | `Population`, `Population Exposure`, `Exposure Class`, `Evapotranspiration`, `LAI`, `Soil Moisture` |
| Composite analysis | `Heat Storage`, `Cooling Capacity`, `Day Heat Risk`, `Night Heat Risk`, `Vulnerability`, `Vulnerability Class`, `Resilience`, `Resilience Class` |
| Mitigation suitability | `Cool Roof Zones`, `Urban Forest Zones`, `Water Cooling Zones`, `Reflective Surface Zones` |


## How to run the script

1. Sign in to the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Open `Jaipur_Heat_v3.js` from this repository.
3. Copy the script into a new or existing Code Editor script.
4. Run the script and allow Earth Engine to evaluate the collections and calculations.
5. Use the **Map** and **Layers** panels to inspect the Jaipur boundary, grid, input indicators, composite indices and mitigation-suitability masks.
6. Use the **Console** to inspect printed collection counts, sample grid features and the final feature-collection size.

Execution depends on access to Google Earth Engine and the availability of the referenced datasets for the selected date windows. Processing time and successful evaluation can vary with collection availability and Earth Engine computation limits.

## Current output and export status

In this version, the script:

- displays the map layers in the Code Editor;
- prints selected information and sample features in the Console; and
- creates a grid-level feature collection in the active Earth Engine session.

**The script does not currently contain an active CSV, GeoJSON, raster or Earth Engine Asset export task.** The final dataset is not automatically saved to Google Drive or an Earth Engine Asset by running this version.

## Known limitations to consider when interpreting results

1. **Day Heat Risk weights:** the component weights currently sum to 1.08 (0.65 + 0.30 + 0.13), while the result is clamped to 0–1. High values may saturate; the weighting should be reviewed and sensitivity-tested.
2. **Nighttime LST in the final grid dataset:** nighttime LST is displayed and contributes to Night Heat Risk, but the raw `NightLST` band is not separately added to the final `allBands` stack.
3. **Population aggregation:** the final `reduceRegions()` applies `ee.Reducer.mean()` to the stacked bands, including population. The resulting population field is therefore a mean pixel value, not a sum of people per 1 km cell.
4. **Albedo formulation:** the Sentinel-2 albedo expression requires verification against an appropriate published method before quantitative interpretation.
5. **Different observation periods:** the inputs do not share one synchronised time window. MODIS LST uses 40 days, several collections use a rolling 16 days, ET uses a fixed 2025 interval, and WorldPop is from 2020.
6. **Collection availability:** explicit empty-collection checks and fallback handling should be added for inputs that may have no usable images in a selected window.
7. **Mixed native resolutions:** source datasets have different spatial resolutions. Aggregation to a nominal 1 km grid does not create finer spatial detail in coarser inputs.
8. **Built-density proxy:** NDBI greater than zero can confuse built surfaces with bare soil or dry land. The proxy should be validated against a suitable building-footprint or land-cover reference.
9. **No persistent export:** the final grid collection is not automatically exported in this script.

These limitations are part of the current implementation record, not evidence that the project has no research value. They identify the areas that need further testing, correction and validation.
