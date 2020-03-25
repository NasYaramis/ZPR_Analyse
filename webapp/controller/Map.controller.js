/* global ol:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage",
	"zpr/analyse/ZPR-Analyse/libs/ol"
], function(Controller, JSONModel, Label, Filter, Header, oljs) {
	"use strict";
	
	// Define arrays which hold data and map
	var aInfo = [];
	var assets = [];
	var oLocations, map;
	var aLocations = [];

	// Define all the layers for both total journey and last location
	var groupTotalJourneyLayers, groupTotalJourneyLines, groupClusterLayers;
	
	// Define the variables we need to keep track of all the sources
	var counter = 0;
	var sourceTotalLocations = [];
	
	var aLayers = [];
	var features = [];
	var allLayers = [];
	var allClusters = [];
	var marker = new ol.Feature();
	var clusters = new ol.layer.Vector();

	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Map", {
		Header: new Header(this),

		onInit: function() {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteMap").attachMatched(this.initialize, this);
		},
		
		initialize: function (oEvent) {
			var that = this;
			
			that.resetEverything();
			
			// Set weburl
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets/export";

			// Get data from asset
			// We pass the authentication required for the endpoint along with the call
			$.ajax({
				url: weburl,
				type: "GET",
				dataType: "json",
				//	headers:{
				//	Authorization:"Bearer "+authenticationToken	
				//	},
				success: function (dataj) {
					//assets = dataj;
					
					//Here we remove all duplicated keys in the assets/export api using JQuery
					$.each(dataj, function(key, value) {
					var exists = false;
					$.each(assets, function(k, val2) {
					  if(value.id === val2.id) {exists = true;}
					});
					if(exists === false && value.id !== "") { assets.push(value); }
					});
						
					//Selects are filled with data		
					that.feedData();
					
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(assets);
					that.getView().setModel(oModel);
					
					//Keys are assigned to selects
					that.aKeys = [
						"Batch", "Type", "Color", "Location"
					];
					that.oSelectName = that.getSelect("slBatch");
					that.oSelectType = that.getSelect("slType");
					that.oSelectColor = that.getSelect("slColor");
					that.oSelectLocation = that.getSelect("slLocation");
					that.oDateBegin = that.getSelect("dBeginDate");
					that.oDateEnd = that.getSelect("dEndDate");

					var oFB = that.getView().byId("filterbar");
					if (oFB) {
						oFB.variantsInitialized();
					}


				},
				error: function (errorstatus, statusText) {
					// If the user is unauthorized we redirect him back to the login page
				}
			}).done(function () {
			});
		},

		onExit: function() {
			this.aKeys = [];
			this.aFilters = [];
			this.oModel = null;
		},
		onToggleHeader: function() {
			this.getPage().setHeaderExpanded(!this.getPage().getHeaderExpanded());
		},

		onSelectChange: function() {
			var aCurrentFilterValues = [];
    		var busyDialog = this.getView().byId("BusyDialog");
			
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectName));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectType));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectColor));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectLocation));
			aCurrentFilterValues.push((this.oDateBegin).getValue());
			aCurrentFilterValues.push((this.oDateEnd).getValue());


			busyDialog.setVisible(true);
			busyDialog.open();
			this.filterMap(aCurrentFilterValues);
		    busyDialog.close();
		    busyDialog.setVisible(false);    
		},

		filterMap: function(aCurrentFilterValues) {

			//this.resetEverything();

			//If type filter is applied following code will filter data
			if(aCurrentFilterValues[1] !== "TYPE0"){
				var assetJourneysLength;
				
				if(aCurrentFilterValues[1] === "TYPE1"){
					for(var x in assets){
						if(assets[x].type === "CONNECTED"){
							assetJourneysLength = assets[x].assetJourneys.length;
							aInfo.push(assets[x].physicalId);
							oLocations.push(assets[x].assetJourneys[assetJourneysLength - 1].lastLocationData);
						}
					}
				}else{
					for(var y in assets){
						if(assets[y].type === "UNCONNECTED"){
							assetJourneysLength = assets[y].assetJourneys.length;
							aInfo.push(assets[y].physicalId);
							oLocations.push(assets[y].assetJourneys[assetJourneysLength - 1].lastLocationData);
						}
					}
				}
			}
			
			//Following filter sets an interval between two dates which shows the assets, which changed location between interval.
			if(aCurrentFilterValues[4] !== "" && aCurrentFilterValues[5] !== ""){
				for(var a in assets){
					for (var b in assets[a].assetJourneys){
						for (var c in assets[a].assetJourneys[b].locations){
							var timestamp = assets[a].assetJourneys[b].locations[c].timestamp;
							if(timestamp.substring(0, timestamp.indexOf("T")) >= this.oDateBegin.getValue() && timestamp .substring(0, timestamp.indexOf("T")) <= this.oDateEnd.getValue()){
								aInfo.push(assets[a].physicalId);
								oLocations.push(assets[a].assetJourneys[b].locations[c]);
							}
						}
					}
				}
			}else if(aCurrentFilterValues[4] !== "" || aCurrentFilterValues[5] !== ""){
				return ; 
			}
			
			// //If end date filter is applied following code will filter data
			// if(aCurrentFilterValues[5] !== ""  && aCurrentFilterValues[4] !== ""){
			// 	for(var d in assets){
			// 		for (var e in assets[d].assetJourneys){
			// 			for (var f in assets[d].assetJourneys[e].locations){
			// 				var timestamp2 = assets[d].assetJourneys[e].locations[f].timestamp;
			// 				if(timestamp2.substring(0, timestamp2.indexOf("T")) <= this.oDateEnd.getValue() && timestamp2.substring(0, timestamp2.indexOf("T")) >= this.oDateBegin.getValue()){
			// 					aInfo.push(assets[d].physicalId);
			// 					oLocations.push(assets[d].assetJourneys[e].locations[f]);
			// 				}
			// 			}
			// 		}
			// 	}
			// }
			this.createLastLocations();
			this.showTotalJourney();
		},
		
		createLastLocations: function() {
			// Reset locations array
			aLocations.length = 0;
			
			var style = new ol.style.Style({
					image: new ol.style.Circle({
						radius: 15,
						fill: new ol.style.Fill({color: "#E6600D"}),
						stroke: new ol.style.Stroke({
							color: [255,0,0], width: 2
						})
					})
				});
				
			var styleCache = {};
			var clusterStyle = function(feature) {
				    var size = feature.get("features").length;
				    var style2 = styleCache[size];
				    if (!style2) {
				      style2 = new ol.style.Style({
				        image: new ol.style.Circle({
				          radius: 15,
				          stroke: new ol.style.Stroke({
				            color: "#fff"
				          }),
				          fill: new ol.style.Fill({
				            color: "#E6600D"
				          })
				        }),
				        text: new ol.style.Text({
				          text: size.toString(),
				          fill: new ol.style.Fill({
				            color: "#fff"
				          })
				        })
				      });
				      styleCache[size] = style2;
				    }
				    return style2;
				  };
			
			features = oLocations.map(function(location){
				
				marker = new ol.Feature({
					geometry: new ol.geom.Point(
						ol.proj.fromLonLat([location.longitude, location.latitude])
					)
				});
				
				marker.set("info", aInfo[counter]);
				counter++;
				marker.set("timestamp", location.timestamp);
				
				marker.setStyle(style);
				
				return marker;
			});
			
			oLocations.forEach(function(location) {
				// Fill an array with solely the converted longitude and latitude
				aLocations.push(
					ol.proj.fromLonLat([location.longitude, location.latitude])
				);
				
				// // Create a marker (= feature) which references to the location of the asset
				//  marker = new ol.Feature({
				// 	geometry: new ol.geom.Point(
				// 		ol.proj.fromLonLat([location.longitude, location.latitude])
				// 	)
				// });
				
				// // Change the style of the marker and use a custom icon
				// marker.setStyle( new ol.style.Style({
				// 	image: new ol.style.Circle({
				// 		radius: 15,
				// 		fill: new ol.style.Fill({color: '#E6600D'}),
				// 		stroke: new ol.style.Stroke({
				// 			color: [255,0,0], width: 2
				// 		})
				// 	})
				// }));
				
				// Create a vector based on the features
				var vectorSource = new ol.source.Vector({
					features: features
				});
				
				var clusterSource = new ol.source.Cluster({
					distance: 30,
					source: vectorSource
				});
				
				clusters = new ol.layer.Vector({
				  source: clusterSource,
				  style: clusterStyle
				});
				
				// Create layer based on a vector		
				var markerVectorLayer = new ol.layer.Vector({
					source: vectorSource
				});
				
				allClusters.push(clusters);
				allLayers.push(markerVectorLayer);
				allLayers.push(clusters);
				aLayers.push(markerVectorLayer);
				sourceTotalLocations.push(vectorSource);
			});
			
			if(aLocations.length > 0) {
				groupTotalJourneyLayers = new ol.layer.Group({
					layers: aLayers,
					name: 'totalJourneysGroup'
					
				});
				
				groupClusterLayers = new ol.layer.Group({
					layers: allClusters,
					name: 'totalClusters'
					
				});
			}
		},
		
		showTotalJourney: function() {
			var that = this;
			
			// Add both layers that belong to the total journey to the map
			map.addLayer(groupTotalJourneyLayers);
			map.addLayer(groupClusterLayers);

			// Reset the center of the map
			if(oLocations.length > 0){
				that.setMapCenter(oLocations[(oLocations.length - 1)].longitude, oLocations[(oLocations.length - 1)].latitude);
			}
		},
		
		getFilters: function(aCurrentFilterValues) {
			this.aFilters = [];

			this.aFilters = this.aKeys.map(function(sCriteria, i) {
				return new Filter(sCriteria, sap.ui.model.FilterOperator.Contains, aCurrentFilterValues[i]);
			});

			return this.aFilters;
		},

		getFormattedSummaryText: function(aFilterCriterias) {
			if (aFilterCriterias.length > 0) {
				return "Filtered By (" + aFilterCriterias.length + "): " + aFilterCriterias.join(", ");
			} else {
				return "Filtered by None";
			}
		},

		getMap: function() {
			return this.getView().byId("map_canvas");
		},

		getSelect: function(sId) {
			return this.getView().byId(sId);
		},
		getSelectedItemText: function(oSelect) {
			return oSelect.getSelectedItem() ? oSelect.getSelectedItem().getKey() : "";
		},
		getPage: function() {
			return this.getView().byId("dynamicPageId");
		},
		getPageTitle: function() {
			return this.getPage().getTitle();
		},
		
		onAfterRendering: function () {
			var that = this;
			if (!that.initialized) {
				that.initialized = true;

				// Set OpenLayers map
				map = new ol.Map({
					target: that.getView().byId("map_canvas").getDomRef(),
					layers: [
						new ol.layer.Tile({
							source: new ol.source.OSM()
						})
					],
					//overlays: [overlay],  // OVERLAY
					view: new ol.View({
						center: ol.proj.fromLonLat([4.357582, 51.198185]),
						zoom: 10
					})
				});
			}
			
			// Function which will show the info of the layer that has been clicked on
			map.on("singleclick", function(e) {
				map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
					
					if(allLayers.includes(layer)) {
						// Only show a messagebox when a marker has been clicked on, info is a unique property given by the marker layers
						if (feature.get('info'))
						{
							// Transform coördinates to a longitude & latitude array
							var lonlat = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
							
							// Show the converted longitude and latitude as well as the info
							that.getView().byId('txtLocationInfo').setText(ol.coordinate.toStringHDMS([lonlat[0], lonlat[1]]));
							that.getView().byId('txtAssetInfo').setText("Physical ID: " + feature.get('info'));
							that.getView().byId('txtTimestamp').setText("Timestamp: " + feature.get('timestamp'));
						}
					}
				});
			});
		},
		
		setMapCenter: function(longitude, latitude) {
			// Set center a new center on the map 
			map.getView().setCenter(ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'));
		},
		
		feedData: function(){
			var that = this;
			//This is created to gain Batch in filters
			var oSlBatchJSON = new sap.ui.model.json.JSONModel();
			var Batch = {
		            Batch : [{
		                name : "CHOOSE A BATCH",
		                key  : "BATCH0"
		            },{
		                name : "BATCH 1",
		                key  : "BATCH1"
		            },{
		                name : "BATCH 2",
		                key  : "BATCH2"
		            },{
		                name : "BATCH 3",
		                key  : "BATCH3"
		            },{
		                name : "BATCH 4",
		                key  : "BATCH4"
		            },{
		                name : "BATCH 5",
		                key  : "BATCH5"
		            },{
		                name : "BATCH 6",
		                key  : "BATCH6"
		            }]
		    };
	        oSlBatchJSON.setData(Batch);
			that.getView().byId("slBatch").setModel(oSlBatchJSON);
			
			//This is created to gain Type in filters
			var oSlTypeJSON = new sap.ui.model.json.JSONModel();
			var Type = {
		            Type : [{
		                name : "CHOOSE A TYPE",
		                key  : "TYPE0"
		            },{
		                name : "CONNECTED",
		                key  : "TYPE1"
		            },{
		                name : "UNCONNECTED",
		                key  : "TYPE2"
		            }]
		    };
	        oSlTypeJSON.setData(Type);
			that.getView().byId("slType").setModel(oSlTypeJSON);
			
			//This is created to gain Color in filters
			var oSlColorJSON = new sap.ui.model.json.JSONModel();
			var Color = {
		            Color : [{
		                name : "CHOOSE A COLOR",
		                key  : "COLOR0"
		            },{
		                name : "RED",
		                key  : "COLOR1"
		            },{
		                name : "BLUE",
		                key  : "COLOR2"
		            },{
		                name : "BLACK",
		                key  : "COLOR3"
		            }]
		    };
	        oSlColorJSON.setData(Color);
			that.getView().byId("slColor").setModel(oSlColorJSON);
			
			//This is created to gain Location in filters
			var oSlLocationJSON = new sap.ui.model.json.JSONModel();
			var Location = {
		            Location : [{
		                name : "CHOOSE A LOCATION",
		                key  : "LOC0"
		            },{
		                name : "MELLE",
		                key  : "LOC1"
		            },{
		                name : "DENDERMONDE",
		                key  : "LOC2"
		            },{
		                name : "WINTAM",
		                key  : "LOC3"
		            }]
		    };
	        oSlLocationJSON.setData(Location);
			that.getView().byId("slLocation").setModel(oSlLocationJSON);
		},
		
		resetEverything: function(){
			var that = this;
			
			oLocations = [];
			aInfo = [];
			counter = 0;
			
			//reset all layers and texts
			map.removeLayer(groupTotalJourneyLayers);
			map.removeLayer(groupTotalJourneyLines);
			
			// Reset all input and output
			that.getView().byId("txtLocationInfo").setText("");
			that.getView().byId("txtAssetInfo").setText("");
			that.getView().byId("txtTimestamp").setText("");
			that.getView().byId("slBatch").setSelectedKey("BATCH0");
			that.getView().byId("slLocation").setSelectedKey("LOC0");
			that.getView().byId("slColor").setSelectedKey("COLOR0");
			that.getView().byId("slType").setSelectedKey("TYPE0");
			that.getView().byId("dBeginDate").setValue("");
			that.getView().byId("dEndDate").setValue("");
			
			// Reset the target of the map
			// This has to be done every time we call this view as for some reason the map reference seems to disappear after routing multiple other views
			if (that.initialized) {
				map.setTarget(that.getView().byId("map_canvas").getDomRef());
			}
			
			// Clear sources from the total journey
			if (sourceTotalLocations) {
				if(Array.isArray(sourceTotalLocations) && sourceTotalLocations.length >= 1) {
					sourceTotalLocations.forEach(function(s){
						s.clear();
					});
				}
			}
		}
	});
});
