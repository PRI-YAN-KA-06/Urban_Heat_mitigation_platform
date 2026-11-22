# Geospatial Urban Heat Analysis and Mitigation Planning

**Project Named:** HEATLAS  
**Pilot study:** Jaipur District, Rajasthan, India  
**Primary implementation:** Google Earth Engine (JavaScript)  
**Project context:** Bharatiya Antariksh Hackathon (BAH) 2026 · Team Cosmic Foundry · Rajasthan Technical University, Kota

HEATLAS is a research-led project developed to investigate how urban heat varies across locations, what environmental and surface characteristics may be associated with that variation, and how mitigation planning can be better matched to local conditions. The current technical implementation is a Google Earth Engine (GEE) analysis for Jaipur District, using a nominal 1 km grid to examine spatial differences.

> **Project status:** The Jaipur GEE analysis is the most developed technical component. The wider multi-scale decision-support platform, interactive interface, automated reporting and AI/ML capabilities remain proposed or under development. The analytical indices and suitability masks are exploratory and require further technical review and independent validation before operational use.

## Research motivation and design rationale

I led the research framing and conceptual design of HEATLAS. The work began with a broad investigation: **How is urban heat increasing and distributed? What do scientific and technical reports and conference research identify about its patterns and drivers? What measures are already being used or planned, and where could urban heat mitigation be made more targeted?** Reviewing this material shaped the project from a general heat-mapping concept into a location-specific analysis and planning framework.

A central insight behind the design was that **different places can experience heat for different reasons**. A map that only highlights hot areas does not necessarily explain which local conditions should guide an intervention. The project therefore brings together multiple environmental and surface indicators so that heat patterns can be examined alongside factors such as vegetation, built-up characteristics, surface reflectance, moisture and thermal conditions. The intention is to help planning authorities consider interventions that correspond to the local conditions, rather than defaulting to one measure—such as afforestation—everywhere. This can support more reasoned prioritisation and more efficient use of limited public funds. The current suitability masks are rule-based screening outputs, not validated estimates of intervention effectiveness.

Several design decisions followed from this research direction:

- **Day and night heat analysis:** Separate daytime and nighttime views were included because some locations may retain heat after sunset. A place that does not stand out in a daytime assessment may still experience elevated nighttime temperatures and warrant earlier attention. Nighttime analysis was intended to help reveal these persistent heat patterns alongside daytime conditions.
- **A 1 km district grid for local comparison:** The grid was introduced to examine smaller areas individually and compare neighbouring locations. This makes it easier to investigate why one cell appears hotter or behaves differently from surrounding cells, instead of relying only on a continuous physical heat map that identifies hotspots without the same cell-by-cell diagnostic structure. The grid is a common reporting framework; it does not change the native resolution of the input datasets.
- **Area-specific analysis for planning and budgets:** The proposed interface included region selection through administrative boundaries, coordinates and user-defined polygons. This was intended to let authorities analyse a specific project area or budget-defined region, rather than being limited to a preselected district-wide view. Polygon and coordinate-based interface selection are proposed features and are not implemented in the current repository.
- **Multi-scale navigation:** The planned interface was organised from national-level and state-level overviews to district-level analysis, followed by grid-level examination within a selected district. The national and state views were intended as broad physical-map overviews; the finer 1 km grid was intended for district-level investigation and comparison.
- **Detailed analytical reporting:** The proposed reporting component was intended to bring together the selected area's layers, indicators, heat analysis and mitigation-suitability results so that planning decisions could be reviewed with supporting detail. Automated report generation is not implemented in the current codebase.

The individual layers were selected and organised after reviewing research on urban heat and related environmental factors. Their purpose is diagnostic: they allow a user to inspect different conditions that may be associated with local heat patterns, rather than treating temperature as the only information needed for mitigation planning.

## Current technical implementation

The main GEE script, [`GEE/Jaipur_Heat_v3.js`](GEE/Jaipur_Heat_v3.js), currently includes:

- Jaipur District boundary selection using FAO GAUL Level 2 and creation of a nominal 1 km grid in EPSG:3857.
- Processing of MODIS day/night land surface temperature (LST), Sentinel-2 surface reflectance, ERA5-Land, Sentinel-5P aerosol data, SRTM terrain, ESA WorldCover, MODIS evapotranspiration and WorldPop population data.
- Derived surface and environmental indicators, including NDVI, NDBI, NDWI, albedo, fractional vegetation cover, a built-density proxy, aerosol, terrain, evapotranspiration and soil-moisture variables.
- Composite Heat Storage, Cooling Capacity, Day Heat Risk, Night Heat Risk, Exposure, Vulnerability and Resilience indices.
- Four rule-based mitigation-suitability masks: cool roofs, urban forest, water-sensitive cooling and reflective surfaces.
- Map visualisation and grid-level aggregation within the GEE Code Editor.

