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
	var activeJourney, dataPicture, physicalId, correlationAssetId;
	var oLocations, map, physicalId, oLastLocation;
	var lastLocationLayer;
	var sourceLastLocation;
	var allLayers = [];

	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Map", {
		Header: new Header(this),

		onInit: function() {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteMap").attachMatched(this.initialize, this);
		},
		
		initialize: function (oEvent) {
			var that = this;
			
			// Reset the target of the map
			// This has to be done every time we call this view as for some reason the map reference seems to disappear after routing multiple other views
			if (that.initialized) {
				map.setTarget(that.getView().byId("map_canvas").getDomRef());
			}
			
			// Set weburl
			var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets";

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
					
					//This is created to gain Type in filters
					var oSlBatchJSON = new sap.ui.model.json.JSONModel();
					var Batch = {
				            Batch : [{
				                name : "BATCH 1",
				                key  : "BATCH 1"
				            },{
				                name : "BATCH 2",
				                key  : "BATCH 2"
				            },{
				                name : "BATCH 3",
				                key  : "BATCH 3"
				            },{
				                name : "BATCH 4",
				                key  : "BATCH 4"
				            },{
				                name : "BATCH 5",
				                key  : "BATCH 5"
				            },{
				                name : "BATCH 6",
				                key  : "BATCH 6"
				            }]
				    };
			        oSlBatchJSON.setData(Batch);
					that.getView().byId("slBatch").setModel(oSlBatchJSON);
					
					//This is created to gain Type in filters
					var oSlTypeJSON = new sap.ui.model.json.JSONModel();
					var Type = {
				            Type : [{
				                name : "CONNECTED",
				                key  : "CONNECTED"
				            },{
				                name : "UNCONNECTED",
				                key  : "UNCONNECTED"
				            }]
				    };
			        oSlTypeJSON.setData(Type);
					that.getView().byId("slType").setModel(oSlTypeJSON);
					
					//This is created to gain Color in filters
					var oSlColorJSON = new sap.ui.model.json.JSONModel();
					var Color = {
				            Color : [{
				                name : "ROOD",
				                key  : "ROOD"
				            },{
				                name : "BLAUW",
				                key  : "BLAUW"
				            },{
				                name : "ZWART",
				                key  : "ZWART"
				            }]
				    };
			        oSlColorJSON.setData(Color);
					that.getView().byId("slColor").setModel(oSlColorJSON);
					
					//This is created to gain Location in filters
					var oSlLocationJSON = new sap.ui.model.json.JSONModel();
					var Location = {
				            Location : [{
				                name : "MELLE",
				                key  : "MELLE"
				            },{
				                name : "DENDERMONDE",
				                key  : "DENDERMONDE"
				            },{
				                name : "WINTAM",
				                key  : "WINTAM"
				            }]
				    };
			        oSlLocationJSON.setData(Location);
					that.getView().byId("slLocation").setModel(oSlLocationJSON);
					
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
			
			// Create JSON model and set data

			/*this.oModel = new JSONModel();
			this.oModel.loadData(sap.ui.require.toUrl("sap/ui/comp/sample/filterbar/DynamicPageListReport/model.json"), null, false);
			this.getView().setModel(this.oModel);

			this.aKeys = [
				"Name", "Category", "SupplierName"
			];
			this.oSelectName = this.getSelect("slName");
			this.oSelectCategory = this.getSelect("slCategory");
			this.oSelectSupplierName = this.getSelect("slSupplierName");
			this.oModel.setProperty("/Filter/text", "Filtered by None");
			this.addSnappedLabel();

			var oFB = this.getView().byId("filterbar");
			if (oFB) {
				oFB.variantsInitialized();
			}*/
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
			//this.getTableItems().filter(this.getFilters(aCurrentFilterValues));
			this.updateFilterCriterias(this.getFilterCriteria(aCurrentFilterValues));
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

/*		getTable: function() {
			return this.getView().byId("idProductsTable");
		},*/
/*		getTableItems: function() {
			return this.getTable().getBinding("items");
		},*/
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
		}
	});
});
