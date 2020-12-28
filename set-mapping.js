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

    function SetMapping(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            var uri = "http://processloader.snap4city.org/processloader/mapping/setDestination.php";
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var source = (msg.payload.source ? msg.payload.source : config.source);
            var destination = (msg.payload.destination ? msg.payload.destination : config.destination);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            logger.info(encodeURI(uri + "/?" + (typeof source != "undefined" && source != "" ? "&source=" + source : "") + (typeof destination != "undefined" && destination != "" ? "&destination=" + destination : "")));
            xmlHttp.open("GET", encodeURI(uri + "/?" + (typeof source != "undefined" && source != "" ? "&source=" + source : "") + (typeof destination != "undefined" && destination != "" ? "&destination=" + destination : "")), false);
            xmlHttp.setRequestHeader("Content-Type", "application/json");
            xmlHttp.send(null);
            if (xmlHttp.responseText != "") {
                msg.payload = xmlHttp.responseText;
            } else {
                if (xmlHttp.status != 200) {
                    msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
                } else {
                    msg.payload = "Duplicated Source";
                }
            }
            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "Mapping", uri, "TX");
            node.send(msg);
        });
    }

    RED.nodes.registerType("set-mapping", SetMapping);
}