sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappreportinflresvf/controller/BaseController",
    "sap/m/VariantItem",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
],
    function (Controller, MessageBox, BaseController, VariantItem, JSONModel, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("ns.asa.zappreportinflresvf.controller.ReportMain", {
            onInit: function () {

                this._oVM = this.getView().byId("SmartPageVariant");
                //Inicializar Modelos
                this.initModels();

            },
            initModels: function () {
                const bundle = this.getResourceBundle();
                const model = new JSONModel({
                    messages: [],
                    load: {
                        message: bundle.getText("loadmsg")
                    },
                    log: [],
                    idSession: ""
                });
                this.setModel(model, "model");
            },
            onPostPressed: async function () {
                let flagProcess = false;
                let logData = [];
                let body = {};

                const oModelData = this.getModel("model");
                const path = "/ActionLedger"
                const table = this.getView().byId("SmartTableItems").getTable();
                const tableRows = table.getRows();
                const tableSelectedIndices = table.getSelectedIndices();

                if (oModelData) {
                    oModelData.setProperty("/log", []);
                }

                if (tableSelectedIndices.length == 0) {
                    this.onDisplayMessageBoxPress('E', 'msg02');
                    return;
                } else {

                    const rptaConfirm = await this.confirmPopup("TitDialog1", "msg01");

                    if (rptaConfirm) {

                        this.showBusyText("loadmsgPo");

                        for (let index = 0; index < tableSelectedIndices.length; index++) {

                            const indice = tableSelectedIndices[index];
                            const filterResults = tableRows[indice];
                            const contextObject = filterResults.getBindingContext();
                            const objectModel = contextObject.getObject();

                            if (objectModel) {
                                //Validar Importe
                                if (objectModel.AmountInCompanyCodeCurrency == "0.00" || objectModel.AmountInCompanyCodeCurrency == "0"
                                    || objectModel.AmountInCompanyCodeCurrency == undefined || objectModel.AmountInCompanyCodeCurrency == null
                                ) {
                                    this._set_LogItems(objectModel, logData, 'E', true);
                                } else {
                                    if (objectModel.FlagExecute == 'X') {
                                        //Llamar al servicio detallado para actualizar los items a procesar
                                        const rptaOdataDet = await this._getDataDetallado(objectModel);

                                        body.companycode = objectModel.CompanyCode;
                                        body.fiscalyear = objectModel.FiscalYear;
                                        body.fiscalperiod = objectModel.FiscalPeriod;
                                        body.glaccount = objectModel.GLAccount;
                                        body.AmountInCompanyCodeCurrency = parseFloat(objectModel.AmountInCompanyCodeCurrency).toFixed(2);
                                        body.ledger = objectModel.Ledger;
                                        body.CentroCosto = objectModel.CentroCosto;
                                        body.CompanyCodeCurrency = objectModel.CompanyCodeCurrency;
                                        body.CtaDebe = objectModel.CtaDebe;
                                        body.CtaHaber = objectModel.CtaHaber;
                                        body.FechaAjust = objectModel.FechaAjust;
                                        //                      body.saldInitial = parseFloat(objectModel.saldInitial).toFixed(2);
                                        body.ImporteAjust = parseFloat(objectModel.ImporteAjust).toFixed(2);
                                        try {
                                            const result = await this.createPostAction(path, body);
                                            if (result) {
                                                //this._set_LogItems(objectModel, logData, 'S');
                                                flagProcess = true;

                                                //verificar Respuesta del Message ASYNC - INSERT 12.05.2025 {
                                                let idreference = "MSG_" + body.companycode + body.fiscalyear + "0" + body.fiscalperiod + "-" + body.glaccount;
                                                let rptaAsync = false;
                                                while (rptaAsync === false) {
                                                    const resultRptaAsync = await this._getLogRptaAsync(idreference);
                                                    if (resultRptaAsync.length > 0) {
                                                        const rptaLog = resultRptaAsync[0];
                                                        if (rptaLog.Accountingdocument != "" && rptaLog.Accountingdocument != null && rptaLog.Accountingdocument != undefined
                                                            && rptaLog.Accountingdocument != "0" != rptaLog.Accountingdocument != "0000000000" ) {
                                                            for (let index = 0; index < rptaLog.to_LogItemsJe.results.length; index++) {
                                                                const element = rptaLog.to_LogItemsJe.results[index];
                                                                if (element.Severitycode == "1") {
                                                                    logData.push({ GLAccount: objectModel.GLAccount, InflorigText: objectModel.InflorigText, Status: 'S', messageLog: element.Note });
                                                                }
                                                            }
                                                        } else {
                                                            for (let index = 0; index < rptaLog.to_LogItemsJe.results.length; index++) {
                                                                const element = rptaLog.to_LogItemsJe.results[index];
                                                                if (element.Severitycode == "3") {
                                                                    logData.push({ GLAccount: objectModel.GLAccount, InflorigText: objectModel.InflorigText, Status: 'E', messageLog: element.Note });
                                                                }
                                                            }
                                                        }
                                                        rptaAsync = true;
                                                    } else {
                                                        rptaAsync = false;
                                                    }
                                                }
                                                // INSERT 12.05.2025 }                                                                                                    
                                            }
                                        } catch (error) {
                                            console.error("Error Function postActionPress -" + body.glaccount, error)
                                        }
                                    } else {
                                        this._set_LogItems(objectModel, logData, 'E');
                                    }
                                }
                            }
                        }
                        this.hideBusyText();
                        if (flagProcess) {
                            this.onRefreshSingle();
                        }

                        //Mostrar Log
                        oModelData.setProperty("/log", logData);
                        this.showLog();
                    }
                }
            },
            _getDataDetallado: function (object) {
                const odataModel = this.getView().getModel("modelOdataDet");
                const path = '/ZreportInfAccDet';
                let parameters = { filters: [] };

                parameters.filters.push(new Filter("CompanyCode", "EQ", object.CompanyCode));
                parameters.filters.push(new Filter("FiscalYear", "EQ", object.FiscalYear));
                parameters.filters.push(new Filter("FiscalPeriod", "EQ", object.FiscalPeriod));
                parameters.filters.push(new Filter("GLAccount", "EQ", object.GLAccount));
                parameters.filters.push(new Filter("FlgFilter", "EQ", "X")); //+

                try {
                    return this.readEntity(odataModel, path, parameters);
                } catch (error) {
                    console.error("Error en la función _getDataDetallado", error);
                }
            },
            _getLogRptaAsync: async function (idreference) {
                const odataModel = this.getView().getModel();
                const path = '/LogAsyncJe';
                let parameters = { filters: [], urlParameters: { "$expand": "to_LogItemsJe" } };

                parameters.filters.push(new Filter("IdReference", "EQ", idreference));

                try {
                    const rptaDetail = await this.readEntity(odataModel, path, parameters);
                    if (rptaDetail) {
                        return rptaDetail.results;
                    }
                } catch (error) {
                    console.error("Error en la función _getLogRptaAsync", error);
                }
            },
            _set_LogItems: function (datos, logData, status, montoCero) {
                let mensaje = "";
                //FlagExecute,FlagIndicador,FlagProcess
                if (status == 'E') {

                    if (montoCero) {
                        mensaje = this.getResourceBundle().getText("errorCero");
                        logData.push({ GLAccount: datos.GLAccount, InflorigText: datos.InflorigText, Status: 'E', messageLog: mensaje });
                        return
                    }
                    if (datos.FlagIndicador == '' || datos.FlagIndicador == undefined) {
                        mensaje = this.getResourceBundle().getText("errorIndic");
                        logData.push({ GLAccount: datos.GLAccount, InflorigText: datos.InflorigText, Status: 'E', messageLog: mensaje });
                    } else {
                        if (datos.FlagProcess == 'X' || datos.AccountingDocument !== "" || datos.AccountingDocument !== undefined) { //+@MODIFY 12.06.2025
                            mensaje = this.getResourceBundle().getText("errorProcess");
                            logData.push({ GLAccount: datos.GLAccount, InflorigText: datos.InflorigText, Status: 'E', messageLog: mensaje });
                        }
                    }
                } else if (status == 'S') {
                    mensaje = this.getResourceBundle().getText("okEnvio");
                    logData.push({ GLAccount: datos.GLAccount, InflorigText: datos.InflorigText, Status: 'S', messageLog: mensaje });
                }
            },
            onRefresh: function () {
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
            readEntity: function (odataModel, path, parameters) {
                return new Promise(async (resolve, reject) => {
                    odataModel.read(path, {
                        filters: parameters.filters,
                        urlParameters: parameters.urlParameters,
                        success: resolve,
                        error: reject
                    });
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
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            getItemsTableSelected: function () {
                return this.getView().byId("SmartTableItems").getTable().getSelectedItems();
            },
            onBeforeVariantSave: function (oEvent) {
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
            formatAvailableToIcon: function (status) {
                if (status == 'E') {
                    return "sap-icon://status-error";
                } else if (status == 'S') {
                    return "sap-icon://message-success";
                } else {
                    return "";
                }
            },
            formatAvailableToObjectState: function (status) {
                if (status == 'E') {
                    return "Error";
                } else if (status == 'S') {
                    return "Success";
                } else {
                    return "None";
                }
            },
            handleClose: function () {
                this.onRefresh();
            }

        });
    });
