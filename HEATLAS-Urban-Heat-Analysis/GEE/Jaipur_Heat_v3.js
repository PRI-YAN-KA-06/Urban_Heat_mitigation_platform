// ================= REGION =================

// Load GAUL if not already loaded
var gaul = ee.FeatureCollection("FAO/GAUL/2015/level2");

var jaipur = gaul.filter(
  ee.Filter.eq('ADM2_NAME', 'Jaipur')
);

Map.centerObject(jaipur, 9);

Map.addLayer(
  jaipur,
  {color:'red'},
  'Jaipur Boundary'
);

print(jaipur);


// ================= TIME WINDOW =================

var endDate = ee.Date(Date.now());

var startDate = endDate.advance(-16,'day');


// ================= ET COUNT =================

var etCount = ee.ImageCollection("MODIS/061/MOD16A2")
.filterBounds(jaipur)
.filterDate('2025-01-01','2025-12-31')
.size();

print("ET count", etCount);


// ================= MODIS DAY & NIGHT LST =================

// MODIS 8-Day LST Collection
var modis = ee.ImageCollection("MODIS/061/MOD11A2")
  .filterBounds(jaipur)
 .filterDate(endDate.advance(-40,'day'), endDate)
  
  print("MODIS Count", modis.size());

// Day LST
var dayLST = modis
  .select('LST_Day_1km')
  .mean()
  .multiply(0.02)
  .subtract(273.15)
  .rename('DayLST')
  .clip(jaipur);

// Night LST
var nightLST = modis
  .select('LST_Night_1km')
  .mean()
  .multiply(0.02)
  .subtract(273.15)
  .rename('NightLST')
  .clip(jaipur);

// Use Day LST temporarily wherever "lst" is referenced
var lst = dayLST;

// Display
Map.addLayer(

  dayLST,
  {
    min: 28,
    max: 48,
    palette: [
      '0000ff',
      '00ffff',
      '00ff00',
      'ffff00',
      'ff9900',
      'ff0000'
    ]
  },
  'MODIS Day LST'
);

Map.addLayer(
nightLST,
{
min:15,
max:40,
palette:[
'purple',
'blue',
'cyan',
'green',
'yellow'
]
},
'MODIS Night LST'
);


// ================= GRID =================

// Create 1 km Grid

var gridFC = ee.FeatureCollection(
jaipur.geometry().coveringGrid(
ee.Projection('EPSG:3857'),
1000
));

// Add Grid Metadata

gridFC = gridFC.map(function(feature){

var centroid = feature.geometry().centroid(1);

return feature.set({

GRID_ID: feature.id(),

COUNTRY: 'India',

STATE: 'Rajasthan',

DISTRICT: 'Jaipur',

AREA_SQKM:
feature.geometry().area(1).divide(1e6),

CENTROID_LAT:
centroid.coordinates().get(1),

CENTROID_LON:
centroid.coordinates().get(0),

LAST_UPDATE:
endDate.format('YYYY-MM-dd'),

QUALITY_STATUS:
'VALID'

});

});


Map.addLayer(

gridFC.style({

color:'black',

fillColor:'00000000',

width:1

}),

{},

'Grid'

);


// ================= LST GRID =================


var lstGrid = dayLST.reduceRegions({

  collection: gridFC,

  reducer: ee.Reducer.mean(),

  scale: 1000

})
.filter(
  ee.Filter.notNull(['mean'])
);


// ================= HEAT ZONES =================

var heatZones = lstGrid.map(function(f){

var temp = ee.Number(f.get('mean'));

var cls =

ee.Algorithms.If(

temp.gt(45),

'Extreme',

ee.Algorithms.If(

temp.gt(40),

'High',

ee.Algorithms.If(

temp.gt(35),

'Moderate',

'Low'

)

)

);

return f.set({

temperature:temp,

heat_class:cls

});

});


heatZones = heatZones.filter(

ee.Filter.notNull(['temperature'])

);


// ================= SENTINEL 2 =================

var sentinel =

ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")

