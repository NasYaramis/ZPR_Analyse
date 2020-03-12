sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"zpr/analyse/ZPR-Analyse/controller/fragments/Header.controller",
	"sap/ui/util/Storage",
	"sap/ui/core/UIComponent",
	"sap/m/MessageToast"
], function (Controller, Storage, UIComponent, Header, MessageToast) {
	"use strict";
	
	// The session storage is defined here
	var oAuthStorage = new Storage(jQuery.sap.storage.Type.session);
	
	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Profile", {
		Header: new Header(this),
		
		onInit: function () {
			// Bind a function to this view so this will be called upon every time we route to this view
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteProfile").attachMatched(this.initialize(), this);
			
		},
		initialize:function(){
			var that = this;
			// if (oAuthStorage.get("oAuthToken")==null){
			// 	this.LogOut();
			// }
			// else
			// {
				if(oAuthStorage.get("AuthenticatedAccessToken")===null)
				{
					that.LogOut();
				}
				else
				{
					var AccessTokenUsername=oAuthStorage.get("AuthenticatedAccessToken");
					var localUserVariable;

					
					var data = $.ajax({
					url: "https://zpr-auth.auth.eu-west-1.amazoncognito.com/oauth2/userInfo",
					headers:{
						"Authorization": "Bearer "+AccessTokenUsername	
					},
					type: "GET",
					async:false,
					success: function(response) {
						localUserVariable=response.username;
					},
					error: function(errorThrown) {
						MessageToast.show("We wheren't able to get your username");
					}
				});
				oAuthStorage.put("AuthenticatedUser",localUserVariable);
				}
				// Get the values of the textfields where the user its data is in
				var username  = that.getView().byId("userName"); 
				var role  = that.getView().byId("userRole"); 
				var permissionExport  = that.getView().byId("userExport"); 
				
				// Check if the user is authenticated, if he is show his data that got stored.
				// If the user isn't authenticated, redirect him to the login page
				if (oAuthStorage.get("oAuthToken")===null){
					that.logOut();
				}
				else
				{
					var usernametext= oAuthStorage.get("AuthenticatedUser");
					var roletext= oAuthStorage.get("AuthenticatedUserRole");
					var permissionExportText= oAuthStorage.get("AuthenticatedUserExport");
					username.setText(usernametext);
					role.setText(roletext);
					permissionExport.setText(permissionExportText);
					
				}
			//}
		},
		onBeforeRendering: function () {
			var oModel = this.getView().getModel("data");
			this.getView().setModel(oModel);
		},
		LogOut: function () {
			// console.log("working");
			oAuthStorage.put("oAuthToken",null);
			oAuthStorage.put("oAuthTokenExpires",null);
			oAuthStorage.put("AuthenticatedUser",null);
			oAuthStorage.put("AuthenticatedUserRole",null);
			oAuthStorage.put("AuthenticatedUserExport",null); 
			oAuthStorage.put("AuthenticatedAccessToken",null); 
			oAuthStorage.put("AuthenticationLogOut","Yes");
		
			var urlToRedirectTo="https://zpranalyse-a44552055.dispatcher.hana.ondemand.com/index.html";
			window.location=urlToRedirectTo; 
		}
	});
});