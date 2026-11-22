# Methodology: Jaipur Urban Heat Analysis

This document describes the analytical methods currently implemented in [`GEE/Jaipur_Heat_v3.js`](../GEE/Jaipur_Heat_v3.js). It is an implementation record, not a claim that the indices have been independently validated or that the proposed decision-support platform is complete.

## 1. Study area and spatial framework

The pilot study area is Jaipur District, Rajasthan, India. The script retrieves the administrative boundary from `FAO/GAUL/2015/level2` and filters it using `ADM2_NAME = Jaipur`.

A nominal 1,000 m grid is generated over the district geometry using `coveringGrid()` with the `EPSG:3857` projection. Each grid feature is assigned a grid identifier, country, state and district labels, area in square kilometres, centroid coordinates, run-date metadata and a quality-status field. The project status report records approximately 14,739 cells; the count printed by the current GEE run should be treated as the authoritative count for that run.

The grid provides a common reporting framework for summarising multiple spatial datasets. It does not change the native resolution or accuracy of the source datasets.

## 2. Input datasets and temporal handling

The script combines satellite, meteorological, terrain, land-cover and population inputs. Collection identifiers and their roles are documented separately in [`data_sources.md`](data_sources.md).

The time handling in the current script is not fully synchronised:

- A rolling 16-day interval is defined from the script run date and is used for Sentinel-2, ERA5-Land and Sentinel-5P.
- MODIS MOD11A2 daytime and nighttime LST are composited over the preceding 40 days using the collection mean. The MODIS scale factor of 0.02 is applied, followed by conversion from Kelvin to Celsius.
- Sentinel-2 SR Harmonized imagery is filtered to scenes with `CLOUDY_PIXEL_PERCENTAGE < 20`. The script masks scene-classification values 3, 8, 9 and 10, creates a median composite and clips it to Jaipur.
- ERA5-Land hourly inputs are filtered to the rolling 16-day interval. The script uses means for several variables and sums for selected accumulated variables.
- Sentinel-5P aerosol index is averaged over the rolling 16-day interval.
- MODIS MOD16A2 ET is averaged over the fixed interval 1 January–31 December 2025. A separate collection count is also calculated for that interval.
- WorldPop population is selected for calendar year 2020.
- SRTM elevation and ESA WorldCover are used as static/contextual layers in this workflow.

Because these inputs use different observation periods and update characteristics, the outputs should not be described as a single-date or perfectly synchronised observation. Observation dates should be recorded alongside any exported or reported results in a future reproducible release.

## 3. Preprocessing and derived indicators

### 3.1 Thermal variables

The MODIS `LST_Day_1km` and `LST_Night_1km` bands are composited separately. Their scaled values are converted from Kelvin to degrees Celsius and clipped to the Jaipur boundary. The script displays both day and night LST layers.

A separate grid-level daytime LST calculation applies `ee.Reducer.mean()` to the 1 km grid. The initial heat-zone classes are assigned from the resulting mean daytime LST: above 45 °C is `Extreme`, above 40 °C is `High`, above 35 °C is `Moderate`, and the remaining values are `Low`.

### 3.2 Sentinel-2 spectral indicators

The Sentinel-2 median surface-reflectance composite is used to calculate:

- **NDVI:** normalized difference of NIR (`B8`) and red (`B4`), used as a vegetation-greenness indicator.
- **NDBI:** normalized difference of SWIR (`B11`) and NIR (`B8`), used as a built-up spectral proxy.
- **NDWI:** normalized difference of green (`B3`) and NIR (`B8`), used as a surface-water/moisture-related spectral indicator.
- **Albedo:** an estimate calculated from a weighted expression using Sentinel-2 blue, red, NIR and green bands. The exact formula should be verified against an appropriate reference before the values are used quantitatively.
- **Fractional Vegetation Cover (FVC):** estimated by transforming NDVI using `(NDVI - 0.2) / 0.6` and clamping the result to the 0–1 range.

### 3.3 Additional environmental and contextual variables

The script derives or adds the following variables:

