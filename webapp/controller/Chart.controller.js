sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/UIComponent",
		"sap/ui/core/routing/History",
		"sap/m/MessageBox",
		"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
		"sap/ui/util/Storage"
	],
	function (Controller, UIComponent, History, MessageBox, Header, Storage) {
		"use strict";
		var weburl = "https://eks.ordina-jworks.io/zpr-bff/assets";
		var assets;

		
		$.ajax({
				url: weburl,
				type: "GET",
				dataType: "json",
				success: function(dataj){
					// Declare global variables
					assets = dataj;
					
					// Create JSON model and set data
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(assets);
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


	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Chart", {
		Header: new Header(this),
			_constants: {
				sampleName: "sap.suite.ui.commons.sample.ChartContainerCustomIconsOneChart",
				chartContainerId: "chartContainer",
				contentSwitchButtonId: "customIcon1",
				vizFrame: {
					id: "vizFrame",
					modulePath: "/ChartContainerData1.json",
					dataset: {
						dimensions: [{
							name: 'Country',
							value: "{Country}"
						}],
						measures: [{
							name: 'Profit',
							value: '{profit}'
						}],
						data: {
							path: "/businessData"
						}
					},
					analysisObjectProps: {
						uid: "Country",
						type: "Dimension",
						name: "Country"
					},
					type: "column",
					feedItems: [{
						'uid': "primaryValues",
						'type': "Measure",
						'values': ["Profit"]
					}, {
						'uid': "axisLabels",
						'type': "Dimension",
						'values': []
					}]
				},
				table: {
					icon: "sap-icon://table-chart",
					title: "Table",
					modulePath: "/ChartContainerData.json",
					itemBindingPath: "/businessData",
					columnLabelTexts: ["Sales Month", "Marital Status", "Customer Gender", "Sales Quarter", "Cost", "Unit Price", "Gross Profit",
						"Sales Revenue"
					],
					templateCellLabelTexts: ["{Sales_Month}", "{Marital Status}", "{Customer Gender}", "{Sales_Quarter}", "{Cost}", "{Unit Price}",
						"{Gross Profit}", "{Sales Revenue}"
					]
				},
				dimensionSelectors: [{
					id: "dimensionSelector1",
					items: ["BATCH 1", "BATCH 2", "BATCH 3","BATCH 4","BATCH 5", "BATCH 6"]
				}, {
					id: "dimensionSelector2",
					items: ["ROOD", "BLAUW", "ZWART"]
				}, {
					id: "dimensionSelector3",
					items: ["I", "II", "III"]
				}],
				customIcons: [{
					id: "customIcon1",
					src: "sap-icon://table-chart",
					tooltip: "Custom Table Content",
					pressMessage: "custom-table custom icon pressed: "
				}, {
					id: "customIcon2",
					src: "sap-icon://accept",
					tooltip: "Accept",
					pressMessage: "accept custom icon pressed: "
				}, {
					id: "customIcon3",
					src: "sap-icon://activity-items",
					tooltip: "Activity Items",
					pressMessage: "activity-items custom icon pressed: "
				}]
			},
			/**
			 * Changeable properties depending on the app's state.
			 *
			 * @private
			 * @property {String[]} chartContainerId Id of the chart container
			 * @property {sap.suite.ui.commons.ChartContainer} chartContainer Chart container object
			 * @property {Object} content Chart container content object
			 * @property {Object} content.chart Chart container content chart object
			 * @property {Object} content.table Chart container content table object
			 */
			_state: {
				chartContainer: null,
				content: {
					chart: null,
					table: null
				}
			},
			/* ============================================================ */
			/* Life-cycle Handling                                          */
			/* ============================================================ */
			/**
			 * Method called when the application is initalized.
			 *
			 * @public
			 */
			onInit: function () {
				this._oRouter = this.getOwnerComponent().getRouter();
				this._oRouter.getRoute("RouteChart").attachMatched(this.initialize, this);
			},
			
			initialize: function (oEvent) {
			var that = this;
				var oVizFrameConstants = that._constants.vizFrame;
				var oAnalysisObject = new sap.viz.ui5.controls.common.feeds.AnalysisObject(oVizFrameConstants.analysisObjectProps);
				var aValues = oVizFrameConstants.feedItems[1].values;
				if (aValues.length === 0) {
					aValues.push(oAnalysisObject);
				}

				// store chart container in the state property and create table content
				that._state.chartContainer = that.getView().byId(this._constants.chartContainerId);
				that._state.content.table = that._createContent();

				that._addDimensionSelectorItems(that._constants.dimensionSelectors);
				that._updateCustomIcons(that._constants.customIcons);

				var oVizFrame = that.getView().byId(that._constants.vizFrame.id);
				that._updateVizFrame(oVizFrame);
			},
			/* ============================================================ */
			/* Helper Methods                                               */
			/* ============================================================ */
			/**
			 * Created table content for the chart container, with the given path to the data.
			 *
			 * @private
			 */
			_createContent: function () {
				var oVizFramePath = jQuery.sap.getModulePath(this._constants.sampleName, this._constants.table.modulePath);
				var oVizFrameModel = new sap.ui.model.json.JSONModel(oVizFramePath);
				var oTableConfig = this._constants.table;
				var oTable = new sap.m.Table({
					width: "100%",
					fixedLayout: true,
					columns: this._createTableColumns(oTableConfig.columnLabelTexts)
				});
				var oTableItemTemplate = new sap.m.ColumnListItem({
					type: sap.m.ListType.Active,
					cells: this._createLabels(oTableConfig.templateCellLabelTexts)
				});

				oTable.bindItems(oTableConfig.itemBindingPath, oTableItemTemplate, null, null);
				oTable.setModel(oVizFrameModel);

				return new sap.suite.ui.commons.ChartContainerContent({
					icon: oTableConfig.icon,
					title: oTableConfig.title,
					content: oTable
				});
			},
			/**
			 * Calls the method to add the dimension selector for each of the passed selectors.
			 *
			 * @private
			 * @param {sap.m.Select[]} dimensionSelectors Dimension selectors
			 */
			_addDimensionSelectorItems: function (dimensionSelectors) {
				for (var i = 0; i < dimensionSelectors.length; i++) {
					this._addDimensionSelectorItem(i, dimensionSelectors[i]);
				}
			},
			/**
			 * Calls the method to create a select item for each of the selector's items and adds it to the select element.
			 *
			 * @private
			 * @param {Int} index Index of the dimension selector
			 * @param {sap.m.Select} dimensionSelector Dimension selector
			 */
			_addDimensionSelectorItem: function (index, dimensionSelector) {
				var oItem;
				var oSelect = this.getView().byId(dimensionSelector.id);
				for (var i = 0; i < dimensionSelector.items.length; i++) {
					oItem = this._createSelectItem(index, dimensionSelector.items[i]);
					oSelect.addItem(oItem);
				}
			},
			/**
			 * Returns a new instance of sap.ui.core.Item given the specified key and text.
			 *
			 * @private
			 * @param {String} key Item key
			 * @param {String} text Item text
			 */
			_createSelectItem: function (key, text) {
				return new sap.ui.core.Item({
					key: key,
					text: text
				});
			},
			/**
			 * Calls update icon method for each of the passed custom icons.
			 *
			 * @private
			 * @param {sap.ui.core.Icon[]} icons Custom icons
			 */
			_updateCustomIcons: function (icons) {
				for (var i = 0; i < icons.length; i++) {
					this._updateIcon(icons[i]);
				}
			},
			/**
			 * Adds all the necessary properties to the given icon.
			 *
			 * @private
			 * @param {sap.ui.core.Icon} icon Custom icon
			 */
			_updateIcon: function (icon) {
				var fnOnPress;
				var oIcon = this.getView().byId(icon.id);
				var sIconPressMessage = icon.pressMessage + icon.id;

				oIcon.setSrc(icon.src);
				oIcon.setTooltip(icon.tooltip);

				if (icon.id === this._constants.contentSwitchButtonId) {
					fnOnPress = this._switchContent;
				} else {
					fnOnPress = this._showMessageToast;
				}

				oIcon.attachPress(fnOnPress.bind(this, sIconPressMessage));
			},
			/**
			 * Calls the message toast show method with the given message.
			 *
			 * @private
			 * @param {String} message Message for message toast
			 */
			_showMessageToast: function (message) {
				sap.m.MessageToast.show(message);
			},
			/**
			 * Switched between chart and table data content.
			 *
			 * @private
			 * @param {String} message Message for message toast
			 */
			_switchContent: function (message) {
				var oSelectedContent = this._state.chartContainer.getSelectedContent();

				this._showMessageToast(message);

				// if it's the first time, save the chart's reference and switch to the table
				if (!this._state.content.chart) {
					this._state.content.chart = oSelectedContent;
					this._state.chartContainer.switchChart(this._state.content.table);

					return;
				}

				if (oSelectedContent === this._state.content.table) {
					this._state.chartContainer.switchChart(this._state.content.chart);
				} else {
					this._state.chartContainer.switchChart(this._state.content.table);
				}
			},
			/**
			 * Updates the Viz Frame with the necessary data and properties.
			 *
			 * @private
			 * @param {sap.viz.ui5.controls.VizFrame} vizFrame Viz Frame to update
			 */
			_updateVizFrame: function (vizFrame) {
				var oVizFrame = this._constants.vizFrame;
				var oDataset = new sap.viz.ui5.data.FlattenedDataset(this._constants.vizFrame.dataset);
				var oVizFramePath = jQuery.sap.getModulePath(this._constants.sampleName, oVizFrame.modulePath);
				var oModel = new sap.ui.model.json.JSONModel(oVizFramePath);

				vizFrame.setDataset(oDataset);
				vizFrame.setModel(oModel);
				this._addFeedItems(vizFrame, oVizFrame.feedItems);
				vizFrame.setVizType(oVizFrame.type);
			},
			/**
			 * Adds the passed feed items to the passed Viz Frame.
			 *
			 * @private
			 * @param {sap.viz.ui5.controls.VizFrame} vizFrame Viz Frame to add feed items to
			 * @param {Object[]} feedItems Feed items to add
			 */
			_addFeedItems: function (vizFrame, feedItems) {
				for (var i = 0; i < feedItems.length; i++) {
					vizFrame.addFeed(new sap.viz.ui5.controls.common.feeds.FeedItem(feedItems[i]));
				}
			},
			/**
			 * Creates table columns with labels as headers.
			 *
			 * @private
			 * @param {String[]} labels Column labels
			 * @returns {sap.m.Column[]} Array of columns
			 */
			_createTableColumns: function (labels) {
				var aLabels = this._createLabels(labels);

				return this._createControls(sap.m.Column, "header", aLabels);
			},
			/**
			 * Creates label control array with the specified texts.
			 *
			 * @private
			 * @param {String[]} labelTexts text array
			 * @returns {sap.m.Column[]} Array of columns
			 */
			_createLabels: function (labelTexts) {
				return this._createControls(sap.m.Label, "text", labelTexts);
			},
			/**
			 * Creates an array of controls with the specified control type, property name and value.
			 *
			 * @private
			 * @param {sap.ui.core.control} control Control type to create
			 * @param {String} prop Property name
			 * @param {Array} propValues Value of the control's property
			 * @returns {sap.ui.core.control[]} array of the new controls
			 */
			_createControls: function (control, prop, propValues) {
				var aControls = [];

				var oProps = {};
				for (var i = 0; i < propValues.length; i++) {
					oProps[prop] = propValues[i];
					aControls.push(new control(oProps));
				}

				return aControls;
			}
		});
	});