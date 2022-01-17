/* NODE-RED-CONTRIB-SNAP4CITY-USER
   Copyright (C) 2018 DISIT Lab http://www.disit.org - University of Florence

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as
   published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. */
module.exports = function (RED) {

    function isGoodFormat(x) {
        val = 'True'
        console.log(x !== 'undefined')
        if (typeof x !== 'undefined') {
            for (i = 0; i < x.length; i++) {

                if (typeof x[i] !== 'string' || typeof x[i] === 'undefined') {
                    val = 'False'
                }
            }
        } else {
            val = 'False'
        }
        return val
    }


    function isGoodFormatWeek(xD) {
        val = 'True'
        //console.log(x !== 'undefined')
        tD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for (itD = 0; itD < 7; itD++) {
            if (typeof tD[itD] !== 'undefined') {
                x = xD[tD[itD]];
                if (typeof x !== 'undefined') {
                    for (i = 0; i < x.length; i++) {
                        console.log("Primo")
                        console.log(x[i])
                        if (typeof x[i] !== 'string' || typeof x[i] === 'undefined') {
                            val = 'False'
                            break
                        }
                    }
                }
            } else {
                val = 'False'
                break
            }
            console.log(itD)
        }
        return val
    }



    function SaveTypicalTimeTrend(config) {

        RED.nodes.createNode(this, config);
        var node = this;
        var msgs = new Object();
        node.on('input', function (msg) {
            var s4cUtility = require("./snap4city-utility.js");
            var uid = s4cUtility.retrieveAppID(RED);
            var responseFromApi = (msg.payload);
            var serviceUri = (msg.payload.serviceUri ? msg.payload.serviceUri : config.serviceUri);
            var deviceName = (msg.payload.deviceName ? msg.payload.deviceName : config.deviceName);
            var valueName = (msg.payload.valueName ? msg.payload.valueName : config.valueName);
            var valueUnit = (msg.payload.valueUnit ? msg.payload.valueUnit : config.valueUnit);
            var referenceDate = (msg.payload.referenceDate ? msg.payload.referenceDate : config.referenceDate);
            var numberOfPeriods = (msg.payload.numberOfPeriods ? msg.payload.numberOfPeriods : config.numberOfPeriods);
            var from = (msg.payload.from ? msg.payload.from : config.from);
            var to = (msg.payload.to ? msg.payload.to : config.to);
            var trendType = (msg.payload.trendType ? msg.payload.trendType : config.trendType);
            var computationType = (msg.payload.computationType ? msg.payload.computationType : config.computationType);
            console.log(typeof msg.payload.typicalMonthWeek);
            console.log(msg.payload.typicalMonthWeek);

            if (responseFromApi) {
                var accessToken = "";
                node.s4cAuth = RED.nodes.getNode(config.authentication);
                var uri = (node.s4cAuth.domain ? node.s4cAuth.domain : (RED.settings.typicalTrendsUrl ? RED.settings.typicalTrendsUrl : (RED.settings.ascapiUrl ? RED.settings.ascapiUrl : "https://servicemap.km4city.org/"))) + "ServiceMap/api/v1/values/typicaltrends";
                accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
                //console.log("Url " + uri);

                if (accessToken != "" && typeof accessToken != "undefined") {
                    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open("POST", encodeURI(uri + "?sourceRequest=iotapp&accessToken=" + accessToken), true);
                    //console.log(encodeURI(uri + "?sourceRequest=iotapp"));
                    xmlHttp.setRequestHeader("Content-Type", "application/json");
                    xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);

                    var parameters = {
                        "serviceUri": serviceUri,
                        "deviceName": deviceName,
                        "valueName": valueName,
                        "valueUnit": valueUnit,
                        "referenceDate": referenceDate,
                        "numberOfPeriods": numberOfPeriods,
                        "from": from,
                        "to": to,
                        "trendType": trendType,
                        "computationType": computationType
                    };

                    if (trendType == "monthDay") {
                        formatJson = isGoodFormat(msg.payload.typicalMonthD);
                        if (formatJson === 'False') {
                            node.error("Error in the Json format. Not all items are empty strings or float strings");
                        }

                        var values = {
                            "typicalMonthD": msg.payload.typicalMonthD
                        };
                    } else if (trendType == "monthWeek") {
                        formatJson = isGoodFormat(msg.payload.typicalMonthWeek);
                        if (formatJson === 'False') {
                            node.error("Error in the Json format. Not all items are empty strings or float strings");
                        }

                        var values = {
                            "typicalMonthWeek": msg.payload.typicalMonthWeek
                        };
                    } else {
                        formatJson = isGoodFormatWeek(msg.payload.typicalDays);
                        if (formatJson === 'False') {
                            node.error("Error in the Json format. Not all items are empty strings or float strings");
                        }
                        var values = {
                            "typicalDays": msg.payload.typicalDays
                        };
                    }

                    var errors = {
                        "wrongValues": msg.payload.wrongValues
                    };


                    var jsonToSend = {
                        ...parameters,
                        ...values,
                        ...errors
                    };
                    //console.log("JSON PRIMA :" + jsonToSend);

                    xmlHttp.onload = function (e) {
                        if (xmlHttp.readyState === 4) {
                            if (xmlHttp.status === 200) {
                                if (xmlHttp.responseText != "") {
                                    try {
                                        msg.payload = JSON.parse(xmlHttp.responseText);
                                    } catch (e) {
                                        msg.payload = xmlHttp.responseText;
                                    }
                                } else {
                                    msg.payload = JSON.parse("{\"status\": \"Success\"}");
                                }
                                s4cUtility.eventLog(RED, responseFromApi, msg, config, "Node-Red", "IOTDirectory", uri, "RX");
                                node.send(msg);
                            } else if (xmlHttp.status === 401) {
                                node.error("Unauthorized");
                            } else {
                                console.error(xmlHttp.statusText);
                                node.error(xmlHttp.responseText);
                            }
                        }
                    };
                    xmlHttp.onerror = function (e) {
                        console.error(xmlHttp.statusText);
                        node.error(xmlHttp.responseText);
                    };
                    if (formatJson === 'True') {
                        xmlHttp.send(JSON.stringify(jsonToSend));
                        console.log("Entrato");
                    }
                    //console.log("JSON dopo" + JSON.stringify(jsonToSend));

                } else {
                    node.error("Open the configuration of the node and redeploy");
                }
            } else {
                node.error("Error");
            }
        });
    }

    RED.nodes.registerType("save-typical-time-trends", SaveTypicalTimeTrend);

    RED.httpAdmin.get('/ownershipUrl', function (req, res) {
        var ownershipUrl = (RED.settings.ownershipUrl ? RED.settings.ownershipUrl : "https://www.snap4city.org/ownership-api/");
        res.send({
            "ownershipUrl": ownershipUrl
        });
    });

}