.filterBounds(jaipur)

.filterDate(startDate,endDate)

.filter(

ee.Filter.lt(

'CLOUDY_PIXEL_PERCENTAGE',

20

)

);


// ================= S2 MASK =================

function maskS2(image){

var scl = image.select('SCL');

var mask =

scl.neq(3)

.and(scl.neq(8))

.and(scl.neq(9))

.and(scl.neq(10));

return image.updateMask(mask);

}


var s2 =

sentinel

.map(maskS2)

.median()

.clip(jaipur)

.updateMask(
ee.Image.constant(1).clip(jaipur)
);


// ================= NDVI =================

var ndvi =

s2

.normalizedDifference(['B8','B4'])

.rename('NDVI')

.clip(jaipur);


Map.addLayer(

ndvi,

{

min:0,

max:1,

palette:[

'red',

'yellow',

'green'

]

},

'NDVI'

);


// ================= NDBI =================

var ndbi =

s2

.normalizedDifference(['B11','B8'])

.rename('NDBI')

.clip(jaipur);


Map.addLayer(

ndbi,

{

min:-0.5,

max:0.5,

palette:[

'green',

'yellow',

'red'

]

},

'NDBI'

);


// ================= NDWI =================

var ndwi =

s2

.normalizedDifference(['B3','B8'])

.rename('NDWI')

.clip(jaipur);


Map.addLayer(

ndwi,

{

min:-1,

max:1,

palette:[

'brown',

'yellow',

'blue'

]

},

'NDWI'

);



// ================= WEATHER =================

var era5 = ee.ImageCollection(
"ECMWF/ERA5_LAND/HOURLY"
)
.filterBounds(jaipur)
.filterDate(startDate,endDate);

var era5Mean = era5.mean();


// ================= AIR TEMP =================

var airTemp = era5Mean
.select('temperature_2m')
.subtract(273.15)
.rename('AirTemp')
.clip(jaipur);


// ================= DEW POINT =================

var dewPoint = era5Mean
.select('dewpoint_temperature_2m')
.subtract(273.15)
.rename('DewPoint')
.clip(jaipur);


// ================= WIND =================

var u = era5Mean.select('u_component_of_wind_10m');

var v = era5Mean.select('v_component_of_wind_10m');

var windSpeed = u.pow(2)
.add(v.pow(2))
.sqrt()
.rename('WindSpeed')
.clip(jaipur);


// ================= DEBUG =================

Map.addLayer(
heatZones.style({
color:'blue',
width:1
}),
{},
'Heat Zones'
);


// ================= RELATIVE HUMIDITY =================

var es = airTemp.expression(
'6.112 * exp((17.67*T)/(T+243.5))',
{
T: airTemp
});

var e = dewPoint.expression(
'6.112 * exp((17.67*Td)/(Td+243.5))',
{
Td: dewPoint
});

var relativeHumidity = e
.divide(es)
.multiply(100)
.clamp(0,100)
.rename('RH')
.clip(jaipur);


// ================= SURFACE PRESSURE =================

var surfacePressure = era5Mean
.select('surface_pressure')
.divide(100)
.rename('SurfacePressure')
.clip(jaipur);


// ================= PRECIPITATION =================

var precipitation = era5
.select('total_precipitation')
.sum()
.multiply(1000)
.rename('Precipitation')
.clip(jaipur);


// ================= SOLAR RADIATION =================

var solarRadiation = era5
.select('surface_solar_radiation_downwards')
.mean()
.divide(1000000)
.rename('SolarRadiation')
.clip(jaipur);


// ================= EVAPORATION =================

var evaporation = era5
.select('total_evaporation')
.sum()
.multiply(-1000)
.rename('Evaporation')
.clip(jaipur);


// ================= SOIL TEMPERATURE =================

var soilTemp = era5Mean
.select('soil_temperature_level_1')
.subtract(273.15)
.rename('SoilTemp')
.clip(jaipur);


// ================= AEROSOL =================

