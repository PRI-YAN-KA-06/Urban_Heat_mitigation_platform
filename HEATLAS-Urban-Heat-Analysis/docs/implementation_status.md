# Implementation status and limitations

This page separates existing implementation from planned or incomplete elements. It is based on the supplied GEE source script and the accompanying project status report.

## Present in the shared GEE script

- Jaipur district boundary selection from GAUL level 2.
- Nominal 1 km grid generation in EPSG:3857 and grid metadata.
- Multi-source satellite, land-cover, population and meteorological data processing.
- Daytime and nighttime MODIS LST map layers.
- Derived spectral and environmental indicators.
- Heat storage, cooling capacity, day/night heat risk, exposure, vulnerability and resilience calculations.
- Four rule-based intervention-suitability masks.
- Grid-level feature aggregation and map visualisation in the Code Editor.

## Important issues to address before quantitative or operational claims

1. **Day-risk weights:** Day Heat Drivers (0.65), Cooling Deficit (0.30) and Environmental Stress (0.13) total 1.08. The score is clamped to 0–1, which can cause saturation and reduce differentiation among high-scoring cells.
2. **Night LST in the final grid table:** nighttime LST is displayed on the map and used by Night Heat Risk, but the raw nighttime LST band is not separately added to the final stacked table.
3. **Population aggregation:** the final grid operation uses a mean reducer for the full stack. Population should be considered separately and generally aggregated with a sum if the intended field is people per grid cell.
4. **Albedo formulation:** the current Sentinel-2 band formula requires verification against an appropriate published method before the resulting albedo values are used quantitatively.
5. **Temporal consistency:** the collections do not all use the same observation window. MODIS LST uses a 40-day window, several other collections use a rolling 16-day window, ET uses a fixed 2025 interval, and WorldPop is a 2020 population layer.
6. **Empty collection handling:** safeguards and fallback logic are needed for dates when one or more collections contain no usable images.
7. **Mixed source resolution:** layers with different native resolutions are aggregated to the 1 km grid. A 1 km output cell does not mean every input has 1 km native detail.
8. **Built-density proxy:** the NDBI-based built-density measure may confuse bare soil and built surfaces, particularly in semi-arid settings. It should be validated against a suitable building or land-cover reference.
9. **Export and reproducibility:** the current script does not export its final feature collection to Drive or an Earth Engine asset.

## Not implemented in this repository release

- Connected production backend/API serving the v3 GEE outputs.
- Completed map-based web frontend or dashboard.
- Trained Random Forest or other ML heat model.
- Validated intervention-impact simulator.
- SHAP or other model-explanation pipeline.
- Gemini-based assistant.
- Automated data-refresh scheduler or public deployment.

These may be future development directions, but must not be presented as working features until implemented and tested.
