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

    function NotificatorHistoryEvents(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var s4cUtility = require("./snap4city-utility.js");
        const logger = s4cUtility.getLogger(RED, node);
        node.on('input', function (msg) {
            var uri = "http://notificator.km4city.org/notificator/restInterfaceExternal.php?operation=getEvents";
            var dashboard = config.dashboard;
            var widget = config.widget;
            var event = config.event;
            var startdate = config.startdate.replace("T", " ");
            var enddate = config.enddate.replace("T", " ");
            const uid = s4cUtility.retrieveAppID(RED);
            var inPayload = {};
            var msg = {};
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xmlHttp = new XMLHttpRequest();
            logger.info(encodeURI(uri + "&startDate=" + startdate + "&endDate=" + enddate + "&dashboardTitle=" + dashboard + "&widgetTitle=" + widget + "&appID=iotapp"));
            xmlHttp.open("GET", encodeURI(uri + "&startDate=" + startdate + "&endDate=" + enddate + "&dashboardTitle=" + dashboard + "&widgetTitle=" + widget + "&appID=iotapp"), true); // false for synchronous request
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
                            console.log(xmlHttp.responseText);
                            msg.payload = JSON.parse(xmlHttp.responseText).data;
                        } else {
                            msg.payload = JSON.parse("{\"status\": \"error\"}");
                        }
                        s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "Notificator", uri, "RX");
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
    RED.nodes.registerType("notificator-history-events", NotificatorHistoryEvents);
}