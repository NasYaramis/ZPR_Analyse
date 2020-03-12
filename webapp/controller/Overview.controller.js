sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage"
], function (Controller, UIComponent, History, Header,Storage) {
	"use strict";
	
	var assets, assetsOrigin, assetsSlicedLength;
	var smart = [];
	var dummy = [];
	var clicks = 1;
	var paginationDivisor = 100; // variable which indicates the number of records shown per table page

	// The session storage is defined here
	//var oAuthStorage = new Storage(Storage.Type.session);
	
	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Overview", {
		Header: new Header(this),
		
		onInit: function () {
			var that = this;
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets";
			
			$.ajax({
				url: weburl,
				type: "GET",
				dataType: "json",
				success: function(dataj){
					// Declare global variables
					assets = dataj;
					assetsSlicedLength = Math.ceil(dataj.length / paginationDivisor);
					
					// Split time and date variables
					var timestamp, aDate, aTime;

					
					//Hier zal de onderscheidt tussen slimme en dummy assets gebeuren.
					for(var x in assets){
						if(assets[x].connectivityStatus !== null){
							smart.push(assets[x]);
						}else dummy.push(assets[x]);
					}
					
					for (var y in assets) {
						// Split time and date from lastLocationTime
						timestamp = assets[y].lastLocationTime.split(" ");
						aDate = timestamp[0].substring(0, timestamp[0].length).split("-");
						aTime = timestamp[1].substring(0, timestamp[1].length - 1).split(":");
						
						assets[y].time = (aTime[0] + ":" + aTime[1] + " " + aDate[2] + "/" + aDate[1] + "/" + aDate[2]);
					}
					
					// Set origin assets
					assetsOrigin = dummy;
					dataj = dummy;
					
					// Create JSON model and set data
					var oModel = new sap.ui.model.json.JSONModel();
					//oModel.loadData(test6);
					oModel.setData(dataj);
					
					// Set model size to lenght of the given data as m.Table default only supports 100 rows
					//oModel.setSizeLimit(dataj.length);
					
					// Set new model at table from the view
					var oTable = that.getView().byId("overviewTable");
					oTable.setModel(oModel);
					
					// Set pagination info
					that.setPaginationInfo();
				},
				error: function(errrorstatus,statusText) {
					// If the user is unauthorized we redirect him back to the login page
					/*if(errorstatus.status==401)
					{
						var urlToRedirectTo="https://zprsapresearcher-s0020962283trial.dispatcher.hanatrial.ondemand.com/index.html"
						window.location=urlToRedirectTo; 
					}
					else
					{
						// Disable & show 'previous' pagination button
						that.getView().byId("nextButton").setVisible(false);
						that.getView().byId("previousButton").setVisible(false);
					}*/
				}
			});
		},
		
		onNext: function(oEvt) {
			var that = this;
			
			if (clicks >= 0 && clicks < assetsSlicedLength) {
				// Create JSON model
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(assets.slice(clicks * paginationDivisor, (clicks + 1) * paginationDivisor));
				
				// Set new model at table from the view
				var oTable = that.getView().byId("overviewTable");
				oTable.setModel(oModel);
				
				// Enable & show 'previous' pagination button
				that.getView().byId("previousButton").setEnabled(true);
				that.getView().byId("previousButton").setVisible(true);
				
				// Set pagination info
				if ((clicks + 1) >= assetsSlicedLength) {
					that.getView().byId("paginationInfo").setText(((clicks * paginationDivisor) + 1) + "-" + assets.length+ " / " + assets.length);
				}
				else {
					that.getView().byId("paginationInfo").setText(((clicks * paginationDivisor) + 1) + "-" + ((clicks + 1) * paginationDivisor) + " / " + assets.length);
				}
				
				// Increment clicks as the 'next' pagination button has been clicked on
				clicks += 1;
				
				// Scroll back to the top of the table
				var oScrollContainer = this.getView().byId("scrollBarOverview");
				oScrollContainer.scrollTo(0,0);  
			}
			
			if (clicks >= (assetsSlicedLength)) {
				// Disable 'next' pagination  button
				oEvt.getSource().setEnabled(false);
				oEvt.getSource().setVisible(false);
			}
		},
		
		onPrevious: function(oEvt) {
			var that = this;
			
			if (clicks > 0) {
				// Create JSON model
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(assets.slice((clicks -  2) * paginationDivisor, (clicks - 1) * paginationDivisor));
				
				// Set new model at table from the view
				var oTable = that.getView().byId("overviewTable");
				oTable.setModel(oModel);
				
				// Enable & show 'next' pagination button
				that.getView().byId("nextButton").setEnabled(true);
				that.getView().byId("nextButton").setVisible(true);
				
				// Set pagination info
				that.getView().byId("paginationInfo").setText((((clicks - 2) * paginationDivisor) + 1) + "-" + ((clicks - 1) * paginationDivisor) + " / " + assets.length);
				
				// Decrement clicks as the 'previous' pagination button has been clicked on
				clicks -= 1;
				
				// Scroll back to the top of the table
				var oScrollContainer = this.getView().byId("scrollBarOverview");
				oScrollContainer.scrollTo(0,0);  
			}
			
			if (clicks <= 1)
			{
				// Disable 'previous' pagination button
				oEvt.getSource().setEnabled(false);
				oEvt.getSource().setVisible(false);
			}
		},
		
		onSearch: function(evt) {
			var that = this;
			var value = evt.getSource().getValue();
			
			// Create JSON model
			var oModel = new sap.ui.model.json.JSONModel();
			
			if (value === "" && assetsOrigin) {
				// We want the assets set to those of the original AJAX call as the user requests to see all assets
				assets = assetsOrigin;
				
				// Assign assets to the model
				oModel.setData(assets);
				
				// Reset pagination lenght & clicks 
				assetsSlicedLength = Math.ceil(assets.length / paginationDivisor);
				clicks = 1;
				
				// Set new model at table from the view
				var oTable = that.getView().byId("overviewTable");
				oTable.setModel(oModel);
				
				// Reset pagination info & buttons
				that.setPaginationInfo();
			}
			else if (value && assetsOrigin)
			{
				// Filter the assets based on the given searchfield value
				var assetsResult = assetsOrigin.filter(function(asset) {
					return (asset.physicalId.includes(value) ? asset.physicalId : "" );
				});
				
				// Filter the assets based on the given searchfield value
				//var assetsResult = assetsOrigin.find(x => x.physicalId == value);
				
				// If the result from filtering is array => set data directly in the model, 
				// otherwise set JSON result in array first
				if(Array.isArray(assetsResult)) 
				{
					oModel.setData(assetsResult);
					
					// Update assets
					assets = assetsResult;
				}
				else 
				{
					var arrayResult = [];
					arrayResult.push(assetsResult);
					oModel.setData(arrayResult);
					
					// Update assets
					assets = arrayResult;
				}
				
				// Set new model at table from the view
				oTable = that.getView().byId("overviewTable");
				oTable.setModel(oModel);
				
				// Reset pagination lenght & clicks
				assetsSlicedLength = Math.ceil(assets.length / paginationDivisor);
				clicks = 1;
				
				// Reset pagination info & buttons
				that.setPaginationInfo();
			} 
			else 
			{
				sap.m.MessageToast.show("Please set a filter");
			}
		},
		
		setPaginationInfo: function() {
			var that = this;
			
			// Disable & hide previous pagination button
			that.getView().byId("previousButton").setEnabled(false);
			that.getView().byId("previousButton").setVisible(false);
			
			// Disable next pagination button if there are less than the divisor variable
			if (assetsSlicedLength <= 1) {
				that.getView().byId("nextButton").setEnabled(false);
				that.getView().byId("nextButton").setVisible(false);
				
				// Set pagination info (< divisor variable)
				if (assetsSlicedLength === 0 ) {
					// No results to show
					that.getView().byId("paginationInfo").setText(0 + "-" + assets.length + " / " + assets.length);
				}
				else {
					that.getView().byId("paginationInfo").setText((((clicks - 1) * paginationDivisor) + 1) + "-" + assets.length + " / " + assets.length);
				}
			}
			else {
				// Set pagination info (> divisor variable)
				that.getView().byId("paginationInfo").setText((((clicks - 1) * paginationDivisor) + 1) + "-" + (clicks * paginationDivisor) + " / " + assets.length);
				
				// Enable & show 'next' pagination button
				that.getView().byId("nextButton").setEnabled(true);
				that.getView().byId("nextButton").setVisible(true);
			}
		},
		
		onItemPress: function (event) {
			var correlationAssetId = event.getParameters().listItem.mAggregations.cells[5].mProperties;
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({'correlationAssetId' : correlationAssetId}, true);
			
			sap.ui.getCore().setModel(oModel, "correlationAssetId");
			
			// Navigate to detail page
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("RouteDetail", {
				correlationId : correlationAssetId.text
			});
		}
	});
});