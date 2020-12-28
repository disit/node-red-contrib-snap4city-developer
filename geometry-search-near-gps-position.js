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

    function GeometrySearchNearGpsPosition(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        var msgs = [{}, {}];
        node.on('input', function (msg) {
            var uri = (RED.settings.ascapiUrl ? RED.settings.ascapiUrl : "https://www.disit.org/superservicemap/api/v1") + "/location/";
            var latitude = (msg.payload.latitude ? msg.payload.latitude : config.latitude);
            var longitude = (msg.payload.longitude ? msg.payload.longitude : config.longitude);
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            logger.info(encodeURI(uri + "/?position=" + latitude + ";" + longitude + "&intersectGeom=true" + "&format=json" + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"));
            xmlHttp.open("GET", encodeURI(uri + "/?position=" + latitude + ";" + longitude + "&intersectGeom=true" + "&format=json" + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"), true); // false for synchronous request
            if (typeof accessToken != "undefined" && accessToken != "") {
                xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            } else {
                logger.debug("Call without accessToken");
            } 
            xmlHttp.onload = function (e) {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        logger.info("ResponseText: " + xmlHttp.responseText);
                        if (xmlHttp.responseText != "") {
                            var response = "";
                            try {
                                response = JSON.parse(xmlHttp.responseText);
                            } catch (error){
                                logger.error("Problem Parsing data " + xmlHttp.responseText);
                            }
                            logger.info("Response: " + response);
                            var serviceUriArray = [];
                            for (var i = 0; i < response.intersect.length; i++) {
                                serviceUriArray.push(response.intersect[i].uri);
                            }
                            msgs[0].payload = serviceUriArray;
                            msgs[1].payload = response;

                        } else {
                            msgs[0].payload = JSON.parse("{\"status\": \"error\"}");
                            msgs[1].payload = JSON.parse("{\"status\": \"error\"}");
                            logger.error("xmlHttp.responseText empty");
                        }
                        s4cUtility.eventLog(RED, inPayload, msgs, config, "Node-Red", "ASCAPI", uri, "RX");
                        node.send(msgs);
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
    RED.nodes.registerType("geometry-search-near-gps-position", GeometrySearchNearGpsPosition);
}