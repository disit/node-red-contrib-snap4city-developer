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
    
    function NotificatorLastEvents(config) {
        var s4cUtility = require("./snap4city-utility.js");
        RED.nodes.createNode(this, config);
        var node = this;
        var uri = "http://notificator.km4city.org/notificator/restInterfaceExternal.php?operation=getEvents";
        var dashboard = config.dashboard;
        var widget = config.widget;
        var event = config.event;
        var checkevery = config.checkevery;
        var uid = s4cUtility.retrieveAppID(RED);
        var inPayload = {};
        var msg = {};
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var xmlHttp = new XMLHttpRequest();
        console.log(node.interval);
        if (node.interval != null) {
            console.log("Cancello Intervallo");
            clearInterval(node.interval);
        }
        node.interval = setInterval(function () {
            console.log(encodeURI(uri + "&startDate=" + (new Date(Date.now() - new Date().getTimezoneOffset() * 1000 * 60 - checkevery * 1000)).toISOString().split('.')[0].replace("T", " ") + "&dashboardTitle=" + dashboard + "&widgetTitle=" + widget + "&appID=iotapp"));
            xmlHttp.open("GET", encodeURI(uri + "&startDate=" + (new Date(Date.now() - new Date().getTimezoneOffset() * 1000 * 60 - checkevery * 1000)).toISOString().split('.')[0].replace("T", " ") + "&dashboardTitle=" + dashboard + "&widgetTitle=" + widget + "&appID=iotapp"), true); // false for synchronous request
            xmlHttp.onload = function (e) {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        if (xmlHttp.responseText != "") {
                            try {
                                msg.payload = JSON.parse(xmlHttp.responseText).data;
                            } catch (e) {
                                msg.payload = xmlHttp.responseText;
                            }
                        } else {
                            msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
                        }
                        s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "Notificator", uri, "RX");
                        node.send(msg);
                    } else {
                        console.error(xmlHttp.statusText);   node.error(xmlHttp.responseText);
                    }
                }
            };
            xmlHttp.onerror = function (e) {
                console.error(xmlHttp.statusText);   node.error(xmlHttp.responseText);
            };
            xmlHttp.send(null);
        }, checkevery * 1000);

        node.closedDoneCallback = function () {
            util.log("notificator-last-events node " + node.name + " has been closed");
        };

        node.on('close', function (removed, closedDoneCallback) {
            if (removed) {
                // Cancellazione nodo
                util.log("notificator-last-events node " + node.name + " is being removed from flow");
                console.log(node.interval);
                if (node.interval != null) {
                    console.log("Cancello Intervallo");
                    clearInterval(node.interval);
                }
            } else {
                // Riavvio nodo
                util.log("notificator-last-events node " + node.name + " is being rebooted");
                console.log(node.interval);
                if (node.interval != null) {
                    console.log("Cancello Intervallo");
                    clearInterval(node.interval);
                }
            }
            closedDoneCallback();

        });
    }
    RED.nodes.registerType("notificator-last-events", NotificatorLastEvents);
}