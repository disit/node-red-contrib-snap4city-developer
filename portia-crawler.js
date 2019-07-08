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

    function PortiaCrawler(config) {
        RED.nodes.createNode(this, config);
        var when = require('when');
        var util = require('util');
        var bodyParser = require("body-parser");
        var getBody = require('raw-body');
        var jsonParser = bodyParser.json();
        var urlencParser = bodyParser.urlencoded({
            extended: true
        });
        var node = this;

        node.on('input', function (msg) {
            var s4cUtility = require("./snap4city-utility.js");
            var uid = s4cUtility.retrieveAppID(RED);
            var project = (msg.payload.project ? msg.payload.project : config.project);
            var spider = (msg.payload.spider ? msg.payload.spider : config.spider);
            var uri = "https://www.snap4city.org/snap4city-application-api/v1/";
            var inPayload = msg.payload;
            var accessToken = "";
            accessToken = s4cUtility.retrieveAccessToken(RED, node, config.authentication, uid);
            if (accessToken != "" && typeof accessToken != "undefined") {
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                var xmlHttp = new XMLHttpRequest();
                getMyUri(node).then(function (myUri) {
                    var postTo = "https://" + myUri + "/";
                    console.log(encodeURI(uri + "?op=run_portia_crawler&project=" + project + "&spider=" + spider + "&accessToken=" + accessToken + "&postTo=" + postTo + node.id.replace(".", "")));
                    xmlHttp.open("GET", encodeURI(uri + "?op=run_portia_crawler&project=" + project + "&spider=" + spider + "&accessToken=" + accessToken + "&postTo=" + postTo + node.id.replace(".", "")), true);
                    xmlHttp.onload = function (e) {
                        if (xmlHttp.readyState === 4) {
                            if (xmlHttp.status === 200) {
                                if (xmlHttp.responseText != "") {
                                    try {
                                        msg.payload = JSON.parse(xmlHttp.responseText);
                                        node.status({
                                            fill: "blue",
                                            shape: "dot",
                                            text: "listening on " + postTo + node.id.replace(".", "")
                                        });

                                        var errorHandler = function (err, req, res, next) {
                                            res.sendStatus(500);
                                        };

                                        var next = function (req, res, next) {
                                            next();
                                        }

                                        RED.httpNode.post("/" + node.id.replace(".", ""), next, next, next, jsonParser, urlencParser, rawBodyParser, listenOnUrl, errorHandler);
                                    } catch (e) {
                                        msg.payload = xmlHttp.responseText;
                                    }
                                } else {
                                    msg.payload = JSON.parse("{\"status\": \"There was some problem\"}");
                                }
                                s4cUtility.eventLog(RED, inPayload, msg, config, "Node-Red", "PortiaCrawler", uri, "RX");
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
                    try {
                        xmlHttp.send(null);
                    } catch (e) {
                        console.log(e);
                    }
                });
            };
        });

        function getMyUri(node) {
            return when.promise(
                function (resolve, reject) {

                    // first try to get user specified uri, TODO: many input validations...
                    var myUri = null;
                    if (myUri) {
                        resolve(myUri + RED.settings.httpRoot /*+ ":" + RED.settings.uiPort*/ ); //PB removed port
                    } else {
                        myUri = RED.settings.externalHost; //PB fix added
                        if (myUri) {
                            resolve(myUri + RED.settings.httpRoot /*+ ":" + RED.settings.uiPort*/ ); //PB remove port
                        } else {
                            // attempt to get from bluemix
                            try {
                                var app = JSON.parse(process.env.VCAP_APPLICATION);
                                myUri = app['application_uris'][0];
                            } catch (e) {
                                util.log("Probably not running in bluemix...");
                            }
                        }
                    }

                    if (myUri) {
                        resolve(myUri);
                    } else {
                        var net = require('net');
                        var client = net.connect({
                                port: 80,
                                host: "google.com"
                            },
                            function () {
                                if (!client.localAddress) {
                                    reject("Failed to get local address");
                                } else {
                                    resolve(client.localAddress + ":" + RED.settings.uiPort);
                                }
                            }
                        );
                    }
                }
            );
        }

        function listenOnUrl(req, res) {
            node.send({
                payload: req.body,
                statusCode: 200
            });

            res.sendStatus(200);
        };

        function rawBodyParser(req, res, next) {
            if (req._body) {
                return next();
            }
            req.body = "";
            req._body = true;

            var isText = true;
            var checkUTF = false;

            if (req.headers['content-type']) {
                var parsedType = typer.parse(req.headers['content-type'])
                if (parsedType.type === "text") {
                    isText = true;
                } else if (parsedType.subtype === "xml" || parsedType.suffix === "xml") {
                    isText = true;
                } else if (parsedType.type !== "application") {
                    isText = false;
                } else if (parsedType.subtype !== "octet-stream") {
                    checkUTF = true;
                }
            }

            getBody(req, {
                length: req.headers['content-length'],
                encoding: isText ? "utf8" : null
            }, function (err, buf) {
                if (err) {
                    return next(err);
                }
                if (!isText && checkUTF && isUtf8(buf)) {
                    buf = buf.toString()
                }

                req.body = buf;
                next();
            });
        }

    }

    RED.nodes.registerType("portia-crawler", PortiaCrawler);
}