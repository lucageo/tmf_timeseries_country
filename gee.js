
var StudyArea = ee.FeatureCollection('projects/ee-biopama/assets/pas_2022');



var AOIname = 'StudyArea'; //to be replaced by the explicit name of the study area
Map.addLayer(StudyArea);


//*** 1bis) If your study area is large (entire regions/state), uncomment the following two lines
//*** in order to speed up the statistics extraction and to avoid error messages from GEE



//*** 2) Indicate the timeframe you are interested in for extracting statistics

var StartYear = 2018; 
var Endyear = 2022; 

//*** 3) Indicate the name of the Google drive folder where the results will be exported

var GoogleDrivefolder = 'tmf'; //to be changed 



//---------------------------------------------------------------------------------------
// ----------------------------------------- 2) LOAD TMF DATA
//---------------------------------------------------------------------------------------

// ------------------------- First year of degradation
var DegradationYear = ee.ImageCollection('projects/JRC/TMF/v1_2022/DegradationYear').mosaic();

// ------------------------- First year of deforestation
var DeforestationYear = ee.ImageCollection('projects/JRC/TMF/v1_2022/DeforestationYear').mosaic();

// ------------------------- Duration
var Duration = ee.ImageCollection('projects/JRC/TMF/v1_2022/Duration').mosaic();

// ------------------------- Intensity
var Intensity = ee.ImageCollection('projects/JRC/TMF/v1_2022/Intensity').mosaic();

// ------------------------- Transition Map - Sub types 
var Transition=ee.ImageCollection('projects/JRC/TMF/v1_2022/TransitionMap_Subtypes').mosaic(); 

// value 10. Undisturbed Tropical Moist Forest (TMF) 
// value 11. Bamboo-dominated forest
// value 12. Undisturbed mangroves

// value 21. Degraded forest with short-duration disturbance (started before 2012)
// value 22. Degraded forest with short-duration disturbance (started in 2012-2020)
// value 23. Degraded forest with long-duration disturbance (started before 2012)
// value 24. Degraded forest with long-duration disturbance (started in 2012-2020)
// value 25. Degraded forest with 2/3 degradation periods (last degradation started before 2012)
// value 26. Degraded forest with 2/3 degradation periods (last degradation started in 2012-2020)

// value 31. Old forest regrowth (disturbed before 2002)
// value 32. Young forest regrowth (disturbed in 2002-2011)
// value 33. Very young forest regrowth (disturbed in 2012-2018)

// value 41. Deforestation started before 2011
// value 42. Deforestation started in 2011-2018

// value 51. Deforestation* started in 2019 
// value 52. Deforestation* started in 2020 
// value 53. Deforestation* started in 2021  
// value 54. Degradation* started in 2021 

// value 61. Degraded Mangroves (started before 2012)
// value 62. Mangrove recently degraded (2012 -2020)
// value 63. Mangrove regrowing (at least 10 years - 2012-2021)
// value 64. Mangrove regrowing (at least 3 years - 2019-2021)
// value 65. Mangrove deforested (started before 2011)
// value 66. Mangrove deforested (started in 2012-2018)
// value 67. Mangrove recently disturbed (started in 2019-2021)

// value 71. Permanent water (Pekel et al. 2016 & updates for years 2015-2021)     
// value 72. Seasonal water  (Pekel et al. 2016 & updates for years 2015-2021)     
// value 73. Deforestation to permanent water 
// value 74. Deforestation to seasonal water 

// value 81. Old Plantation
// value 82. Plantation regrowing (disturbed before 2012) 
// value 83. Plantation regrowing (disturbed in 2012-2018)  
// value 84. Conversion to plantation (deforestation started before 2011)
// value 85. Conversion to plantation (deforestation started in 2012-2018)
// value 86. Recent Conversion to plantation (started in 2019-2021)

// value 91.  Other land cover without afforestation  
// value 92.  Young afforestation (between 3 and 9 years of regrowth)
// value 93.  Old afforestation (between 10 and 20 years of regrowth)
// value 94.  Water converted recently into forest regrowth (at least 3 years)

//Specific trantion classes

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

// value 1. Undisturbed Tropical moist forest (TMF) 
// value 2. Degraded TMF
// value 3. Deforested land
// value 4. Forest regrowth
// value 5. Permanent or seasonal Water  
// value 6. Other land cover

//---------------------------------------------------------------------------------------
// ----------------------------------------- 3) COMPUTE STATISTICS
//---------------------------------------------------------------------------------------

for (var i=StartYear; i<(Endyear+1); i++) {

var j=i-1;
var year='Dec' +i;
var yearminus1= 'Dec' +j;

var AnnualChangesYear=AnnualChanges.select(year.toString());
var AnnualChangesYearMinus1=AnnualChanges.select(yearminus1.toString());

//******************************************

//*** REMAINING UNDISTURBED FOREST
var Class10=(AnnualChangesYear.eq(1)); 

//******************************************

//*** NEW DEGRADATION
var newdegradation=(AnnualChangesYearMinus1.eq(1)).and(AnnualChangesYear.eq(2));

var Class21=newdegradation.and(ShortDurationDegradation); // Short-duration degradation
var Class22= newdegradation.and(LongDurationDegradation); // Long-duration degradation    
var Class23=(newdegradation).and(OldDeforestation.or(RecentDeforestation).or(Regrowth));  // Degradation before deforestation

var totalDegradation= Class21.or(Class22).or(Class23); // Total Forest Degradation

//******************************************

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

//******************************************

//*** NEW DISTURBANCE (Degradation or deforestation)
var Disturbance = newdegradation.or(newdefordirect);

//******************************************

//*** NEW REGROWTH
var newregrowth=(AnnualChangesYearMinus1.eq(3)).and(AnnualChangesYear.eq(4));
var Class41=(newregrowth).and(Regrowth);

//******************************************
//*** Choose to extract main or detailed classes of TMF change:

// Main classes
var AllClasses = ee.Image.cat(
      Class10.rename('UndisturbedForest'), 
      totalDegradation.rename('ForestDegradation'), 
      totalDirectDeforestation.rename('DirectDeforestation'),
      newdeforafterdegrad.rename('DeforAfterDegrad'),
      Class41.rename('Regrowth')
);


// // Detailed classes
// var AllClasses = ee.Image.cat(
//       Class10.rename('UndisturbedForest'), 
      
//       Disturbance.rename('ForestDisturbance'),
      
//       totalDegradation.rename('ForestDegradation'), 
//       Class21.rename('ShortDurationDegradation'), 
//       Class22.rename('LongDurationDegradation'),  
//       Class23.rename('DegradBeforeDefor'),
      
//       totalDeforestation.rename('Deforestation'),
//       totalDirectDeforestation.rename('DirectDeforestation'),
//       Class31.rename('DirectDeforNotFollowedByRegrowth'), 
//       Class32.rename('DirectDeforFollowedByRegrowth'),  
//       Class33.rename('DirectDeforToPlantations'),
//       Class34.rename('DirectDeforToWater'),
//       Class35.rename('DeforAfterDegradNotFollowedByRegrowth'),
//       Class36.rename('DeforAfterDegradFollowedByRegrowth'),
      
//       Class41.rename('Regrowth')
// );

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