Input datasets have different native spatial resolutions and temporal windows. The 1 km grid is used as a common spatial reporting framework; it should not be interpreted as making every input equally detailed at 1 km resolution.

## Proposed planning interface

The wider HEATLAS concept was designed around an authority-facing, hierarchical interface:

1. **National overview** to identify broad spatial patterns.
2. **State-level overview** to examine patterns within a selected state.
3. **District-level analysis** to open a more detailed physical map and 1 km grid.
4. **Local diagnostic view** to compare grid cells or examine a selected coordinate or polygon.
5. **Detailed report** to consolidate the selected area's indicators, heat analysis and mitigation-suitability information.

This structure was conceived to support progression from the Jaipur pilot to additional districts, state-level analysis and, eventually, national coverage. Only the Jaipur district GEE analysis is represented by the current main implementation; the wider geographic interface and reporting functions are future development directions.

For the submitted process-flow and proposed architecture diagrams, see [Workflow and system architecture](assets/workflow-diagrams/README.md). For selected screenshots of the actual GEE layers, see the [GEE Layer Gallery](assets/gee-layer-gallery/README.md).

## Research documentation

| Document | Description |
|---|---|
| [Methodology](docs/methodology.md) | Study framework, preprocessing, derived indicators, index formulations and interpretation limits. |
| [Data sources](docs/data_sources.md) | Earth Engine collection IDs, variables used, temporal filters and dataset references. |
| [Layer catalogue](docs/layer_catalogue.md) | Map layers and variables generated by the current GEE script, including their role in the grid-level output. |
| [Implementation status](docs/implementation_status.md) | Implemented components, incomplete integration, limitations and priority technical work. |
| [Individual contribution](docs/individual_contribution.md) | Research framing, conceptual design, technical involvement and project-lead contribution. |
| [GEE implementation notes](GEE/README.md) | How to explore the GEE script, its datasets, outputs and processing sequence. |

## Run the GEE analysis

1. Sign in to an account with access to the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Open [`GEE/Jaipur_Heat_v3.js`](GEE/Jaipur_Heat_v3.js) from this repository.
3. Copy the script into a new or existing script in the Code Editor.
4. Run the script and inspect the Console, map and Layers panel.
5. Enable individual layers as needed to explore the study area, indicators, composite indices and suitability masks.

The script uses the Earth Engine JavaScript API and is intended to run in the Code Editor; it is not a standalone Node.js program. In this version, the grid-level result is printed and displayed in the GEE session. The script does not currently include a CSV, GeoJSON, raster or Google Drive export task.

## Current implementation boundaries

**Implemented in the GEE script:** the Jaipur study boundary and grid, multi-source input processing, derived environmental indicators, composite indices, four rule-based suitability masks, map visualisation and grid-level aggregation.

**Requires further technical or scientific review:** risk-weight normalisation, population aggregation, categorical-band aggregation, the albedo formulation, empty-collection safeguards, temporal consistency and validation against independent observations. Nighttime LST is calculated and displayed but is not included as a separate band in the final grid-level stack in this script version.

**Not implemented as an end-to-end system:** a connected production API, complete interactive frontend/dashboard, polygon or coordinate-based area selection, trained machine-learning model, intervention-impact simulator, Gemini-based assistant, automated multi-source refresh scheduler, automated report generation and public deployment. A separate Node.js/Express prototype exists in the broader project archive, but it is not connected to the main GEE v3 analysis and is not included in this repository's current technical scope.

The detailed status and priority corrections are documented in [`docs/implementation_status.md`](docs/implementation_status.md). Proposed architecture components and national/state-level expansion should be interpreted as future development directions.

## Team and individual contribution

HEATLAS was developed by **Cosmic Foundry** at **Rajasthan Technical University, Kota**, for the **Bharatiya Antariksh Hackathon (BAH) 2026**. The team comprised **Priyanka Banoda (Team Leader), Krishan Kumar Kasana, Kritika Choudhary and Devanshu Gupta**.

As team leader, I led the research framing, review of reports and research material, problem formulation, conceptual feature planning, analytical-layer rationale, multi-scale interface design and proposed system architecture. I also worked on the Jaipur GEE analysis and its analytical framework. The individual contribution document gives a concise account of this role while distinguishing the proposed platform from the components implemented in code.

## Interpretation and research limitations

The indices in this prototype are constructed from selected datasets, normalisation ranges, weighted combinations and threshold-based rules. They provide an exploratory framework for comparing spatial patterns; they do not establish causal effects or demonstrate that a particular intervention will reduce local surface or air temperature. The mitigation layers identify locations satisfying coded screening conditions and do not quantify cooling benefit, cost, feasibility or implementation readiness.

Further work should include sensitivity analysis, correction of aggregation and formulation issues, explicit observation-date tracking, independent or ground-based validation, and careful testing before the outputs are used for operational decisions.

```
