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

    function GetTypicalTimeTrend(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var msgs = new Object();
        node.on('input', function (msg) {
            var s4cUtility = require("./snap4city-utility.js");
            var uid = s4cUtility.retrieveAppID(RED);
			var responseFromApi = (msg.payload);
			var serviceUri = (msg.payload.serviceUri ? msg.payload.serviceUri : config.serviceUri);
			var valueName = (msg.payload.valueName ? msg.payload.valueName : config.valueName);	
			var valueUnit = (msg.payload.valueUnit ? msg.payload.valueUnit : config.valueUnit);
			var atDate = (msg.payload.atDate ? msg.payload.atDate : config.atDate);
			var trendType = (msg.payload.trendType ? msg.payload.trendType : config.trendType);
			var computationType = (msg.payload.computationType ? msg.payload.computationType : config.computationType);
			var from = (msg.payload.from ? msg.payload.from : config.from);
			var to = (msg.payload.to ? msg.payload.to : config.to);	
			
			
			
            if (responseFromApi) {
                var accessToken = "";
                var uri = (RED.settings.typicalTrendsUrl ? RED.settings.typicalTrendsUrl : (RED.settings.ascapiUrl ? RED.settings.ascapiUrl : "https://servicemap.km4city.org/WebAppGrafo/api/v1/")) + "values/typicaltrends";
                accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
                console.log("Url " + uri);
				 
                if (accessToken != "" && typeof accessToken != "undefined") {//CHIEDERE AL PROF SE BISOGNA ESSERE LOGGATI
                    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                    var xmlHttp = new XMLHttpRequest();
					uri=uri + "/?serviceUri="+serviceUri;
				if(valueName!=""&& typeof valueName != "undefined"){
					uri=uri+ "&valueName="+valueName;
				}
				if(trendType!=""&& typeof trendType != "undefined"){
					uri=uri+ "&trendType="+trendType;
				}
				if(computationType!=""&& typeof computationType != "undefined"){
					uri=uri+ "&computationType="+computationType;
				}
				if(atDate!=""&& typeof atDate != "undefined"){
					uri=uri+ "&atDate="+atDate;
				}
				if(from!=""&& typeof from != "undefined"){
					uri=uri+ "&from="+from;
				}
				if(to!=""&& typeof to != "undefined"){
					uri=uri+ "&to="+to;
				}
                    xmlHttp.open("GET", encodeURI(uri), true); // false for synchronous request
					
					

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
                                    msg.payload = JSON.parse("{\"status\": \"Success\"}");
                                }
                                s4cUtility.eventLog(RED, responseFromApi, msg, config, "Node-Red", "IOTDirectory", uri, "RX");
                                node.send(msg);
                            } else if (xmlHttp.status === 401) {
                                node.error("Unauthorized");
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


					xmlHttp.send();
					
					
                } else {
                    node.error("Open the configuration of the node and redeploy");
                }
            } else {
                node.error("Error");
            }
        });
    }

    RED.nodes.registerType("get-typical-time-trends", GetTypicalTimeTrend);


    RED.httpAdmin.get('/myPersonalDataUrl', function (req, res) {
        var myPersonalDataUrl = (RED.settings.myPersonalDataUrl ? RED.settings.myPersonalDataUrl : "https://www.snap4city.org/mypersonaldata/api/v1");
        res.send({
            "myPersonalDataUrl": myPersonalDataUrl
        });
    });

    RED.httpAdmin.get('/ownershipUrl', function (req, res) {
        var ownershipUrl = (RED.settings.ownershipUrl ? RED.settings.ownershipUrl : "https://www.snap4city.org/ownership-api/");
        res.send({
            "ownershipUrl": ownershipUrl
        });
    });


    RED.httpAdmin.get('/typicalTrendsUrl', function (req, res) {
        var typicalTrendsUrl =  (RED.settings.typicalTrendsUrl ? RED.settings.typicalTrendsUrl : (RED.settings.ascapiUrl ? RED.settings.ascapiUrl : "https://servicemap.km4city.org/WebAppGrafo/api/v1/")) + "values/typicaltrends";
        res.send({
            "typicalTrendsUrl": typicalTrendsUrl
        });
    });


    //ELIMINATO FUNZIONE myDeviceDataList

}