var aerosolIndex = ee.ImageCollection(
'COPERNICUS/S5P/OFFL/L3_AER_AI'
)
.filterBounds(jaipur)
.filterDate(startDate,endDate)
.mean()
.select('absorbing_aerosol_index')
.rename('Aerosol')
.clip(jaipur);


Map.addLayer(
aerosolIndex,
{
min:-1,
max:3,
palette:[
'blue',
'yellow',
'red'
]
},
'Aerosol'
);


// ================= ALBEDO =================

var albedo = s2.expression(

'0.356*BLUE + 0.130*RED + 0.373*NIR + 0.085*GREEN + 0.072',

{
BLUE:s2.select('B2'),
GREEN:s2.select('B3'),
RED:s2.select('B4'),
NIR:s2.select('B8')
}

)
.rename('Albedo')
.clip(jaipur);


Map.addLayer(
albedo,
{
min:0,
max:0.6,
palette:[
'black',
'grey',
'white'
]
},
'Albedo'
);


// ================= DEM =================

var baseDEM = ee.Image("USGS/SRTMGL1_003");

var rawSlope = ee.Terrain.slope(baseDEM);

var rawAspect = ee.Terrain.aspect(baseDEM);


var dem = baseDEM
.rename('Elevation')
.clip(jaipur);

var slope = rawSlope
.rename('Slope')
.clip(jaipur);

var aspect = rawAspect
.rename('Aspect')
.clip(jaipur);


Map.addLayer(
dem,
{
min:200,
max:700,
palette:[
'blue',
'green',
'yellow',
'brown'
]
},
'DEM'
);


Map.addLayer(
aspect,
{
min:0,
max:360,
palette:[
'red',
'yellow',
'green',
'cyan',
'blue'
]
},
'Aspect'
);


// ================= BUILT DENSITY =================


// Built-up Pixels
var builtMask = ndbi.gt(0);

// Local Built Density (0–1)
var builtDensity = builtMask
.focal_mean({
radius:500,
units:'meters'
})
.rename('BuiltDensity')
.clip(jaipur);

Map.addLayer(
builtDensity,
{
min:0,
max:1,
palette:[
'white',
'yellow',
'orange',
'red'
]
},
'Built Density'
);


// ================= FVC =================

var FVC = ndvi

.subtract(0.2)

.divide(0.6)

.clamp(0,1)

.rename('FVC')

.clip(jaipur);


Map.addLayer(
FVC,
{
min:0,
max:1,
palette:[
'red',
'yellow',
'green'
]
},
'FVC'
);

// ================= GREEN COVER =================

// Binary Green Cover
var greenCover = ndvi
  .gt(0.30)
  .rename('GreenCover')
  .clip(jaipur);

// District Green Cover Percentage
var greenCoverPercent = greenCover.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: jaipur,
  scale: 10,
  maxPixels: 1e13
});

print(
'Green Cover (%)',
ee.Number(
greenCoverPercent.get('GreenCover')
).multiply(100)
);

// Display
Map.addLayer(
greenCover.selfMask(),
{
palette:['00AA00']
},
'Green Cover'
);




// ================= LAND COVER =================

var landcover = ee.ImageCollection(
"ESA/WorldCover/v200"
)

.first()

.rename('LandCover')

.clip(jaipur);


Map.addLayer(

landcover,

{

min:10,

max:100,

palette:[

'006400',

'ffbb22',

'ffff4c',

'f096ff',

'fa0000',

'b4b4b4',

'f0f0f0'

]

},

'Land Cover'

);

// ================= WORLDPOP POPULATION =================

// Latest WorldPop Population
var population = ee.ImageCollection(
'WorldPop/GP/100m/pop'
)
.filterBounds(jaipur)
.filterDate('2020-01-01','2020-12-31')
.first()
.rename('Population')
.clip(jaipur);

Map.addLayer(
population,
{
min:0,
max:500,
palette:[
'white',
'yellow',
'orange',
'red'
]
},
'Population'
);

// ================= POPULATION EXPOSURE =================

