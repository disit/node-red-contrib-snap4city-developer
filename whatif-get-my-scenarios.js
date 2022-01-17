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

    function GetMyScenarios(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            var s4cUtility = require("../node-red-contrib-snap4city-user/snap4city-utility.js");
            const logger = s4cUtility.getLogger(RED, node);
            const uid = s4cUtility.retrieveAppID(RED);
            node.s4cAuth = RED.nodes.getNode(config.authentication);
            var uri = s4cUtility.settingUrl(RED,node, "myPersonalDataUrl", "https://www.snap4city.org", "/datamanager/api/v1/") + "username/" + (s4cUtility.retrieveCurrentUser(RED, node, config.authentication)).toLowerCase() + "/data";
            var inPayload = msg.payload;
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            if (accessToken != "" && typeof accessToken != "undefined") {
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                var xmlHttp = new XMLHttpRequest();
                logger.info(encodeURI(uri + "/?sourceRequest=iotapp&variableName=scenario_id&motivation=scenario"));
                xmlHttp.open("GET", encodeURI(uri + "/?sourceRequest=iotapp&variableName=scenario_id&motivation=scenario"), true);
                xmlHttp.setRequestHeader("Content-Type", "application/json");
                xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);
                xmlHttp.onload = function (e) {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
                            if (xmlHttp.responseText != "") {
                                try {
                                    var mydataToManage = JSON.parse(xmlHttp.responseText);
                                    msg.payload = [];
                                    for (var i = 0; i < mydataToManage.length; i++) {
                                        if (mydataToManage[i].variableValue != null && mydataToManage[i].variableValue != "") {
                                            msg.payload.push(JSON.parse(mydataToManage[i].variableValue));
                                        }
                                    }
                                } catch (e) {
                                    logger.error("Problem Parsing data " + xmlHttp.responseText);
                                    msg.payload = xmlHttp.responseText;
                                }
                                s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "WhatIF", uri, "RX");
                            node.send(msg);
                            } else {
                                node.error("{\"status\": \"There was some problem\"}");
                                logger.error("Problem Parsing data " + xmlHttp.responseText);
                            }
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
                xmlHttp.send(null);
            } else {
                node.error("Try opening the node configuration and deploy again");
                logger.error("Authentication Problem");
            }
        });
    }

    RED.nodes.registerType("get-my-scenarios", GetMyScenarios);
}