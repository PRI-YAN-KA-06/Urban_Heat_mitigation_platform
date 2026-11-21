# Google Earth Engine implementation

## Main script

- `Jaipur_Heat_v3.js` — the 2,073-line GEE Code Editor script supplied for this repository setup.

The JavaScript file has been preserved as supplied in the project archive. This repository setup does not silently rewrite the analytical logic. Documentation is provided separately so that the source implementation remains traceable.

## Running it

Open the file in the GEE Code Editor, run it, and use the Layers panel to inspect the named layers. The script prints information about the Jaipur boundary, selected collections and grid-level dataset to the Console.

## Important scope notes

- The code is intended for the GEE Code Editor, not direct execution with Node.js.
- The script currently visualises and prints results in the Code Editor.
- There is no active export task in this version.
- The 16-day window used for several inputs and the 40-day MODIS LST window are not a single harmonised observation period. The ET section uses a fixed 2025 date range.
- Consult `../docs/implementation_status.md` before interpreting the outputs as validated results.
