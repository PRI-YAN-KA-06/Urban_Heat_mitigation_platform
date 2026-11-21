# HEATLAS: Geospatial Urban Heat Analysis for Jaipur

**Satellite-driven urban heat intelligence and mitigation suitability analysis**  
Pilot study: Jaipur District, Rajasthan, India  
Primary implementation: Google Earth Engine (JavaScript)

HEATLAS is a team research and engineering project exploring how satellite-derived environmental indicators and meteorological data can be combined to examine urban heat patterns at a 1 km grid scale. The current public repository focuses on the Google Earth Engine (GEE) analysis implemented for the Jaipur pilot.

> **Scope note:** This repository documents the GEE analysis prototype. It is not a completed or deployed urban-planning platform. The map layers and composite indices are exploratory analytical outputs and should not be treated as validated operational recommendations.

## Research questions

The project is organised around four questions:

1. **Where is heat concentrated?** Examine daytime and nighttime land surface temperature (LST) and spatial heat patterns.
2. **What environmental characteristics co-occur with heat?** Explore vegetation, built-up proxies, surface water, albedo, terrain, moisture and atmospheric indicators.
3. **Where may people be exposed?** Combine heat-related indicators with gridded population information to create an exposure-oriented view.
4. **Where might cooling interventions be worth investigating?** Produce rule-based suitability masks for selected intervention types.

## Study framework

| Item | Current implementation |
|---|---|
| Pilot region | Jaipur District, Rajasthan, India |
| Administrative boundary | FAO GAUL 2015, level 2; filtered to Jaipur |
| Spatial framework | Approximately 1 km grid, generated in EPSG:3857 |
| Main processing environment | Google Earth Engine Code Editor |
| Main implementation | `GEE/Jaipur_Heat_v3.js` |
| Current outputs | Map layers, printed feature information and a grid-level feature collection in the GEE session |

## Repository structure

```text
HEATLAS-Urban-Heat-Analysis/
├── README.md
├── .gitignore
├── GEE/
│   ├── Jaipur_Heat_v3.js
│   └── README.md
├── docs/
│   ├── data_sources.md
│   ├── methodology.md
│   ├── layer_catalogue.md
│   ├── implementation_status.md
│   └── individual_contribution.md
└── assets/
    ├── gee-layer-gallery/
    │   └── README.md
    └── workflow/
        └── README.md
```

## Main analytical workflow

1. Select the Jaipur district boundary.
2. Generate a 1 km grid and attach grid-level metadata.
3. Retrieve and process satellite, land-cover, population and meteorological datasets.
4. Derive spectral and environmental indicators such as NDVI, NDBI and NDWI.
5. Calculate heat-storage, cooling-capacity, day/night heat-risk, exposure, vulnerability and resilience indices.
6. Generate four rule-based intervention-suitability masks.
7. Display the thematic layers and inspect the grid-level feature collection in the GEE Code Editor.

See [`docs/methodology.md`](docs/methodology.md) and [`docs/layer_catalogue.md`](docs/layer_catalogue.md) for details.

## Data sources

The current script references MODIS LST, Sentinel-2 surface reflectance, ERA5-Land, Sentinel-5P aerosol data, SRTM elevation, ESA WorldCover and WorldPop. The exact Earth Engine collection identifiers and their roles are listed in [`docs/data_sources.md`](docs/data_sources.md).

## How to run the GEE script

1. Sign in to an account with access to the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Open `GEE/Jaipur_Heat_v3.js` from this repository.
3. Copy its contents into a new script in the Code Editor.
4. Click **Run** and check the Console and map layers.
5. Use the Layers panel to switch individual thematic layers on and off.

The script is written for the GEE Code Editor and uses the Earth Engine JavaScript API. It is not a standalone Node.js script. The current version prints and displays its results in the Code Editor; it does **not** contain a CSV, GeoJSON, raster or Drive export task.

## Current implementation status

- **Implemented in the shared GEE script:** Jaipur boundary selection, 1 km grid generation, ingestion and processing of the listed datasets, derived indicators, composite indices, four suitability masks, map visualisation and grid-level aggregation.
- **Requires further scientific and technical review:** index-weight normalisation, population aggregation, temporal consistency, albedo formulation, empty-collection handling and validation against independent observations.
- **Not implemented in this repository release:** a connected production API, completed frontend/dashboard, trained machine-learning model, intervention simulator, AI assistant, automated refresh pipeline or deployed public service.

The current known limitations are documented in [`docs/implementation_status.md`](docs/implementation_status.md). Planned features must not be described as completed functionality.

## Team and contribution

HEATLAS originated as a team project associated with Bharatiya Antariksh Hackathon 2026. Team-level attribution and individual responsibilities should be confirmed with the team before this repository is made public. The contribution record is intentionally kept separate in [`docs/individual_contribution.md`](docs/individual_contribution.md) so that it can describe each person's work accurately.

## Research use and interpretation

The indices in this prototype are constructed from selected datasets, normalisation ranges and weighted or threshold-based rules. They are useful for documenting an exploratory geospatial workflow, but they do not by themselves establish causal effects or prove that a proposed intervention will reduce local air or surface temperature. Ground validation, sensitivity analysis, spatial cross-validation where relevant, and independent review are needed before operational use.

## Suggested citation

If you refer to this repository in a report or application, cite it as a team project and include the repository URL and the date/version you accessed. A formal citation file can be added after the team confirms authorship and licensing.