var populationExposure = normalize(
population,
0,
500
)
.rename('PopulationExposure');

// Map.addLayer(
// populationExposure,
// {
// min:0,
// max:1,
// palette:[
// 'white',
// 'yellow',
// 'orange',
// 'red'
// ]
// },
// 'Population Exposure'
// );

// ================= EXPOSURE MODEL =================

var Exposure = populationExposure
.rename('Exposure')
.clip(jaipur);
// ================= EXPOSURE CLASS =================

var ExposureClass = ee.Image(0)

.where(
Exposure.lt(0.25),
1
)

.where(
Exposure.gte(0.25)
.and(Exposure.lt(0.50)),
2
)

.where(
Exposure.gte(0.50)
.and(Exposure.lt(0.75)),
3
)

.where(
Exposure.gte(0.75),
4
)

.rename('ExposureClass')

.clip(jaipur);

Map.addLayer(
Exposure,
{
min:0,
max:1,
palette:[
'green',
'yellow',
'orange',
'red'
]
},
'Population Exposure'
);

Map.addLayer(
ExposureClass,
{
min:1,
max:4,
palette:[
'00AA00',
'FFFF00',
'FFA500',
'FF0000'
]
},
'Exposure Class'
);

// ================= ET =================

var etRaw = ee.ImageCollection(

"MODIS/061/MOD16A2"

)

.filterBounds(jaipur)

.filterDate(

'2025-01-01',

'2025-12-31'

)

.select('ET')

.mean();


var et = etRaw

.updateMask(

etRaw.gt(-3000)

)

.multiply(0.1)

.rename('ET')

.clip(jaipur);


Map.addLayer(

et.updateMask(et.gt(0)),

{

min:0,

max:80,

palette:[

'white',

'cyan',

'blue'

]

},

'Evapotranspiration'

);


// ================= LAI =================

var lai =

era5Mean

.select(

'leaf_area_index_high_vegetation'

)

.add(

era5Mean.select(

'leaf_area_index_low_vegetation'

)

)

.rename('LAI')

.clip(jaipur);


Map.addLayer(

lai,

{

min:0,

max:6,

palette:[

'white',

'lightgreen',

'green'

]

},

'LAI'

);


// ================= SOIL MOISTURE =================

var soilMoisture =

era5Mean

.select(

'volumetric_soil_water_layer_1'

)

.rename('SoilMoisture')

.clip(jaipur);


Map.addLayer(

soilMoisture,

{

min:0,

max:0.5,

palette:[

'brown',

'yellow',

'blue'

]

},

'Soil Moisture'

);


// ================= NORMALIZATION FUNCTION =================

function normalize(image, min, max) {

return image

.subtract(min)

.divide(

ee.Number(max).subtract(min)

)

.clamp(0,1)

.clip(jaipur);

}

// ================= HEAT STORAGE INDEX =================

// Normalize components
var dayLST_n = normalize(dayLST, 20, 50);

var nightLST_n = normalize(nightLST, 15, 40);

var built_n = normalize(builtDensity, 0, 1);

var ndbi_n = normalize(ndbi, -0.3, 0.5);

// Low albedo stores more heat
var albedoDeficit = ee.Image(1)
.subtract(
normalize(albedo,0,0.6)
);

// Low vegetation stores more heat
var vegetationDeficit = ee.Image(1)
.subtract(
normalize(ndvi,-0.2,0.8)
);

// Heat Storage Index
var heatStorage =

dayLST_n.multiply(0.30)

.add(
nightLST_n.multiply(0.30)
)

.add(
built_n.multiply(0.15)
)

.add(
ndbi_n.multiply(0.10)
)

.add(
albedoDeficit.multiply(0.10)
)

.add(
vegetationDeficit.multiply(0.05)
)

.rename('HeatStorage')

.clamp(0,1)

.clip(jaipur);

// Display

Map.addLayer(
heatStorage,
{
min:0,
max:1,
palette:[
'blue',
'cyan',
'yellow',
'orange',
'red'
]
},
'Heat Storage'
);



