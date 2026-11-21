# Methodology overview

This note describes the analytical sequence currently present in `GEE/Jaipur_Heat_v3.js`. It documents the implementation rather than asserting that the indices have been independently validated.

## 1. Study area and spatial grid

The script loads `FAO/GAUL/2015/level2` and filters the administrative feature collection to `ADM2_NAME = Jaipur`. It then generates a covering grid using an EPSG:3857 projection and a nominal 1,000 m cell size. Grid features receive metadata such as a grid identifier, administrative labels, area, centroid coordinates, update date and a quality flag.

The report supplied with the project describes the resulting grid as approximately 14,739 cells. The actual number printed by a particular run should be recorded from the GEE Console rather than treated as a fixed constant.

## 2. Input processing and derived variables

The script processes the collections listed in [`data_sources.md`](data_sources.md). Sentinel-2 surface reflectance is cloud-filtered and masked before deriving spectral indicators. The current code derives:

- **NDVI** — vegetation greenness indicator.
- **NDBI** — built-up spectral proxy.
- **NDWI** — surface-water/moisture-related spectral indicator.
- **Albedo** — surface reflectance-derived estimate.
- **FVC** — fractional vegetation cover estimate.
- **Built density** — a neighbourhood measure based on NDBI greater than zero within a 500 m radius; this is a proxy and not a building-footprint dataset.

Additional environmental inputs include air and dew-point temperature, relative humidity, wind, precipitation, solar radiation, evaporation, soil temperature, aerosol index, elevation, slope, aspect, land cover, population, evapotranspiration, leaf area index and soil moisture.

## 3. Composite indices

### Heat Storage Index

The script forms a weighted combination of normalised daytime LST (0.30), nighttime LST (0.30), built density (0.15), NDBI (0.10), albedo deficit (0.10) and vegetation deficit (0.05). The weights sum to 1.00.

### Cooling Capacity Index

The current script combines normalised NDVI (0.25), evapotranspiration (0.20), soil moisture (0.20), NDWI (0.15), FVC (0.10) and LAI (0.10). The weights sum to 1.00. This is a constructed index, not a directly measured cooling rate.

### Day Heat Risk

The script adds three components: Day Heat Drivers (component weights sum to 0.65), Cooling Deficit (0.30) and Environmental Stress (0.13). The combined component weights therefore sum to **1.08**, not 1.00. The result is then clamped to the 0–1 range. This should be addressed and sensitivity-tested before interpreting the score quantitatively.

### Night Heat Risk

The script combines normalised nighttime LST (0.40), heat storage (0.20), built density (0.15), NDBI (0.10) and cooling deficit (0.15). These weights sum to 1.00.

### Exposure, vulnerability and resilience

- Exposure is derived from the population-related input and the script's exposure logic.
- Vulnerability combines day heat risk (0.50), night heat risk (0.25) and exposure (0.25).
- Resilience combines normalised NDVI (0.25), ET (0.20), soil moisture (0.20), NDWI (0.15), FVC (0.10) and LAI (0.10).
- The script also produces categorical classes for selected indices.

These weighted indices are modelling choices. Their interpretation depends on the selected normalisation ranges, input quality, spatial scale and weights.

## 4. Intervention-suitability masks

Four rule-based masks are produced in the current script:

| Mask | Current rule in the script |
|---|---|
| Cool Roof Zones | Day Heat Risk greater than 0.70, NDBI greater than 0, and NDVI below 0.30. |
| Urban Forest Zones | Day Heat Risk greater than 0.60, NDVI below 0.30, and FVC below 0.40. |
| Water Cooling Zones | Day Heat Risk greater than 0.60, NDWI below 0, and soil moisture below 0.20. |
| Reflective Surface Zones | Day Heat Risk greater than 0.65, albedo below 0.20, and NDBI greater than 0. |

These are preliminary screening rules. They do not estimate intervention impact, feasibility, cost, land availability or actual temperature reduction.

## 5. Grid-level aggregation and displayed output

The script stacks selected bands and applies `ee.Reducer.mean()` through `reduceRegions()` at a nominal scale of 1,000 m. It prints sample features and the collection size, then styles the grid for display. The currently stacked bands include day LST and Night Heat Risk, but do not include the raw nighttime LST band as a separate field. Since the same mean reducer is applied to the population band, the resulting population field is a mean pixel value rather than a sum of people per grid cell.

The current script has no `Export.table.toDrive`, `Export.table.toAsset` or raster export task. The final feature collection is therefore shown in the active GEE session, not automatically saved as a persistent CSV or GeoJSON.