- Air temperature and dew-point temperature from ERA5-Land, converted to degrees Celsius.
- Relative humidity estimated from air and dew-point temperature using the saturation-vapour-pressure relationship coded in the script.
- Wind speed calculated from the 10 m u- and v-wind components.
- Surface pressure, precipitation, solar radiation, evaporation and soil temperature from ERA5-Land.
- Absorbing aerosol index from Sentinel-5P.
- Elevation, slope and aspect from SRTM.
- Land-cover class from ESA WorldCover.
- Population from the 2020 WorldPop layer.
- Evapotranspiration from MODIS MOD16A2.
- Leaf Area Index (LAI) calculated in this script by adding the ERA5-Land high- and low-vegetation LAI bands.
- Soil moisture from the ERA5-Land first volumetric soil-water layer.

A **built-density proxy** is generated by thresholding NDBI at greater than zero and applying a 500 m focal mean. It represents the local proportion of threshold-positive pixels, not a mapped building footprint or a verified built-up fraction. This distinction is important in a semi-arid landscape, where bare soil can also produce elevated NDBI values.

A **population-exposure input** is produced by normalising WorldPop values over a 0–500 range. The resulting exposure classes use four intervals: below 0.25, 0.25–0.50, 0.50–0.75 and 0.75 or above. In the final grid aggregation, however, the population band is currently processed with a mean reducer; it therefore does not represent the total number of people in a grid cell.

## 4. Composite analytical indices

The script normalises selected inputs using fixed minimum and maximum ranges and clamps the results to 0–1. These ranges and weights are modelling choices encoded in the current script; they should be sensitivity-tested and independently justified before quantitative comparison or operational use.

### 4.1 Heat Storage Index

The Heat Storage Index is calculated as a weighted combination of:

| Component | Weight |
|---|---:|
| Normalised daytime LST | 0.30 |
| Normalised nighttime LST | 0.30 |
| Built-density proxy | 0.15 |
| Normalised NDBI | 0.10 |
| Albedo deficit | 0.10 |
| Vegetation deficit | 0.05 |
| **Total** | **1.00** |

The albedo and vegetation deficit terms are formed by inverting their normalised values. The resulting index is clamped to 0–1.

### 4.2 Cooling Capacity Index

The Cooling Capacity Index combines the following normalised variables:

| Component | Weight |
|---|---:|
| NDVI | 0.25 |
| Evapotranspiration | 0.20 |
| Soil moisture | 0.20 |
| NDWI | 0.15 |
| FVC | 0.10 |
| LAI | 0.10 |
| **Total** | **1.00** |

This is a constructed indicator of environmental characteristics associated with cooling potential. It is not a direct measurement of cooling rate or temperature reduction.

### 4.3 Day Heat Risk

The Day Heat Risk score adds three components:

- **Day Heat Drivers (0.65 total):** daytime LST 0.25, built density 0.10, NDBI 0.10, Heat Storage 0.10, aerosol index 0.05 and soil temperature 0.05.
- **Cooling Deficit (0.30 total):** inverted NDVI 0.08, inverted NDWI 0.03, inverted ET 0.08, inverted soil moisture 0.05, inverted FVC 0.03 and inverted LAI 0.03.
- **Environmental Stress (0.13 total):** inverted relative humidity 0.03, solar radiation 0.04, precipitation 0.03 and inverted wind speed 0.03.

The component weights add to **1.08**, rather than 1.00. The script clamps the resulting score to the 0–1 range. This can cause high values to saturate at 1 and should be corrected and sensitivity-tested before interpreting score differences quantitatively.

### 4.4 Night Heat Risk

The Night Heat Risk score combines:

| Component | Weight |
|---|---:|
| Normalised nighttime LST | 0.40 |
| Normalised Heat Storage | 0.20 |
| Built-density proxy | 0.15 |
| Normalised NDBI | 0.10 |
| Cooling Deficit | 0.15 |
| **Total** | **1.00** |

The implementation currently normalises Heat Storage with a 0–80 range in the night-risk section even though the Heat Storage Index itself is clamped to 0–1. This range should be reviewed because it may substantially reduce the Heat Storage contribution in the Night Heat Risk calculation.