// ================= COOLING CAPACITY INDEX =================

// Normalize Cooling Factors

var NDVI_cc = normalize(ndvi, -0.2, 0.8);

var NDWI_cc = normalize(ndwi, -1, 1);

var ET_cc = normalize(et, 0, 80);

var SoilMoisture_cc = normalize(soilMoisture, 0, 0.5);

var FVC_cc = normalize(FVC, 0, 1);

var LAI_cc = normalize(lai, 0, 6);

// Cooling Capacity Index

var coolingCapacity =

NDVI_cc.multiply(0.25)

.add(
ET_cc.multiply(0.20)
)

.add(
SoilMoisture_cc.multiply(0.20)
)

.add(
NDWI_cc.multiply(0.15)
)

.add(
FVC_cc.multiply(0.10)
)

.add(
LAI_cc.multiply(0.10)
)

.rename('CoolingCapacity')

.clamp(0,1)

.clip(jaipur);

// Display

Map.addLayer(
coolingCapacity,
{
min:0,
max:1,
palette:[
'red',
'orange',
'yellow',
'lightgreen',
'darkgreen'
]
},
'Cooling Capacity'
);

// ================= NORMALIZED HEAT DRIVERS =================

// Higher value = higher heat risk

var LST_n = normalize(lst, 25, 50);

// ================= NORMALIZED NIGHT LST =================

var NightLST_n = normalize(nightLST, 15, 40);

var NDBI_n = normalize(ndbi, -0.3, 0.5);

var Built_n = normalize(builtDensity, 0, 1);

var HeatStorage_n = normalize(heatStorage, 0, 80);

var Aerosol_n = normalize(aerosolIndex, -1, 3);

var SoilTemp_n = normalize(soilTemp, 20, 45);


// ================= NORMALIZED COOLING FACTORS =================

// Inverted because higher cooling lowers heat risk

var NDVI_n = ee.Image(1)

.subtract(

normalize(ndvi,-0.2,0.8)

)

.rename('NDVI_n')

.clip(jaipur);


var NDWI_n = ee.Image(1)

.subtract(

normalize(ndwi,-1,1)

)

.rename('NDWI_n')

.clip(jaipur);


var ET_n = ee.Image(1)

.subtract(

normalize(et,0,80)

)

.rename('ET_n')

.clip(jaipur);


var SoilMoisture_n = ee.Image(1)

.subtract(

normalize(soilMoisture,0,0.5)

)

.rename('SoilMoisture_n')

.clip(jaipur);


var FVC_n = ee.Image(1)

.subtract(

normalize(FVC,0,1)

)

.rename('FVC_n')

.clip(jaipur);


var LAI_n = ee.Image(1)

.subtract(

normalize(lai,0,6)

)

.rename('LAI_n')

.clip(jaipur);


// ================= ENVIRONMENTAL FACTORS =================

var RH_n = ee.Image(1)

.subtract(

normalize(relativeHumidity,0,100)

)

.rename('RH_n')

.clip(jaipur);



var Precip_n = ee.Image(1)

.subtract(

normalize(precipitation,0,300)

)

.rename('Precip_n')

.clip(jaipur);



var Elevation_n = normalize(

dem,

200,

700

)

.rename('Elevation_n')

.clip(jaipur);



var Solar_n = normalize(

solarRadiation,

0,

30

)

.rename('Solar_n')

.clip(jaipur);



// ================= DAY HEAT DRIVERS =================

var DayHeatDrivers =

LST_n.multiply(0.25)

.add(
Built_n.multiply(0.10)
)

.add(
NDBI_n.multiply(0.10)
)

.add(
HeatStorage_n.multiply(0.10)
)

.add(
Aerosol_n.multiply(0.05)
)

.add(
SoilTemp_n.multiply(0.05)
)

.rename('DayHeatDrivers');



// ================= COOLING DEFICIT =================

var CoolingDeficit =

NDVI_n.multiply(0.08)

