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

    function ServiceSearchWithinWktArea(config) {
        var s4cUtility = require("./snap4city-utility.js");
        RED.nodes.createNode(this, config);
        var node = this;
        var msgs = [{}, {}, {}];
        node.on('input', function (msg) {
            var uri = "https://www.disit.org/superservicemap/api/v1/";
            var wktarea = (msg.payload.wktarea ? msg.payload.wktarea : config.wktarea);
            var categories = (msg.payload.categories ? msg.payload.categories : config.categories);
            var maxResults = (msg.payload.maxresults ? msg.payload.maxresults : config.maxresults);
            var language = (msg.payload.lang ? msg.payload.lang : config.lang);
            var geometry = (msg.payload.geometry ? msg.payload.geometry : config.geometry);
            var uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            console.log(encodeURI(uri + "?selection=wkt:" + wktarea + "&categories=" + categories + "&maxResults=" + maxResults + "&format=json&fullCount=false" + "&lang=" + language + "&geometry=" + geometry + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"));
            xmlHttp.open("GET", encodeURI(uri + "?selection=wkt:" + wktarea + "&categories=" + categories + "&maxResults=" + maxResults + "&format=json&fullCount=false" + "&lang=" + language + "&geometry=" + geometry + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"), true); // false for synchronous request
            xmlHttp.onload = function (e) {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        if (xmlHttp.responseText != "") {
                            var response = JSON.parse(xmlHttp.responseText);
                            var serviceUriArray = [];
                            var completeFeatures = {
                                "Results": {
                                    "type": "FeatureCollection",
                                    "features": []
                                }
                            }
                            for (var category in response) {
                                for (var i = 0; i < response[category].features.length; i++) {
                                    serviceUriArray.push(response[category].features[i].properties.serviceUri);
                                }

                                if (response[category].features.length != 0) {
                                    completeFeatures["Results"].features = completeFeatures["Results"].features.concat(response[category].features);

                                }
                            }
                            msgs[0].payload = serviceUriArray;
                            msgs[1].payload = response;
                            msgs[2].payload = completeFeatures;

                        } else {
                            msgs[0].payload = JSON.parse("{\"status\": \"error\"}");
                            msgs[1].payload = JSON.parse("{\"status\": \"error\"}");
                            msgs[2].payload = JSON.parse("{\"status\": \"error\"}");
                        }
                        s4cUtility.eventLog(RED, inPayload, msgs, config, "Node-Red", "ASCAPI", uri, "RX");
                        node.send(msgs);
                    } else {
                        console.error(xmlHttp.statusText);   node.error(xmlHttp.responseText);
                    }
                }
            };
            xmlHttp.onerror = function (e) {
                console.error(xmlHttp.statusText);   node.error(xmlHttp.responseText);
            };
            xmlHttp.send(null);


        });
    }
    RED.nodes.registerType("service-search-within-wkt-area", ServiceSearchWithinWktArea);
}