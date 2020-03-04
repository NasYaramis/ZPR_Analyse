sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage"
], function(Controller, JSONModel, Label, Filter, Header) {
	"use strict";
	
	var assets;
	// Define map and location we'll use later on
	var oLocations, map, physicalId, oLastLocation;
	var aLocations = [];
	var aInfo = [];

	// Define all the layers for both total journey and last location
	var groupTotalJourneyLayers, groupTotalJourneyLines, lastLocationLayer;
	
	// Define the variables we need to keep track of all the sources
	var sourceLastLocation;
	var sourceTotalLocations = [];
	var sourceTotalLines;
	var counter = 0;
	
	var allLayers = [];

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
					assets = dataj;
					
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(assets);
					that.getView().setModel(oModel);
					
					that.feedData();
					
					that.aKeys = [
						"Batch", "Type", "Color", "Location"
					];
					that.oSelectName = that.getSelect("slBatch");
					that.oSelectCategory = that.getSelect("slType");
					that.oSelectSupplierName = that.getSelect("slColor");
					that.oSelectLocation = that.getSelect("slLocation");
					//that.oModel.setProperty("/Filter/text", "Filtered by None");
					that.addSnappedLabel();
		
					var oFB = that.getView().byId("filterbar");
					if (oFB) {
						oFB.variantsInitialized();
					}
					/*// Set new model at table from the view
					var oFilter = that.getView().byId("filterbar");
					oFilter.setModel(oModel);*/
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
		onToggleFooter: function() {
			this.getPage().setShowFooter(!this.getPage().getShowFooter());
		},
		onSelectChange: function() {
			var aCurrentFilterValues = [];

			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectName));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectCategory));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectSupplierName));
			aCurrentFilterValues.push(this.getSelectedItemText(this.oSelectLocation));

			this.filterTable(aCurrentFilterValues);
		},

		filterTable: function(aCurrentFilterValues) {
			// Remove both layers that belong to the total journey to the map
			map.removeLayer(groupTotalJourneyLayers);
			map.removeLayer(groupTotalJourneyLines);
			this.resetEverything();


			if(aCurrentFilterValues[1] !== "TYPE0"){
					//Hier zal de onderscheidt tussen slimme en dummy assets gebeuren.
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
			this.createLastLocations();
			this.showTotalJourney();
			this.updateFilterCriterias(this.getFilterCriteria(aCurrentFilterValues));
		},
		
		createLastLocations: function() {
			var that = this;
			
			var aLayers = [];
			
			// Reset locations array array
			aLocations.length = 0;
			
			oLocations.forEach(function(location) {
				// Fill an array with solely the converted longitude and latitude
				aLocations.push(
					ol.proj.fromLonLat([location.longitude, location.latitude])
				);
				
				// Create a marker (= feature) which references to the location of the asset
				var marker = new ol.Feature({
					geometry: new ol.geom.Point(
						ol.proj.fromLonLat([location.longitude, location.latitude])
					)
				});
				
				// Set an extra property named timestamp so we can show the time later on when a users clicks on a marker
				marker.set('info', aInfo[counter]);
				counter++;

				// Change the style of the marker and use a custom icon
				marker.setStyle( new ol.style.Style({
					image: new ol.style.Circle({
						radius: 4,
						fill: new ol.style.Fill({color: '#E6600D'}),
						stroke: new ol.style.Stroke({
							color: [255,0,0], width: 2
						})
					})
				}));
				
				// Create a vector based on the marker (= feature)
				var vectorSource = new ol.source.Vector({
					features: [marker]
				});
				
				// Create layer based on a vector		
				var markerVectorLayer = new ol.layer.Vector({
					source: vectorSource
				});
				
				allLayers.push(markerVectorLayer);
				aLayers.push(markerVectorLayer);
				sourceTotalLocations.push(vectorSource);
			});
			
			if(aLocations.length > 0) {
				groupTotalJourneyLayers = new ol.layer.Group({
					layers: aLayers,
					name: 'totalJourneysGroup'
					
				});
				
				// Create style for a new layer (will be a line between markers)
				var styleLine = [
					new ol.style.Style({
							stroke: new ol.style.Stroke({
							color: '#E09D00',
							width: 3
						})
					})
				];
				
				sourceTotalLines = new ol.source.Vector({
					features: [new ol.Feature({
						geometry: new ol.geom.LineString(aLocations),
						name: 'Line',
					})]
				})
				
				// Create the layer (line between markers on the map)
				groupTotalJourneyLines = new ol.layer.Vector({
					source: sourceTotalLines
				});
				
				// Set the style of the freshly created layer
				groupTotalJourneyLines.setStyle(styleLine);
				
				allLayers.push(groupTotalJourneyLines);
			}
		},
		
		showTotalJourney: function() {
			var that = this;
			
			// Remove the last location layer
			map.removeLayer(lastLocationLayer);
			
			// Add both layers that belong to the total journey to the map
			map.addLayer(groupTotalJourneyLayers);

			// Reset the center of the map
			if(oLocations.length > 0){
				that.setMapCenter(oLocations[(oLocations.length - 1)].longitude, oLocations[(oLocations.length - 1)].latitude);
			}
		},

		updateFilterCriterias: function(aFilterCriterias) {
			this.removeSnappedLabel(); /* because in case of label with an empty text, */
			this.addSnappedLabel(); /* a space for the snapped content will be allocated and can lead to title misalignment */
			//this.oModel.setProperty("/Filter/text", this.getFormattedSummaryText(aFilterCriterias));
		},

		addSnappedLabel: function() {
			var oSnappedLabel = this.getSnappedLabel();
			oSnappedLabel.attachBrowserEvent("click", this.onToggleHeader, this);
			this.getPageTitle().addSnappedContent(oSnappedLabel);
		},

		removeSnappedLabel: function() {
			this.getPageTitle().destroySnappedContent();
		},

		getFilters: function(aCurrentFilterValues) {
			this.aFilters = [];

			this.aFilters = this.aKeys.map(function(sCriteria, i) {
				return new Filter(sCriteria, sap.ui.model.FilterOperator.Contains, aCurrentFilterValues[i]);
			});

			return this.aFilters;
		},
		getFilterCriteria: function(aCurrentFilterValues) {
			return this.aKeys.filter(function(el, i) {
				if (aCurrentFilterValues[i] !== "") {
					return el;
				}
			});
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
		getSnappedLabel: function() {
			return new Label({
				text: "{/Filter/text}"
			});
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
							source: new ol.source.OSM(),
						})
					],
					//overlays: [overlay],  // OVERLAY
					view: new ol.View({
						center: ol.proj.fromLonLat([4.357582, 51.198185]),
						zoom: 12
					})
				});
			}
			
			// Function which will show the info of the layer that has been clicked on
			map.on("singleclick", function(e) {
				map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
					
					if(allLayers.includes(layer)) {
						// Only show a messagebox when a marker has been clicked on, timestamp is a unique property given by the marker layers
						if (feature.get('info'))
						{
							// Transform coördinates to a longitude & latitude array
							var lonlat = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
							
							// Show the converted longitude and latitude as well as the timestamp
							that.getView().byId('txtLocationInfo').setText(ol.coordinate.toStringHDMS([lonlat[0], lonlat[1]]));
							that.getView().byId('txtLocationTimestamp').setText("Timestamp: " + feature.get('info'));
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
		                name : "BATCH6",
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
			
			// Reset the info about coordination & timestamp
			that.getView().byId('txtLocationInfo').setText("");
			that.getView().byId('txtLocationTimestamp').setText("");
			
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
