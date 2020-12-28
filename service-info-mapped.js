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

    function ServiceInfoMapped(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            var uri = "http://processloader.snap4city.org/processloader/mapping/getDestination.php";
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var serviceuri = (msg.payload.serviceuri ? msg.payload.serviceuri : config.serviceuri);
            var destinationServiceUri = serviceuri;
            var lang = (msg.payload.lang ? msg.payload.lang : config.lang);
            var fromtime = (msg.payload.fromtime ? msg.payload.fromtime : config.fromtime);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            logger.info(encodeURI(uri + "/?" + (typeof serviceuri != "undefined" && serviceuri != "" ? "&source=" + serviceuri : "")));
            xmlHttp.open("GET", encodeURI(uri + "/?" + (typeof serviceuri != "undefined" && serviceuri != "" ? "&source=" + serviceuri : "")), false);
            xmlHttp.setRequestHeader("Content-Type", "application/json");
            xmlHttp.send(null);
            if (xmlHttp.responseText != "[]") {
                try {
                    destinationServiceUri = JSON.parse(xmlHttp.responseText).destination;
                } catch (e) {
                    destinationServiceUri = xmlHttp.responseText;
                }
            }
            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "Mapping", uri, "RX");

            uri = (RED.settings.ascapiUrl ? RED.settings.ascapiUrl : "https://www.disit.org/superservicemap/api/v1");
            logger.info(encodeURI(uri + "/?serviceUri=" + serviceuri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"));
            xmlHttp.open("GET", encodeURI(uri + "/?serviceUri=" + serviceuri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"), false); // false for synchronous request
            xmlHttp.send(null);
            if (xmlHttp.responseText != "") {
                try {
                    msg.payload = JSON.parse(xmlHttp.responseText);
                } catch (e) {
                    msg.payload = xmlHttp.responseText;
                }
            }
            if (destinationServiceUri != serviceuri) {
                logger.info(encodeURI(uri + "/?serviceUri=" + destinationServiceUri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"));
                xmlHttp.open("GET", encodeURI(uri + "/?serviceUri=" + destinationServiceUri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"), false); // false for synchronous request
                xmlHttp.send(null);
                if (xmlHttp.responseText != "") {
                    try {
                        var temp = JSON.parse(xmlHttp.responseText);
                        temp.Service.features[0].geometry = msg.payload.Service.features[0].geometry;
                        temp.Service.features[0].properties = msg.payload.Service.features[0].properties;
                        msg.payload = temp;
                    } catch (e) {
                        msg.payload = xmlHttp.responseText;
                    }
                }
            }

            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "ASCAPI", uri, "RX");
            node.send(msg);
        });
    }

    RED.nodes.registerType("service-info-mapped", ServiceInfoMapped);
}