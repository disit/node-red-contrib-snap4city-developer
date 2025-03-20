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

    function GroupDeleteUser(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            node.s4cAuth = RED.nodes.getNode(config.authentication);
            var uri = (RED.settings.dashboardSmartCityUrl ? RED.settings.dashboardSmartCityUrl : "https://www.snap4city.org/dashboardSmartCity/");
        
            var username = (msg.payload.username ? msg.payload.username : config.username);
            var group = (msg.payload.group ? msg.payload.group : config.group);
            var organization = (msg.payload.organization ? msg.payload.organization : config.organization);
			
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            
			if (typeof username != "undefined" && username != "" && typeof group != "undefined" && group != "" && typeof organization != "undefined" && organization != "") {
				if (typeof accessToken != "undefined" && accessToken != "") {
                    uri=uri+"api/userGroups.php?action=deleteUser"			
					xmlHttp.open("GET", encodeURI(uri + "&username="+username+"&group="+group+"&organization="+organization+"&accessToken=" + accessToken+"&sourceRequest=iotapp"), true);
					console.log(encodeURI(uri + "&username="+username+"&group="+group+"&organization="+organization+"&accessToken=" + accessToken+"&sourceRequest=iotapp"))
					xmlHttp.setRequestHeader("Content-Type", "application/json");
					xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);
                }
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
                            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "ASCAPI", uri, "RX");
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
                node.error("Empty parameter check configuration");
            }
        });
    }
    RED.nodes.registerType("group-delete-user", GroupDeleteUser);
}