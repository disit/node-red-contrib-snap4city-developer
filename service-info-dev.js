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

    function ServiceInfoDev(config) {
        var s4cUtility = require("./snap4city-utility.js");
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            var uri = "https://www.disit.org/superservicemap/api/v1/";
            var serviceuri = (msg.payload.serviceuri ? msg.payload.serviceuri : config.serviceuri);
            if (typeof serviceuri == "undefined" || (typeof serviceuri != "undefined" && serviceuri == "" && msg.payload.indexOf("://") != -1)) {
                serviceuri = msg.payload;
            }
            var lang = (msg.payload.lang ? msg.payload.lang : config.lang);
            var fromtime = (msg.payload.fromtime ? msg.payload.fromtime : config.fromtime);
            var uid = s4cUtility.retrieveAppID(RED);
            var inPayload = msg.payload;
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            console.log(encodeURI(uri + "?serviceUri=" + serviceuri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"));
            if (typeof serviceuri != "undefined" && serviceuri != "") {
                xmlHttp.open("GET", encodeURI(uri + "?serviceUri=" + serviceuri + "&realtime=true" + "&lang=" + lang + (fromtime ? "&fromTime=" + fromtime : "") + (typeof uid != "undefined" && uid != "" ? "&uid=" + uid : "") + "&appID=iotapp"), true); // false for synchronous request
                xmlHttp.onload = function (e) {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
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
                            console.error(xmlHttp.statusText);
                            node.error(xmlHttp.responseText);
                        }
                    }
                };
                xmlHttp.onerror = function (e) {
                    console.error(xmlHttp.statusText);
                    node.error(xmlHttp.responseText);
                };
                xmlHttp.send(null);
            } else {
                node.error("Empty serviceuri");
            }
        });
    }
    RED.nodes.registerType("service-info-dev", ServiceInfoDev);
}