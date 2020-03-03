sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage"
], function (Controller, JSONModel, Label, Filter, Header) {
	"use strict";

	var assets;

	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Chart", {
		Header: new Header(this),

		onInit: function () {
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteChart").attachMatched(this.initialize, this);
			this.feedData();
		},

		initialize: function (oEvent) {
			var that = this;

			//This is created to gain Batch in filters
			var oSlBatchJSON = new sap.ui.model.json.JSONModel();
			var Batch = {
				Batch: [{
					name: "CHOOSE A BATCH",
					key: "BATCH0"
				}, {
					name: "BATCH 1",
					key: "BATCH1"
				}, {
					name: "BATCH 2",
					key: "BATCH2"
				}, {
					name: "BATCH 3",
					key: "BATCH3"
				}, {
					name: "BATCH 4",
					key: "BATCH4"
				}, {
					name: "BATCH 5",
					key: "BATCH 5"
				}, {
					name: "BATCH 6",
					key: "BATCH6"
				}]
			};
			oSlBatchJSON.setData(Batch);
			that.getView().byId("slBatch").setModel(oSlBatchJSON);

			//This is created to gain Colors in filters
			var oSlColorJSON = new sap.ui.model.json.JSONModel();
			var Color = {
				Color: [{
					name: "CHOOSE A COLOR",
					key: "COLOR0"
				}, {
					name: "RED",
					key: "COLOR1"
				}, {
					name: "BLUE",
					key: "COLOR2"
				}, {
					name: "BLACK",
					key: "COLOR3"
				}]
			};
			oSlColorJSON.setData(Color);
			that.getView().byId("slColor").setModel(oSlColorJSON);

			//This is created to gain Colors in filters
			var oSlNumberJSON = new sap.ui.model.json.JSONModel();
			var Number = {
				Number: [{
					name: "CHOOSE A NUMBER",
					key: "NR0"
				}, {
					name: "11 - HIGH TIDE",
					key: "NR1"
				}, {
					name: "61 - LOW TIDE",
					key: "NR2"
				}]
			};
			oSlNumberJSON.setData(Number);
			that.getView().byId("slNumber").setModel(oSlNumberJSON);

			that.aKeys = [
				"Batch", "Color", "Number"
			];
			that.oSelectName = that.getSelect("slBatch");
			that.oSelectCategory = that.getSelect("slColor");
			that.oSelectSupplierName = that.getSelect("slNumber");
			//that.oModel.setProperty("/Filter/text", "Filtered by None");
			that.addSnappedLabel();

			var oFB = that.getView().byId("filterbar");
			if (oFB) {
				oFB.variantsInitialized();
			}
		},

		feedData: function (oEvent) {
			//		TEST DATA!!
			//      1.Get the id of the VizFrame		
			var oVizFrame = this.getView().byId("idcolumn");

			//      2.Create a JSON Model and set the data
			var oModel = new sap.ui.model.json.JSONModel();
			var data = {
				"Population": [{
					"Year": "2010",
					"Value": "158626687"
				}, {
					"Year": "2011",
					"Value": "531160986"
				}, {
					"Year": "2012",
					"Value": "915105168"
				}, {
					"Year": "2013",
					"Value": "1093786762"
				}, {
					"Year": "2014",
					"Value": "1274018495"
				}]
			};
			oModel.setData(data);

			//      3. Create Viz dataset to feed to the data to the graph
			var oDataset = new sap.viz.ui5.data.FlattenedDataset({
				dimensions: [{
					name: 'Year',
					value: "{Year}"
				}],

				measures: [{
					name: 'Population',
					value: '{Value}'
				}],

				data: {
					path: "/Population"
				}
			});
			oVizFrame.setDataset(oDataset);
			oVizFrame.setModel(oModel);
			oVizFrame.setVizType('column');

			//      4.Set Viz properties
			oVizFrame.setVizProperties({
				plotArea: {
					colorPalette: d3.scale.category20().range()
				}
			});

			var feedValueAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "valueAxis",
					'type': "Measure",
					'values': ["Population"]
				}),
				feedCategoryAxis = new sap.viz.ui5.controls.common.feeds.FeedItem({
					'uid': "categoryAxis",
					'type': "Dimension",
					'values': ["Year"]
				});
			oVizFrame.addFeed(feedValueAxis);
			oVizFrame.addFeed(feedCategoryAxis);
		},

		onSelectChange: function () {
			var aCurrentFilterValues = [];

			aCurrentFilterValues.push(this.getSelectedItemText(this.getView().byId("slBatch")));
			aCurrentFilterValues.push(this.getSelectedItemText(this.getView().byId("slColor")));
			aCurrentFilterValues.push(this.getSelectedItemText(this.getView().byId("slNumber")));

			this.filterTable(aCurrentFilterValues);
		},

		getSelect: function (sId) {
			return this.getView().byId(sId);
		},

		getSelectedItemText: function (oSelect) {
			return oSelect.getSelectedItem() ? oSelect.getSelectedItem().getKey() : "";
		},

		filterTable: function (aCurrentFilterValues) {
			//this.getTableItems().filter(this.getFilters(aCurrentFilterValues));
			this.updateFilterCriterias(this.getFilterCriteria(aCurrentFilterValues));
		},

		getFilterCriteria: function (aCurrentFilterValues) {
			return this.aKeys.filter(function (el, i) {
				if (aCurrentFilterValues[i] !== "") {
					return el;
				}
			});
		},

		updateFilterCriterias: function (aFilterCriterias) {
			this.removeSnappedLabel(); /* because in case of label with an empty text, */
			this.addSnappedLabel(); /* a space for the snapped content will be allocated and can lead to title misalignment */
			//this.oModel.setProperty("/Filter/text", this.getFormattedSummaryText(aFilterCriterias));
		},

		removeSnappedLabel: function () {
			this.getPageTitle().destroySnappedContent();
		},

		addSnappedLabel: function () {
			var oSnappedLabel = this.getSnappedLabel();
			oSnappedLabel.attachBrowserEvent("click", this.onToggleHeader, this);
			this.getPageTitle().addSnappedContent(oSnappedLabel);
		},

		getPage: function () {
			return this.getView().byId("dynamicPageId");
		},
		getPageTitle: function () {
			return this.getPage().getTitle();
		},

		getSnappedLabel: function () {
			return new Label({
				text: "{/Filter/text}"
			});
		}
	});
});