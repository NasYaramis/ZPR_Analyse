/* global ol:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage",
	"zpr/analyse/ZPR-Analyse/libs/ol"
], function (Controller, UIComponent, History, MessageBox, Header, Storage, oljs) {
	"use strict";

	var dataPicture, physicalId, correlationAssetId;
	var map, activeJourney, oLastLocation;
	var lastLocationLayer;
	var sourceLastLocation;
	var allLayers = [];

	// The session storage is defined here
	//var oAuthStorage = new Storage(Storage.Type.session);

	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Detail", {
		Header: new Header(this),

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ResearcherApp.RecycleFrontEndResearcherApp.view.DetailPage-Item
		 */

		onInit: function () {
			// Bind a function to this view so this will be called upon every time we route to this view
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteDetail").attachMatched(this.initialize, this);
		},

		initialize: function (oEvent) {
			var that = this;
			// We get the authentication token from the storage
			//var authenticationToken = oAuthStorage.get("oAuthToken");
			// Get the id from the URL
			correlationAssetId = oEvent.getParameter("arguments").correlationId;

			// Reset the target of the map
			// This has to be done every time we call this view as for some reason the map reference seems to disappear after routing multiple other views
			if (that.initialized) {
				map.setTarget(that.getView().byId("map_canvas").getDomRef());
			}

			// Set variables to empty which keep track of the of the active journeys
			activeJourney = "";
			oLastLocation = "";
			
			// Clear source from the last location
			if (sourceLastLocation) {
				sourceLastLocation.clear();
			}

			// Reset the entered label
			that.getView().byId("labelTitle").setText("");

			// Set weburl
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets/" + correlationAssetId;

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
					physicalId = dataj.physicalId;

					// Set physicalID as title of the page
					that.getView().byId("pageTitle").setTitle("ID: " + physicalId);

					dataj.assetJourneys.forEach(function (journey) {
						if (journey.isTravelling) {
							activeJourney = journey;

							// Show entered time and date of the object 
							if (journey.locations[0].timestamp) {
								var timestamp = journey.locations[0].timestamp.split("T");
								var date = timestamp[0].substring(0, timestamp[0].length - 1);
								var time = timestamp[1].substring(0, timestamp[1].length - 1);

								that.getView().byId("labelTitle").setText("Entered the water on " + date + " at " + time);
							}

							var assetJourneysLength = dataj.assetJourneys.length;

							if (assetJourneysLength > 0) {
								// Get both the date we need to show the total journey and the last location
								oLastLocation = dataj.assetJourneys[assetJourneysLength - 1].lastLocationData;
							}
						}
					});

					if (dataj.batteryLevel === null) {
						that.getView().byId("batteryItem").setVisible(false);
					}else that.getView().byId("batteryItem").setVisible(true);
					
					if(dataj.active === true){
						that.getView().byId("labelTravel").setText("Asset is travelling.");
					}else that.getView().byId("labelTravel").setText("Asset is NOT travelling.");

					var myArr = [];
					myArr.push(dataj);
						// Create JSON model and set data
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(myArr);

					// Set new model at table from the view
					var oList = that.getView().byId("itemList");
					oList.setModel(oModel);

					// Get the base64 from the most recent picture of the asset
					that.getPictureData();
				},
				error: function (errorstatus, statusText) {
					// If the user is unauthorized we redirect him back to the login page
				}
			}).done(function () {
				// Call the functions which will create all the layers we need to show both last location and total journey
				that.createLastLocation();
				
				// Show the last location as it's the default view
				that.showLastLocation();

				// Reset the zoom distance of the map
				map.getView().setZoom(12);
			});
		},

		createLastLocation: function () {
			if (oLastLocation) {
				// Create a marker (= feature) which references to the last location of the asset
				var marker = new ol.Feature({
					geometry: new ol.geom.Point(
						ol.proj.fromLonLat([oLastLocation.longitude, oLastLocation.latitude])
					)
				});

				// Set an extra property named timestamp so we can show the time later on when a users clicks on a marker
				marker.set('timestamp', oLastLocation.timestamp);

				// Change the style of the marker and use a custom icon
				marker.setStyle(new ol.style.Style({
					image: new ol.style.Circle({
						radius: 4,
						fill: new ol.style.Fill({
							color: '#E6600D'
						}),
						stroke: new ol.style.Stroke({
							color: [255, 0, 0],
							width: 2
						})
					})
				}));

				sourceLastLocation = new ol.source.Vector({
					features: [marker]
				});

				// Create layer based on a vector		
				var markerVectorLayer = new ol.layer.Vector({
					//source: vectorSource,
					source: sourceLastLocation
				});

				lastLocationLayer = markerVectorLayer;
				allLayers.push(lastLocationLayer);
			}
		},

		getPictureData: function () {

			// We get the authentication token from the storage
			//var authenticationToken = oAuthStorage.get("oAuthToken");

			// Set weburl
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets/" + correlationAssetId + "/downloadImage";

			// Get picture data from asset
			$.ajax({
				url: (weburl),
				type: "GET",
				dataType: "json",
				//headers:{
				//	Authorization:"Bearer "+authenticationToken	
				//},
				success: function (datap) {
					// Set the data in a global variable
					dataPicture = datap.base64;
				},
				error: function (errorstatus, statusText) {
					// If the user is unauthorized we redirect him back to the login page
				}
			});
		},

		onLastLocation: function () {
		var that = this;
			
			if(that.getView().byId("btnLastLocation").getPressed()) {
				that.showLastLocation();
			}
			else {
				that.showPicture();
			}
		},
		
		showLastLocation: function() {
			var that = this;
			
			// Set pressed state last location button to true as the total journey button has been disabled
			that.getView().byId("btnLastLocation").setPressed(true);
			that.getView().byId("btnShwPicture").setPressed(false);
			
			// Add the last location layer to the map
			map.addLayer(lastLocationLayer);
			
			// Reset the center of the map
			that.setMapCenter(oLastLocation.longitude, oLastLocation.latitude);
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
						zoom: 12
					})
				});

			}

			// Function which will show the info of the layer that has been clicked on
			map.on("singleclick", function (e) {
				map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {

					if (allLayers.includes(layer)) {
						// Only show a messagebox when a marker has been clicked on, timestamp is a unique property given by the marker layers
						if (feature.get('timestamp')) {
							// Transform coördinates to a longitude & latitude array
							var lonlat = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');

							// Show the converted longitude and latitude as well as the timestamp
							that.getView().byId('txtLocationInfo').setText(ol.coordinate.toStringHDMS([lonlat[0], lonlat[1]]));
							that.getView().byId('txtLocationTimestamp').setText("Timestamp: " + feature.get('timestamp'));
						}
					}
				});
			});
		},

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteOverview", true);
			}
		},

		convertDMS: function (lat, lng) {
			var latitude = this.toDegreesMinutesAndSeconds(lat);
			var latitudeCardinal = lat >= 0 ? "N" : "S";

			var longitude = this.toDegreesMinutesAndSeconds(lng);
			var longitudeCardinal = lng >= 0 ? "E" : "W";

			return latitude + latitudeCardinal + " " + longitude + longitudeCardinal;
		},

		toDegreesMinutesAndSeconds: function (coordinate) {
			var absolute = Math.abs(coordinate);
			var degrees = Math.floor(absolute);
			var minutesNotTruncated = (absolute - degrees) * 60;
			var minutes = Math.floor(minutesNotTruncated);
			var seconds = Math.floor((minutesNotTruncated - minutes) * 60);

			return degrees + "°" + minutes + "'" + seconds + '"';
		},
		
		onShowPicture: function() {
			var that = this;
			
			if(that.getView().byId("btnShwPicture").getPressed()) {
				that.showPicture();
			}
			else {
				that.showLastLocation();
			}
		},

		showPicture: function (event) {
			var that = this;
			
			that.getView().byId("btnShwPicture").setPressed(true);
			that.getView().byId("btnLastLocation").setPressed(false);
			
			map.removeLayer(lastLocationLayer);
			
			// Show a messagebox with the most recent picture if there is data
			if (dataPicture) {
				MessageBox.information(
					new sap.m.Image({
						src: "data:image/gif;base64," + dataPicture
					}), {
						// Add custom class to center the picture shown
						styleClass: "center",
						title: physicalId
					}
				);
			} else {
				MessageBox.information(
					that.getView().getModel("i18n").getResourceBundle().getText("noPictureInfo"), {
						title: physicalId
					}
				);
			}
		},

		setMapCenter: function (longitude, latitude) {
			// Set center a new center on the map 
			map.getView().setCenter(ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857'));
		}
	});
});