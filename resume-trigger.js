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

    function ResumeTrigger(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            var hostname = (msg.payload.hostname ? msg.payload.hostname : config.hostname);
            var uri = "https://" + hostname + ":8080/SmartCloudEngine/index.jsp";
            var triggerName = (msg.payload.triggername ? msg.payload.triggername : config.triggername);
            var triggerGroup = (msg.payload.triggergroup ? msg.payload.triggergroup : config.triggergroup);
            var inPayload = msg.payload;
            var json = {
                id: "resumeTrigger",
                triggerName: triggerName,
                triggerGroup: triggerGroup
            }
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            logger.info(encodeURI(uri + "/?json=" + JSON.stringify(json)));
            xmlHttp.open("GET", encodeURI(uri + "/?json=" + JSON.stringify(json)), true); // false for synchronous request
            xmlHttp.onload = function (e) {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        logger.info("ResponseText: " + xmlHttp.responseText);
                        if (xmlHttp.responseText != "") {
                            msg.payload = JSON.parse(xmlHttp.responseText.replace("<p>", "").replace("</p>", ""));
                        } else {
                            msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
                        }
                        s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "DISCES", uri, "RX");
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
        });
    }
    RED.nodes.registerType("resume-trigger", ResumeTrigger);
}