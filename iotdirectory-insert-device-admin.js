/**
 * Copyright 2014 Sense Tecnic Systems, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var util = require("util");
var httpclient = require('httpclient');
var assert = require('assert');

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
    "use strict";
    var RED2 = require.main.require('node-red');


    function deviceregistrationadmin(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        /*  node.devicename = config.devicename;
          node.devicetype = config.devicetype,
              node.devicekind = config.devicekind,
              node.contextbroker = config.contextbroker,
              node.deviceprotocol = config.deviceprotocol,
              node.deviceformat = config.deviceformat,
              node.devicecreateddate = config.devicecreateddate,
              node.devicemac = config.devicemac,
              node.devicemodel = config.devicemodel,
              node.deviceproducer = config.deviceproducer,
              node.devicelatitude = config.devicelatitude,
              node.devicelongitude = config.devicelongitude,
              node.name = config.name;
              node.attrs = config.attrs;*/

        node.on("input", function (msg) {
            jsdom
            node.send(msg);
        });
    }



    RED.nodes.registerType("device-registration-admin", deviceregistrationadmin);

    RED.httpAdmin.get('/s4c/js/*', function (req, res) {
        var options = {
            root: __dirname + '/lib/js/',
            dotfiles: 'deny'
        };

        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.get('/s4c/css/*', function (req, res) {
        var options = {
            root: __dirname + '/lib/css/',
            dotfiles: 'deny'
        };

        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.get("/retrieveAccessTokenLocal/", RED.auth.needsPermission('device-registration-admin.read'), function (req, res) {
        var s4cUtility = require("./snap4city-utility.js");
        res.json({
            "accessToken": s4cUtility.retrieveAccessToken(RED, null, null, null)
        });
    });


    RED.httpAdmin.get("/deviceregistration/:id", RED.auth.needsPermission('device-registration-admin.read'), function (req, res) {
        var s4cUtility = require("./snap4city-utility.js");
            res.json({
                "accessToken": s4cUtility.retrieveAccessToken(RED, node, node.id, null),
        });
    });

}