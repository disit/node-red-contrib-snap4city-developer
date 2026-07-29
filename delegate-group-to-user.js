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

    function DelegateGroupToUser(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.usernameDelegated = config.usernameDelegated;
        node.selectedGroupDataId = config.selectedGroupDataId;
        node.groupId = config.groupId;
        node.groupDataList = config.groupDataList ? JSON.parse(config.groupDataList) : [];

        node.on("input", function (msg) {
            var s4cUtility = require("./snap4city-utility.js");
            const logger = s4cUtility.getLogger(RED, node);
            const uid = s4cUtility.retrieveAppID(RED);
            var payload = msg.payload || {};
            var usernameDelegated = String(payload.usernameDelegated || node.usernameDelegated || "").trim();
            var groupId = payload.groupId || node.groupId;

            if (!usernameDelegated) {
                node.error("Missing usernameDelegated", msg);
                return;
            }

            if (!groupId) {
                node.error("Missing groupId", msg);
                return;
            }

            node.s4cAuth = RED.nodes.getNode(config.authentication);
            var uri = s4cUtility.settingUrl(
                RED,
                node,
                "myPersonalDataUrl",
                "https://www.snap4city.org",
                "/mypersonaldata/api/v1/"
            );
            uri = uri.replace(/\/datamanager\/api\/v1\/?$/, "/mypersonaldata/api/v1/");

            var inPayload = msg.payload;
            var accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);

            if (accessToken !== "" && typeof accessToken !== "undefined") {
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                var xmlHttp = new XMLHttpRequest();
                var requestUrl =
                    uri +
                    "devicegroup/" + encodeURIComponent(groupId) +
                    "/delegations/?sourceRequest=iotapp&accessToken=" +
                    encodeURIComponent(accessToken);

                logger.info(uri + "devicegroup/" + groupId + "/delegations/?sourceRequest=iotapp");
                xmlHttp.open("POST", requestUrl, true);
                xmlHttp.setRequestHeader("Accept", "application/json");
                xmlHttp.setRequestHeader("Content-Type", "application/json");
                xmlHttp.setRequestHeader("Authorization", "Bearer " + accessToken);

                xmlHttp.onload = function () {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
                            if (xmlHttp.responseText) {
                                try {
                                    msg.payload = JSON.parse(xmlHttp.responseText);
                                } catch (e) {
                                    msg.payload = xmlHttp.responseText;
                                }
                            } else {
                                msg.payload = {
                                    status: "success",
                                    usernameDelegated: usernameDelegated,
                                    groupId: groupId
                                };
                            }

                            s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "DelegateGroupToUser", uri, "TX");
                            node.send(msg);
                        } else {
                            logger.error(xmlHttp.statusText);
                            node.error(xmlHttp.responseText || xmlHttp.statusText, msg);
                        }
                    }
                };

                xmlHttp.onerror = function () {
                    logger.error(xmlHttp.statusText);
                    node.error(xmlHttp.responseText || xmlHttp.statusText, msg);
                };

                try {
                    var numericGroupId = Number(groupId);
                    var data = {
                        usernameDelegated: usernameDelegated,
                        elementId: Number.isNaN(numericGroupId) ? groupId : numericGroupId,
                        elementType: "MyGroup"
                    };
                    xmlHttp.send(JSON.stringify(data));
                } catch (e) {
                    logger.error("Error to send message: " + e);
                    node.error("Error to send message: " + e, msg);
                }
            } else {
                node.error("Try opening the node configuration and deploy again", msg);
                logger.error("Authentication Problem");
            }
        });
    }

    RED.nodes.registerType("delegate-group-to-user", DelegateGroupToUser);
};
