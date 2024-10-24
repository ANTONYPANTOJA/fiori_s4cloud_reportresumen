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
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            getModel: function (object) {
                return this.getView().getModel(object);
            },
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
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
            showBusyText: function (idText) {

                const model = this.getModel('model');
                model.setProperty("/load/message", this.getResourceBundle().getText(idText));

                if (!this._BusyFragment) {
                    this._BusyFragment = sap.ui.xmlfragment("ns.asa.zappreportinflresvf.view.fragments.busy", this);
                    this.getView().addDependent(this._BusyFragment);
                }

                this._BusyFragment.open();
            },
            hideBusyText: function () {
                if (this._BusyFragment)
                    this._BusyFragment.close();
            },
            onDisplayMessageBoxPress: function (type, idText) {
                let oboundle = this.getResourceBundle();
                switch (type) {
                    case 'E':
                        MessageBox.error(oboundle.getText(idText));
                        break;
                    case 'C':
                        MessageBox.confirm(oboundle.getText(idText));
                        break;
                    case 'I':
                        MessageBox.information(oboundle.getText(idText));
                        break;
                    case 'S':
                        MessageBox.success(oboundle.getText(idText));
                        break;
                    default:
                        break;
                }

            },
        });
    });