.add(
NDWI_n.multiply(0.03)
)

.add(
ET_n.multiply(0.08)
)

.add(
SoilMoisture_n.multiply(0.05)
)

.add(
FVC_n.multiply(0.03)
)

.add(
LAI_n.multiply(0.03)
)

.rename('CoolingDeficit');

// ================= ENVIRONMENTAL STRESS =================

var Wind_n = ee.Image(1)
.subtract(normalize(windSpeed,0,10));

var EnvironmentalStress =

RH_n.multiply(0.03)

.add(
Solar_n.multiply(0.04)
)

.add(
Precip_n.multiply(0.03)
)

.add(
Wind_n.multiply(0.03)
)

.rename('EnvironmentalStress');


// ================= DAY HEAT RISK =================

var DayHeatRisk =

DayHeatDrivers

.add(CoolingDeficit)

.add(EnvironmentalStress)

.rename('DayHeatRisk')

.clamp(0,1)

.clip(jaipur);

Map.addLayer(
DayHeatRisk,
{
min:0,
max:1,
palette:[
'006400',
'7FFF00',
'FFFF00',
'FFA500',
'FF0000'
]
},
'Day Heat Risk'
);

// ================= NIGHT HEAT RISK =================

var NightHeatRisk =

NightLST_n.multiply(0.40)

.add(
HeatStorage_n.multiply(0.20)
)

.add(
Built_n.multiply(0.15)
)

.add(
NDBI_n.multiply(0.10)
)

.add(
CoolingDeficit.multiply(0.15)
)

.rename('NightHeatRisk')

.clamp(0,1)

.clip(jaipur);

Map.addLayer(
NightHeatRisk,
{
min:0,
max:1,
palette:[
'0015ff',
'00ffff',
'00ff00',
'ffff00',
'ff0000'
]
},
'Night Heat Risk'
);

// ================= VULNERABILITY MODEL =================

var Vulnerability =

DayHeatRisk.multiply(0.50)

.add(

NightHeatRisk.multiply(0.25)

)

.add(

Exposure.multiply(0.25)

)

.rename('Vulnerability')

.clamp(0,1)

.clip(jaipur);

// ================= VULNERABILITY CLASS =================

var VulnerabilityClass = ee.Image(0)

.where(
Vulnerability.lt(0.25),
1
)

.where(
Vulnerability.gte(0.25)
.and(Vulnerability.lt(0.50)),
2
)

.where(
Vulnerability.gte(0.50)
.and(Vulnerability.lt(0.75)),
3
)

.where(
Vulnerability.gte(0.75),
4
)

.rename('VulnerabilityClass')

.clip(jaipur);

Map.addLayer(
Vulnerability,
{
min:0,
max:1,
palette:[
'006400',
'7FFF00',
'FFFF00',
'FFA500',
'FF0000'
]
},
'Vulnerability'
);

Map.addLayer(
VulnerabilityClass,
{
min:1,
max:4,
palette:[
'006400',
'FFFF00',
'FFA500',
'FF0000'
]
},
'Vulnerability Class'
);

// ================= RESILIENCE MODEL =================

var Resilience =

normalize(ndvi,-0.2,0.8).multiply(0.25)

.add(

normalize(et,0,80).multiply(0.20)

)

.add(

normalize(soilMoisture,0,0.5).multiply(0.20)

)

.add(

normalize(ndwi,-1,1).multiply(0.15)

)

.add(

normalize(FVC,0,1).multiply(0.10)

)

.add(

normalize(lai,0,6).multiply(0.10)

)

.rename('Resilience')

.clamp(0,1)

.clip(jaipur);
// ================= RESILIENCE CLASS =================

var ResilienceClass = ee.Image(0)

.where(
Resilience.lt(0.25),
1
)

.where(
Resilience.gte(0.25)
.and(Resilience.lt(0.50)),
2
)

.where(
Resilience.gte(0.50)
.and(Resilience.lt(0.75)),
3
)

.where(
Resilience.gte(0.75),
4
)

