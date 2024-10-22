sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappreportinflresvf/controller/BaseController",
    "sap/m/VariantItem",
],
function (Controller,MessageBox,BaseController,VariantItem) {
    "use strict";

    return BaseController.extend("ns.asa.zappreportinflresvf.controller.ReportMain", {
        onInit: function () {

            this._oVM = this.getView().byId("SmartPageVariant");

        },
        onPostPressed: async function()
        {
            let body = {};
            const path = "/ActionLedger";
            
            body.companycode = '1100'
            body.fiscalyear = '2024';
            body.fiscalperiod = '005';
            body.glaccount = '0031000000';
            body.ledger = 'OL';

            const result = await this.createPostAction(path, body);
            if (result) {
            }
            /*
            const itemsSelected = this.getItemsTableSelected();
            if (itemsSelected.length === 0) {
                return;   
            }

            const rptaConfirm = await this.confirmPopup("TitDialog1", "msg01");
            
            if (rptaConfirm) {
            for (let index = 0; index < itemsSelected.length; index++) {
                const contextObject = itemsSelected[index].getBindingContext();
                const objectModel   = contextObject.getObject();
                    if (objectModel) {
                        body.companycode = objectModel.CompanyCode;
                        body.fiscalyear = objectModel.FiscalYear;
                        body.fiscalperiod = objectModel.FiscalPeriod;
                        body.glaccount = objectModel.GLAccount;
                        body.ledger = objectModel.Ledger;
                        try {
                            const result = await this.createPostAction(path, body);
                            if (result) {
                            }
                        } catch (error) {
                            console.error("Error Function postActionPress -" + body.glaccount, error)
                        }
                    }*/
            
        },
        onRefresh: function(){
            this.onRefreshSingle(); 
        },
        onRefreshSingle: function () {
            this.getView().getModel().refresh(true);
        },
        createPostAction: async function (path, body) {
            return new Promise(async (resolve, reject) => {
                try {
                    this.getView().getModel().create(path, body, {
                        success: function (result) {
                            resolve(result);
                        }.bind(this),
                        error: function (e) {
                            reject(false);
                        }.bind(this)
                    });
                } catch (error) {
                    reject(false);
                }
            });

        },
        confirmPopup: async function (title, msg) {
            let t = this;

            return new Promise(async (resolve, reject) => {
                MessageBox.confirm(this.getResourceBundle().getText(msg), {
                    title: this.getResourceBundle().getText(title),
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }.bind(t)
                });
            });

        },
        getResourceBundle: function(){
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        getItemsTableSelected: function () {
            return this.getView().byId("SmartTableItems").getTable().getSelectedItems();
        },
        onBeforeVariantSave: function(oEvent) {
            /*
             * When the app is started, the VariantManagement of the SmartFilterBar saves the initial state in the STANDARD (=default) variant and
             * therefore this event handler is called. We do not need to store the inner app state in this case, because it is the initial state. Only
             * for variants, saved by the user, storeForBackNavigation must be called.
             */
            if (oEvent.getParameter("context") !== "STANDARD") {
                if (this.oNavigationController) {
                    this.oNavigationController.storeForBackNavigation(); // store local state for back navigation
                }
            }
        },

    });
});