### 4.5 Exposure, vulnerability and resilience

- **Exposure** is the normalised WorldPop population input described above.
- **Vulnerability** is calculated as 0.50 × Day Heat Risk + 0.25 × Night Heat Risk + 0.25 × Exposure.
- **Resilience** is calculated using NDVI (0.25), ET (0.20), soil moisture (0.20), NDWI (0.15), FVC (0.10) and LAI (0.10).

The current Resilience formula uses the same input variables and weights as the Cooling Capacity Index. Therefore, these two outputs are not independent indicators in this version of the script. The conceptual distinction between them needs to be clarified if both are retained in a future model.

The script classifies Heat, Exposure, Vulnerability and Resilience into four ordinal categories using thresholds of 0.25, 0.50 and 0.75. These classes are rule-based categories, not validated clinical, regulatory or operational thresholds.

## 5. Mitigation-suitability screening

Four binary suitability masks are generated using thresholds in the current GEE script:

| Suitability mask | Implemented rule |
|---|---|
| Cool Roof Zones | Day Heat Risk > 0.70, NDBI > 0 and NDVI < 0.30 |
| Urban Forest Zones | Day Heat Risk > 0.60, NDVI < 0.30 and FVC < 0.40 |
| Water Cooling Zones | Day Heat Risk > 0.60, NDWI < 0 and soil moisture < 0.20 |
| Reflective Surface Zones | Day Heat Risk > 0.65, albedo < 0.20 and NDBI > 0 |

These masks identify grid areas that meet the selected screening rules. They do not estimate the cooling impact of an intervention and do not account for cost, land ownership, water availability, construction feasibility, maintenance or the share of each grid cell that could practically be treated. They should be interpreted as preliminary suitability screens, not site-specific recommendations.

## 6. Grid-level aggregation and GEE outputs

The script stacks selected thermal, spectral, environmental, contextual and derived bands into a multi-band image. It applies `ee.Reducer.mean()` using `reduceRegions()` over the grid at a nominal scale of 1,000 m and `tileScale: 4`. It prints the first feature, a sample of features and the collection size, and displays the resulting grid feature collection in the GEE map.

The current stack includes daytime LST and Night Heat Risk, but does not add the raw nighttime LST band as a separate output field. The same mean reducer is applied to the population band, so the resulting grid attribute is a mean population-pixel value rather than a grid-cell population total. Different aggregation rules may be appropriate for different variables (for example, sum for population counts, mean for continuous variables and mode for categorical land cover).

The script does not currently include a `Export.table.toDrive()`, `Export.table.toAsset()` or raster export task. The final collection is available in the active Earth Engine session but is not automatically saved as a persistent CSV, GeoJSON or raster product by this script.

## 7. Interpretation, limitations and next validation steps

The outputs are exploratory spatial indicators built from multiple datasets with different native resolutions, temporal windows and measurement characteristics. Aggregation to a common 1 km grid provides a shared reporting unit, but it does not make the source data natively 1 km or remove their uncertainty.

Before using the results for operational planning or drawing strong conclusions, the workflow needs at least the following work:

1. Review and normalise the Day Heat Risk weights, and inspect the Heat Storage normalisation used in Night Heat Risk.
2. Separate the grid aggregation logic by variable type, including summing population counts where a total is required.
3. Verify the albedo formulation against an appropriate published method.
4. Add safeguards for empty or insufficient image collections.
5. Record observation dates and document the non-matching temporal windows.
6. Validate proxy indicators, including NDBI-based built density, against suitable independent reference data.
7. Test index sensitivity to normalisation ranges and weights, and compare thermal patterns with independent observations where available.
8. Add and verify an explicit export workflow before treating the grid output as a reproducible external dataset.

The current implementation is a GEE-based Jaipur pilot. A connected backend, public frontend, trained machine-learning model, intervention-impact simulator, AI assistant, automated refresh service and national-scale operational platform are future development items, not completed components of this methodology.