.rename('ResilienceClass')

.clip(jaipur);


Map.addLayer(
Resilience,
{
min:0,
max:1,
palette:[
'8B0000',
'FF4500',
'FFFF00',
'7FFF00',
'006400'
]
},
'Resilience'
);
Map.addLayer(
ResilienceClass,
{
min:1,
max:4,
palette:[
'8B0000',
'FFFF00',
'7FFF00',
'006400'
]
},
'Resilience Class'
);



// ================= HEAT CLASS =================

var HeatClass = ee.Image(0)

.where(
DayHeatRisk.lt(0.25),
1
)

.where(
DayHeatRisk.gte(0.25)
.and(DayHeatRisk.lt(0.50)),
2
)

.where(
DayHeatRisk.gte(0.50)
.and(DayHeatRisk.lt(0.75)),
3
)

.where(
DayHeatRisk.gte(0.75),
4
)

.rename('HeatClass')
.clip(jaipur);


Map.addLayer(

HeatClass,

{

min:1,

max:4,

palette:[

'006400',

'FFFF00',

'FFA500',

'FF0000'

]

},

'Heat Class'

);



// ================= MITIGATION MAPS =================


// Cool Roof

var CoolRoof =

DayHeatRisk.gt(0.70)

.and(

ndbi.gt(0)

)

.and(

ndvi.lt(0.30)

)

.clip(jaipur);


Map.addLayer(

CoolRoof.selfMask(),

{

palette:['cyan']

},

'Cool Roof Zones'

);




// Urban Forest

var UrbanForest =

DayHeatRisk.gt(0.60)

.and(

ndvi.lt(0.30)

)

.and(

FVC.lt(0.40)

)

.clip(jaipur);


Map.addLayer(

UrbanForest.selfMask(),

{

palette:['green']

},

'Urban Forest Zones'

);




// Water Sensitive Cooling

var WaterCooling =

DayHeatRisk.gt(0.60)

.and(

ndwi.lt(0)

)

.and(

soilMoisture.lt(0.20)

)

.clip(jaipur);


Map.addLayer(

WaterCooling.selfMask(),

{

palette:['blue']

},

'Water Cooling Zones'

);




// Reflective Surface

var ReflectiveSurface =

DayHeatRisk.gt(0.65)

.and(

albedo.lt(0.20)

)

.and(

ndbi.gt(0)

)

.clip(jaipur);


Map.addLayer(

ReflectiveSurface.selfMask(),

{

palette:['white']

},

'Reflective Surface Zones'

);




// ================= STACK ALL BANDS =================

var allBands =

lst

.addBands(ndvi)

.addBands(ndbi)

.addBands(ndwi)

.addBands(relativeHumidity)

.addBands(surfacePressure)

.addBands(precipitation)

.addBands(solarRadiation)

.addBands(evaporation)

.addBands(soilTemp)

.addBands(aerosolIndex)

.addBands(albedo)

.addBands(builtDensity)

.addBands(FVC)

.addBands(heatStorage)
.addBands(coolingCapacity)

.addBands(landcover)

.addBands(dem)

.addBands(slope)

.addBands(aspect)

.addBands(et)

.addBands(lai)

.addBands(soilMoisture)

.addBands(population)
.addBands(populationExposure)

.addBands(DayHeatRisk)
.addBands(NightHeatRisk)
.addBands(Exposure)
.addBands(ExposureClass)

.addBands(Vulnerability)
.addBands(VulnerabilityClass)

.addBands(Resilience)
.addBands(ResilienceClass)

.addBands(HeatClass);




// ================= FINAL DATASET =================

var dataset = allBands.reduceRegions({

collection:gridFC,

reducer:ee.Reducer.mean(),

scale:1000,

tileScale:4

});


// print(gridFC.first());
 print(dataset.first());

print(dataset.limit(5));

print(dataset.size());



Map.addLayer(

dataset.style({

color:'red',

fillColor:'00000000',

width:1

}),

{},

'COMPLETE HEAT DATASET'

);