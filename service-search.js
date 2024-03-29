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

    function ServiceSearch(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            node.s4cAuth = RED.nodes.getNode(config.authentication);
            var uri = s4cUtility.settingUrl(RED,node, "ascapiUrl", "https://www.snap4city.org", "/superservicemap/api/v1/");
            var selection = (msg.payload.selection ? msg.payload.selection : config.selection);
			var filter = (msg.payload.filter ? msg.payload.filter : config.filter);
			var sortOnValue = (msg.payload.sortOnValue ? msg.payload.sortOnValue : config.sortOnValue);
			var values = (msg.payload.values ? msg.payload.values : config.values);
            var categories = (msg.payload.categories ? msg.payload.categories : config.categories);
            var maxDists = (msg.payload.maxdistance ? msg.payload.maxdistance : config.maxdists);
            var maxResults = (msg.payload.maxresults ? msg.payload.maxresults : config.maxresults);
            var language = (msg.payload.lang ? msg.payload.lang : config.lang);
            var model = (msg.payload.model ? msg.payload.model : config.model);
            var geometry = (msg.payload.geometry ? msg.payload.geometry : config.geometry);
			var typeQuery = (msg.payload.typeQuery ? msg.payload.typeQuery : config.typeQuery);
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
			
            if (typeQuery == "entity"){
			    logger.info(encodeURI(uri + "iot-search/?selection=" + selection + "&valueFilters="+filter+"&categories=" + categories + "&maxResults=" + maxResults + "&maxDists=" + maxDists +  "&lang=" + language + "&geometry=" + geometry + (typeof sortOnValue != "undefined" && sortOnValue != "" ? "&sortOnValue=" + sortOnValue : "")+ (typeof values != "undefined" && values != "" ? "&values=" + values : "")+(typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + (typeof model != "undefined" && model != "" ? "&model=" + model : "") +"&appID=iotapp"));
				xmlHttp.open("GET", encodeURI(uri + "iot-search/?selection=" + selection + "&valueFilters="+filter+"&categories=" + categories + "&maxResults=" + maxResults + "&maxDists=" + maxDists +  "&lang=" + language + "&geometry=" + geometry + (typeof sortOnValue != "undefined" && sortOnValue != "" ? "&sortOnValue=" + sortOnValue : "")+ (typeof values != "undefined" && values != "" ? "&values=" + values : "")+(typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + (typeof model != "undefined" && model != "" ? "&model=" + model : "") +"&appID=iotapp"), true); // false for synchronous request	
			}else {
				logger.info(encodeURI(uri + "/?selection=" + selection + "&categories=" + categories + "&maxResults=" + maxResults + "&maxDists=" + maxDists + "&format=json" + "&lang=" + language + "&geometry=" + geometry + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + (typeof model != "undefined" && model != "" ? "&model=" + model : "") +"&appID=iotapp"));
				xmlHttp.open("GET", encodeURI(uri + "/?selection=" + selection + "&categories=" + categories + "&maxResults=" + maxResults + "&maxDists=" + maxDists + "&format=json" + "&lang=" + language + "&geometry=" + geometry + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + (typeof model != "undefined" && model != "" ? "&model=" + model : "") +"&appID=iotapp"), true); // false for synchronous request
            }
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
                            try {
                                msg.payload = JSON.parse(xmlHttp.responseText);
                            } catch (e) {
                                msg.payload = xmlHttp.responseText;
                            }
                        } else {
                            msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
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
        });
    }


    RED.nodes.registerType("service-search", ServiceSearch);
}