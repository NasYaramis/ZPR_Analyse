sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"zpr/analyse/ZPR-Analyse/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("zpr.analyse.ZPR-Analyse.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			// Register the custom battery icons
			// Tutorial found on https://blogs.sap.com/2015/11/02/enhance-ui5-app-with-custom-icon-fonts/
			sap.ui.core.IconPool.addIcon("battery-10","customfont", { fontFamily: "icomoon", content: "e900" });
			sap.ui.core.IconPool.addIcon("battery-20","customfont", { fontFamily: "icomoon", content: "e901" });
			sap.ui.core.IconPool.addIcon("battery-30","customfont", { fontFamily: "icomoon", content: "e902" });
			sap.ui.core.IconPool.addIcon("battery-40","customfont", { fontFamily: "icomoon", content: "e903" });
			sap.ui.core.IconPool.addIcon("battery-50","customfont", { fontFamily: "icomoon", content: "e904" });
			sap.ui.core.IconPool.addIcon("battery-60","customfont", { fontFamily: "icomoon", content: "e905" });
			sap.ui.core.IconPool.addIcon("battery-70","customfont", { fontFamily: "icomoon", content: "e906" });
			sap.ui.core.IconPool.addIcon("battery-80","customfont", { fontFamily: "icomoon", content: "e907" });
			sap.ui.core.IconPool.addIcon("battery-90","customfont", { fontFamily: "icomoon", content: "e908" });
			sap.ui.core.IconPool.addIcon("battery-100","customfont", { fontFamily: "icomoon", content: "e909" });
		}
	});
});