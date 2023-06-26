var StudyArea = ee.FeatureCollection('users/lucabattistellageo/GAUL_ACP');



var AOIname = 'StudyArea'; 
Map.addLayer(StudyArea);
Map.centerObject(StudyArea, 8);

var StartYear = 1991; 
var Endyear = 2020; 

var GoogleDrivefolder = 'DownloadFromGEE'; 


// ------------------------- First year of degradation
var DegradationYear = ee.ImageCollection('projects/JRC/TMF/v1_2021/DegradationYear').mosaic();

// ------------------------- First year of deforestation
var DeforestationYear = ee.ImageCollection('projects/JRC/TMF/v1_2021/DeforestationYear').mosaic();

// ------------------------- Duration
var Duration = ee.ImageCollection('projects/JRC/TMF/v1_2021/Duration').mosaic();

// ------------------------- Intensity
var Intensity = ee.ImageCollection('projects/JRC/TMF/v1_2021/Intensity').mosaic();

// ------------------------- Transition Map - Sub types 
var Transition=ee.ImageCollection('projects/JRC/TMF/v1_2021/TransitionMap_Subtypes').mosaic(); 


//* Deforestation
var OldDeforestation=( (Transition.gte(41)).and(Transition.lte(42)) ).or( (Transition.gte(65)).and(Transition.lte(66)) );
var RecentDeforestation= ( (Transition.gte(51)).and(Transition.lte(53))).or(  (Transition.eq(67)).and(DeforestationYear.lt(2021)) ).or(  (Transition.eq(67)).and(DeforestationYear.gte(2021)).and(Intensity.gte(10)) );
var DeforestationToWater=(Transition.gte(73)).and(Transition.lte(74));
var DeforestationToPlantations=(Transition.gte(82)).and(Transition.lte(86));//

//* Forest degradation
var ShortDurationDegradation= ( (Transition.gte(21)).and(Transition.lte(22)) ).or( (Transition.gte(61)).and(Transition.lte(62)).and(Duration.lte(365)) ).or((Transition.eq(54)).or( (Transition.eq(67)).and(DegradationYear.gte(2021)).and(Intensity.lt(10)) ));
var LongDurationDegradation= ( (Transition.gte(23)).and(Transition.lte(26)) ).or( (Transition.gte(61)).and(Transition.lte(62)).and(Duration.gt(365)) );

//* Vegetation regrowth
var Regrowth=( (Transition.gte(31)).and(Transition.lte(33)) ).or( (Transition.gte(63)).and(Transition.lte(64)) );


// ------------------------- Annual changes collection 1990-2021
var AnnualChanges = ee.ImageCollection('projects/JRC/TMF/v1_2021/AnnualChanges').mosaic();


for (var i=StartYear; i<(Endyear+1); i++) {

var j=i-1;
var year='Dec' +i;
var yearminus1= 'Dec' +j;

var AnnualChangesYear=AnnualChanges.select(year.toString());
var AnnualChangesYearMinus1=AnnualChanges.select(yearminus1.toString());



//*** REMAINING UNDISTURBED FOREST
var Class10=(AnnualChangesYear.eq(1)); 

//*** NEW DEGRADATION
var newdegradation=(AnnualChangesYearMinus1.eq(1)).and(AnnualChangesYear.eq(2));

var Class21=newdegradation.and(ShortDurationDegradation); // Short-duration degradation
var Class22= newdegradation.and(LongDurationDegradation); // Long-duration degradation    
var Class23=(newdegradation).and(OldDeforestation.or(RecentDeforestation).or(Regrowth));  // Degradation before deforestation

var totalDegradation= Class21.or(Class22).or(Class23); // Total Forest Degradation

//*** NEW DEFORESTATION
//Direct
var newdefordirect=(AnnualChangesYearMinus1.eq(1)).and(AnnualChangesYear.eq(3));//

var Class31=(newdefordirect).and(RecentDeforestation.or(OldDeforestation)); // Direct deforestation not followed by regrowth
var Class32=(newdefordirect).and(Regrowth); // Direct deforestation followed by regrowth
var Class33= newdefordirect.and(DeforestationToPlantations); // Deforestation to plantations

var newdeforwater=(AnnualChangesYearMinus1.eq(1)).and(AnnualChangesYear.eq(5));
var Class34= (DeforestationToWater).and(newdefordirect.or(newdeforwater)); // Deforestation to water

//After degradation
var newdeforafterdegrad=(AnnualChangesYearMinus1.eq(2)).and(AnnualChangesYear.eq(3));//

var Class35=(newdeforafterdegrad).and(RecentDeforestation.or(OldDeforestation)); // Deforestation after degradation not followed by regrowth 
var Class36=(newdeforafterdegrad).and(Regrowth); // Deforestation after degradation followed by regrowth 

var totalDeforestation= Class31.or(Class32).or(Class33).or(Class34).or(Class35).or(Class36); // Total Deforestation
var totalDirectDeforestation = Class31.or(Class32).or(Class33).or(Class34); // Total Direct Deforestation


//*** NEW DISTURBANCE (Degradation or deforestation)
var Disturbance = newdegradation.or(newdefordirect);


//*** NEW REGROWTH
var newregrowth=(AnnualChangesYearMinus1.eq(3)).and(AnnualChangesYear.eq(4));
var Class41=(newregrowth).and(Regrowth);


// Main classes
var AllClasses = ee.Image.cat(
      Class10.rename('UndisturbedForest'), 
      totalDegradation.rename('ForestDegradation'), 
      totalDirectDeforestation.rename('DirectDeforestation'),
      newdeforafterdegrad.rename('DeforAfterDegrad'),
      Class41.rename('Regrowth')
);



//******************************************

var LOOPsamples= function(feature) {
  var vals = AllClasses.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(), 
    geometry: feature.geometry(),
    scale: 30,
    maxPixels:1816737197000000000000000000000
  });
  return ee.Feature(null, vals).copyProperties(feature, feature.propertyNames());
};

var LOOPresult2=StudyArea.map(LOOPsamples); // results in square meters, should be divided by 10000 to get hectares

Export.table.toDrive({
	collection: LOOPresult2,
	description: 'AnnualChange_'+AOIname+ '_' + year,
	folder: GoogleDrivefolder, // CSV file containing the statistics for each year
	fileNamePrefix: 'AnnualChange_'+AOIname+ '_' + year,
});

}
