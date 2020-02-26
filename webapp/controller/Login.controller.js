sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/ui/util/Storage"
], function (Controller, UIComponent, MessageBox, Storage) {
	"use strict";

	// There are variables made to store the token
	var oAuthToken;
	var oAuthTokenExpiresIn;
	var oAuthAccessCodeTokenUsername;
	
	// This is to see if the user is authenticated
	var authenticated = false;
	
	// The session storage is defined here
	var oAuthStorage = new Storage(Storage.Type.session);

	return Controller.extend("zpr.analyse.ZPR-Analyse.controller.Login", {
		onInit: function () {
			// Bind a function to this view so this will be called upon every time we route to this view
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oRouter.getRoute("RouteLogin").attachMatched(this.OAuthfunction(), this);
		},
		
		onPressOverview: function () {
			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("RouteOverview");
		},
		
		OAuthfunction : function(){
			// Make the global variable for the tokens empty
			this.oAuthToken = null;
			this.oAuthTokenExpiresIn = null;
			
			// Make the storage of the app that has been used empty
			oAuthStorage.put("oAuthToken",null);
			oAuthStorage.put("oAuthTokenExpires",null);
			oAuthStorage.put("AuthenticationLogOut","No");
			
			var beforeRealCalculatedUrl = window.location.href;
			var url = beforeRealCalculatedUrl.split("#")[1];
			if (beforeRealCalculatedUrl.split("#")[1]===undefined)
			{
				this.authenticated=false;
				//this.redirectToIncognito();
			}
			else{
				if(beforeRealCalculatedUrl.split("id_token=")[1] === undefined)
				{
					this.authenticated=false;
					this.redirectToIncognito();
				}
				else{
					var beginStringToken = url.split("id_token=")[1];
				
					var StringToken = beginStringToken.split("&token_type")[0];
				
					var beginStringAccessCode = url.split("access_token=")[1];
					var StringAccessCode = beginStringAccessCode.split("&id_token")[0];
				
				
					var StringExpiryTime = beginStringToken.split("&expires_in=")[1];
				
					this.oAuthToken = StringToken;
					this.oAuthTokenExpiresIn = StringExpiryTime;
					this.oAuthAccessCodeTokenUsername=StringAccessCode;
					
					this.authenticated = true;
				}
			}
				// If the authentication has been succeeded, then we will put it in the session storage otherwise we do nothing here
				if(this.authenticated===true)
				{
					// Here the token and the expire time is being stored in the storage as session storage
					oAuthStorage.put("oAuthToken",this.oAuthToken);
					oAuthStorage.put("oAuthTokenExpires",this.oAuthTokenExpiresIn);
					oAuthStorage.put("AuthenticatedUser","Onbekend");
					oAuthStorage.put("AuthenticatedUserRole","Researcher");
					oAuthStorage.put("AuthenticatedUserExport","Yes"); 
					oAuthStorage.put("AuthenticatedAccessToken",this.oAuthAccessCodeTokenUsername); 
				
					var oRouter = UIComponent.getRouterFor(this);
					oRouter.navTo("RouteOverview");
				}
		},
		
		redirectToIncognito: function(){
			window.location = "https://zpr-auth.auth.eu-west-1.amazoncognito.com/login?response_type=token&client_id=27sap6am2ijsqqk9hu03u1mapu&redirect_uri=https://zpranalyse-a44552055.dispatcher.hana.ondemand.com/index.html&scope=openid";	
		}
	});
});