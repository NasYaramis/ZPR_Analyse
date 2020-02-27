sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage"
], function (Controller, UIComponent, History, Header,Storage) {
	"use strict";
	
	var assets;
		
	// The session storage is defined here
	var oAuthStorage = new Storage(Storage.Type.session);
	
	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Sensors", {
		Header: new Header(this),
		
		onInit: function () {
			// Bind a function to this view so this will be called upon every time we route to this view
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteSensors").attachMatched(this.initialize, this);
		},
		
		initialize: function() {
			var locationStatus;
			var that = this;
			
			// We get the authentication token from the storage
			//var authenticationToken = oAuthStorage.get("oAuthToken");
			
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets?type=CONNECTED"; // Type = connected => these are the sensors
			
			// We pass the authentication required for the endpoint along with the call
			$.ajax({
				url: weburl,
				type: "GET",
				dataType: "json",
				success: function(dataj){
					// Declare global variables
					assets = dataj;
					
					for (var x in assets){
						var batteryLevel = assets[x].batteryLevel;
						
						// Set battery level
						assets[x].batteryLevel = Math.round(batteryLevel) + "%";
						
						// Set color of battery icon negative if the level is lower than 20
						// NOTE: might have to be changed to check on batteryStatus once implemented
						if (Math.round(batteryLevel) <= 20 ) {
							assets[x].batteryColor = "Negative";
						}
						
						// Set battery icon
						assets[x].batteryIcon = "sap-icon://" + that.getBatteryIcon(batteryLevel);
						
						// Set location satus icons & color
						locationStatus = that.getLocationStatusIcon(assets[x].locationStatus);
						if (Array.isArray(locationStatus)) {
							assets[x].locationStatusIcon = "sap-icon://" + locationStatus[0];
							assets[x].locationStatusColor = locationStatus[1];
						}
					}
					
					// Filter assets based on the assetStatus 'Active'
					var aActiveSensors = assets.filter(function (asset) {
						return asset.assetStatus === "ACTIVE"
					});
					
					// Create JSON model and set data of the active sensors
					var oModelActive = new sap.ui.model.json.JSONModel();
					oModelActive.setData(aActiveSensors);
					
					// Set new model at table from the view
					var oTableActive = that.getView().byId("sensorTableActive");
					oTableActive.setModel(oModelActive);
					
					// Set active sensor label info
					that.getView().byId("lblSensorInfoActive").setText(
						that.getView().getModel("i18n").getResourceBundle().getText("sensorInfoActive")
						+ " "
						+ aActiveSensors.length
					);
					
					// Filter assets based on the assetStatus 'Retired'
					var aRetiredSensors = assets.filter(function (asset) {
						return asset.assetStatus === "RETIRED"
					});
					
					// Create JSON model and set data of the active sensors
					var oModelRetired = new sap.ui.model.json.JSONModel();
					oModelRetired.setData(aRetiredSensors);
					
					// Set new model at table from the view
					var oTableRetired = that.getView().byId("sensorTableRetired");
					oTableRetired.setModel(oModelRetired);
					
					// Set active sensor label info
					that.getView().byId("lblSensorInfoRetired").setText(
						that.getView().getModel("i18n").getResourceBundle().getText("sensorInfoRetired")
						+ " "
						+ aRetiredSensors.length
					);
					
					// Get sticky values from table and add InfoToolbar as an extra variable
					var aStickyActive = that.getView().byId("sensorTableActive").getSticky();
					if(!aStickyActive.find(element => element === "InfoToolbar")) {
						aStickyActive.push("InfoToolbar");
					}
					
					// Set the new sticky variables at active table
					that.getView().byId("sensorTableActive").setSticky(aStickyActive);
					
					// Get sticky values from table and add InfoToolbar as an extra variable
					var aStickyRetired = that.getView().byId("sensorTableRetired").getSticky();
					if(!aStickyRetired.find(element => element === "InfoToolbar")) {
						aStickyRetired.push("InfoToolbar");
					}
					
					// Set the new sticky variables at retired table
					that.getView().byId("sensorTableRetired").setSticky(aStickyRetired);
				},
				error: function(errorstatus,statusText)  {
						// If the user is unauthorized we redirect him back to the login page
					if(errorstatus.status==401)
					{
						var urlToRedirectTo="https://zprsapresearcher-s0020962283trial.dispatcher.hanatrial.ondemand.com/index.html"
						window.location=urlToRedirectTo; 
					}
					else
					{
						// Error handling
					}
				}
			});
		},
		
		getBatteryIcon: function(batteryLevel) {
			// Add the custom battery icons
			switch (true){
				case (batteryLevel <= 0):
					return "customfont/battery-10";
				case (batteryLevel > 10 && batteryLevel <= 20):
					return "customfont/battery-20";
				case (batteryLevel > 20 && batteryLevel <= 30):
					return "customfont/battery-30";
				case (batteryLevel > 30 && batteryLevel <= 40):
					return "customfont/battery-40";
				case (batteryLevel > 40 && batteryLevel <= 50):
					return "customfont/battery-50";
				case (batteryLevel > 50 && batteryLevel <= 60):
					return"customfont/battery-60";
				case (batteryLevel > 60 && batteryLevel <= 70):
					return "customfont/battery-70";
				case (batteryLevel > 70 && batteryLevel <= 80):
					return "customfont/battery-80";
				case (batteryLevel > 80 && batteryLevel <= 90):
					return "customfont/battery-90";
				case (batteryLevel === 100):
					return "customfont/battery-100";
				default:
					return "";
			}	
		},
		
		getLocationStatusIcon: function(status) {
			switch (status) {
				case "MOVING":
					return [ "message-success", "Positive" ];
				case "STATIONARY":
					return [ "message-warning", "Critical" ];
				case "OUT_OF_ZONE":
					return [ "message-error", "Negative" ];
				default:
					return "";
			}
		},
		
		onSensorPress: function (event) {
			// Get the correlationId from the invible column
			var correlationAssetId = event.getParameters().listItem.mAggregations.cells[5].mProperties;
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({'correlationAssetId' : correlationAssetId}, true);
			
			sap.ui.getCore().setModel(oModel, "correlationAssetId");
			
			// Navigate to detail page
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("RouteDetail", {
				correlationId : correlationAssetId.text
			});
		},
		
		onNewRelease: function(){
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("RouteItemRelease");	
		}
		
		// handleChange: function (oEvent) {
		// 	var oValidatedComboBox = oEvent.getSource(),
		// 	sSelectedKey = oValidatedComboBox.getSelectedKey(),
		// 	sValue = oValidatedComboBox.getValue();
			
		// 	if (!sSelectedKey && sValue) {
		// 		oValidatedComboBox.setValueState("Error");
		// 		oValidatedComboBox.setValueStateText("Please enter a valid country!");
		// 	} else {
		// 		oValidatedComboBox.setValueState("None");
		// 	}
		// }
	});
});