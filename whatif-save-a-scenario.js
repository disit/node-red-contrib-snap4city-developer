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

    function SaveAScenario(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("../node-red-contrib-snap4city-user/snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        const uid = s4cUtility.retrieveAppID(RED);
        node.on('input', function (msg) {
            node.s4cAuth = RED.nodes.getNode(config.authentication);
            var uri = s4cUtility.settingUrl(RED,node, "myPersonalDataUrl", "https://www.snap4city.org", "/datamanager/api/v1/") + "username/" + (s4cUtility.retrieveCurrentUser(RED, node, config.authentication)).toLowerCase() + "/data";
            var inPayload = msg.payload;
            var scenarioName = (msg.payload.scenarioName ? msg.payload.scenarioName : config.scenarioName);
            var scenarioDescription = (msg.payload.scenarioDescription ? msg.payload.scenarioDescription : config.scenarioDescription);
            var scenarioDatetimeStart = (msg.payload.scenarioDatetimeStart ? msg.payload.scenarioDatetimeStart : config.scenarioDatetimeStart);
            var scenarioDatetimeEnd = (msg.payload.scenarioDatetimeEnd ? msg.payload.scenarioDatetimeEnd : config.scenarioDatetimeEnd);
            var isPublic = (msg.payload.isPublic ? msg.payload.isPublic : config.isPublic);
            var features = (msg.payload.features ? msg.payload.features : JSON.parse(config.layers));
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            if (accessToken != "" && typeof accessToken != "undefined") {
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                var xmlHttp = new XMLHttpRequest();
                logger.info(encodeURI(uri + "/?accessToken=" + accessToken));
                xmlHttp.open("POST", encodeURI(uri + "/?sourceRequest=iotapp"), true);
                xmlHttp.setRequestHeader("Content-Type", "application/json");
                xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);
                var variableValue = {
                    "type": "FeatureCollection",
                    "features": features,
                    "scenarioName": scenarioName,
                    "scenarioDescription": scenarioDescription,
                    "scenarioDatetimeStart": scenarioDatetimeStart,
                    "scenarioDatetimeEnd": scenarioDatetimeEnd,
                    "isPublic": isPublic
                  }
                logger.debug("Message sent to KPI: " + JSON.stringify(variableValue));
                xmlHttp.onload = function (e) {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
                            if (xmlHttp.responseText != "") {
                                try {
                                    msg.payload = JSON.parse(xmlHttp.responseText);
                                } catch (e) {
                                    logger.error("Problem Parsing data " + xmlHttp.responseText);
                                    msg.payload = xmlHttp.responseText;
                                }
                            } else {
                                msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
                                logger.error("Problem Parsing data " + xmlHttp.responseText);
                            }
                            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "WhatIf", uri, "TX");
                            node.send(msg);
                        } else {
                            logger.error(xmlHttp.statusText);
                            node.error(xmlHttp.responseText);
                        }
                    }
                };
                xmlHttp.onerror = function (e) {
                    logger.error(xmlHttp.statusText);
                    node.error(xmlHttp.responseText);
                };
                try {
                    xmlHttp.send(JSON.stringify({
                        "dataTime": Date.now(),
                        "variableName": "scenario_id",
                        "variableValue": JSON.stringify(variableValue),
                        "variableUnit": "json",
                        "motivation": "scenario",
                        "APPID": uid.toString('utf8')
                    }));
                } catch (e) {
                    logger.error("Error to send message: " + e);
                }
            } else {
                node.error("Try opening the node configuration and deploy again");
                logger.error("Authentication Problem");
            }
        });
    }

    RED.nodes.registerType("save-a-scenario", SaveAScenario);
}