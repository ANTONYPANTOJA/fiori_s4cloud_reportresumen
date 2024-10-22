sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VariantItem",
],
    function (Controller, NavigationHandler, MessageBox, MessageToast,VariantItem) {
        "use strict";

        return Controller.extend("ns.asa.zappreportinflresvf.controller.BaseController", {

            constructor: function() {
                this.sLocalContainerKey = "fin.ap.lineitems";
				this.sPrefix = "fin.ap.lineitems.display";
            },
            
            onInit: function () {
               
            this.sAppId = this.getOwnerComponent().getMetadata().getLibraryName();

            },
            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            getModel: function (object) {
                return this.getView().getModel(object);
            },		
			onAssignedFiltersChanged: function(oEvent) {
				var oFilterText = this.byId("FilterText");
				
				// If this event is fired before the onInit event of the View, the property
				// this.SmartFilterBar won't be set. Therefore we retrieve the SmartFilterBar
				// by Id instead
				var oSmartFilterBar = this.byId("SmartFilterBarMain");
				//oFilterText.setText(oSmartFilterBar.retrieveFiltersWithValuesAsText());
			},
            onShareButtonPressed: function(oEvent) {
			},
        });
    });
