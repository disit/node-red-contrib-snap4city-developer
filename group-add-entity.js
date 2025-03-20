/* NODE-RED-CONTRIB-SNAP4CITY-USER
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

    function GroupAddEntity(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.selectedDeviceDataId = config.selectedDeviceDataId;
        node.deviceId = config.deviceId;
		node.deviceDataList = config.deviceDataList ? JSON.parse(config.deviceDataList): [];
		
		node.selectedGroupDataId = config.selectedGroupDataId;
        node.groupId = config.groupId;
        node.groupDataList = config.groupDataList ? JSON.parse(config.groupDataList): [];
        

        node.on('input', function (msg) {
            var s4cUtility = require("./snap4city-utility.js");
            const logger = s4cUtility.getLogger(RED, node);
            const uid = s4cUtility.retrieveAppID(RED);
            var deviceId = (msg.payload.deviceId ? msg.payload.deviceId : node.deviceId);
			var groupId = (msg.payload.groupId ? msg.payload.groupId : node.groupId);
			if (deviceId) {
                node.s4cAuth = RED.nodes.getNode(config.authentication);
                var uri = s4cUtility.settingUrl(RED,node, "myPersonalDataUrl", "https://www.snap4city.org", "/datamanager/api/v1/")
				
                var inPayload = msg.payload;
				
                var accessToken = "";

                accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
				if (accessToken != "" && typeof accessToken != "undefined") {
					var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
					var xmlHttp = new XMLHttpRequest();
					logger.info(encodeURI(uri + "devicegroup/"+groupId+"/?accessToken=" + accessToken+"&sourceRequest=iotapp"));
					xmlHttp.open("POST", encodeURI(uri + "devicegroup/"+groupId+"/elements/?accessToken=" + accessToken+"&sourceRequest=iotapp"), true);
					console.log(encodeURI(uri + "devicegroup/"+groupId+"/elements/?accessToken=" + accessToken+"&sourceRequest=iotapp"))
					xmlHttp.setRequestHeader("Content-Type", "application/json");
					xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);

					
					xmlHttp.onload = function (e) {
						if (xmlHttp.readyState === 4) {
							if (xmlHttp.status === 200 || xmlHttp.status === 201) {
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
								s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "WhatIf", uri, "TX");
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
					try {
						let data = [];
						if (Array.isArray(deviceId)) {
							data = deviceId.map(id => ({
								"insertTime": Date.now(),
								"deviceGroupId": groupId,
								"elementType": "IOTID",
								"elementId": id
							}));
						} else {
							data.push({
								"insertTime": Date.now(),
								"deviceGroupId": groupId,
								"elementType": "IOTID",
								"elementId": deviceId
							});
						}
						xmlHttp.send(JSON.stringify(data));

					} catch (e) {
						logger.error("Error to send message: " + e);
					}
				} else {
					node.error("Try opening the node configuration and deploy again");
					logger.error("Authentication Problem");
				}
            }
        });
    }

    RED.nodes.registerType("group-add-entity", GroupAddEntity);
    
}