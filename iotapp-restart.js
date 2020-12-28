/* NODE-RED-CONTRIB-SNAP4CITY-DEVELOPER
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

    function IotAppRestart(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var xmlHttp = new XMLHttpRequest();
        
        node.on('input', function (msg) {
            var inPayload = msg.payload;
            var accessToken = "";
            var idIOTApp = (msg.payload.id ? msg.payload.id : config.idIOTApp);
            var uri = (RED.settings.snap4cityApplicationApiUrl ? RED.settings.snap4cityApplicationApiUrl : "https://www.snap4city.org/snap4city-application-api/v1")
            const uid = s4cUtility.retrieveAppID(RED);
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            if (accessToken != "" && typeof accessToken != "undefined") {
                logger.info(encodeURI(uri + "/?op=restart_app&id=" + idIOTApp));
                xmlHttp.open("GET", encodeURI(uri + "/?op=restart_app&id=" + idIOTApp + "&accessToken=" + accessToken), true);
                xmlHttp.onload = function () {
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
                            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "IotAppRestart", uri, "RX");
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
                xmlHttp.send(null);
            } else {
                logger.error("Problem with accessToken: " + accessToken);
            };
        });

    }
    RED.nodes.registerType("iotapp-restart", IotAppRestart);
}