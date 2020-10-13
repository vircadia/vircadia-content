/*
    webEntityZoneLoader.js

    Created by Kalila L. on 13 Oct 2020
    Copyright 2020 Vircadia and contributors.
    
    Distributed under the Apache License, Version 2.0.
    See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
    
    This script will create/destroy web entities in a specified zone.
*/

(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    var zoneToHandle;
    var maxFPS;
    var relative;
    var webEntitiesToLoad = [];
    var webEntitiesActive = [];

    // User Data Functionality

    var defaultUserData = {
        "webEntitiesToLoad": [
            {
                "url": "https://google.com/",
                "script": "https://lol.com/script.js",
                "serverScripts": "https://lol.com/script.js",
                "position": [400, 22, 400],
                "rotation": [0, 0, 0],
                "dimensions": [2, 2],
                "dpi": 10
            }
        ],
        "options": {
            "relative": true,
            "maxFPS": 30,
            "zoneToHandle": ""
        }
    }
    
    function getEntityUserData() {
        return Entities.getEntityProperties(_this.entityID, ["userData"]).userData;
    }

    function setDefaultUserData() {
        Entities.editEntity(_this.entityID, {
            userData: JSON.stringify(defaultUserData)
        });
    }

    function getAndParseUserData() {
        var userData = getEntityUserData();

        try {
            userData = Object(JSON.parse(userData)); 
        } catch (e) {
            userData = defaultUserData;
            setDefaultUserData();
        }

        return userData;
    }
    
    // Main App Functionality
    
    function destroyAllWebEntities() {
        for (i = 0; i < webEntitiesActive.length; i++) {
            Entities.deleteEntity(webEntitiesActive[i]);
        } 
    }

    function onZoneEnter (zoneID) {
        if (zoneID === zoneToHandle) {
            var userData = getAndParseUserData();

            if (userData.options.maxFPS) {
                maxFPS = userData.options.maxFPS;
            }

            if (userData.options.relative) {
                relative = userData.options.relative;
            }

            if (userData.webEntitiesToLoad) {
                webEntitiesToLoad = userData.webEntitiesToLoad;
            }

            for (i = 0; i < webEntitiesToLoad.length; i++) {
                var loaderEntityPosition = Entities.getEntityProperties(_this.entityID, ["position"]).position;
                var webPosition;

                if (relative === true) {
                    webPosition = {
                        "x": loaderEntityPosition.x + webEntitiesToLoad[i].position[0],
                        "y": loaderEntityPosition.y + webEntitiesToLoad[i].position[1],
                        "z": loaderEntityPosition.z + webEntitiesToLoad[i].position[2]
                    }
                } else {
                    webPosition = {
                        "x": webEntitiesToLoad[i].position[0],
                        "y": webEntitiesToLoad[i].position[1],
                        "z": webEntitiesToLoad[i].position[2]
                    }
                }
                
                var webRotation = {
                    "x": webEntitiesToLoad[i].rotation[0],
                    "y": webEntitiesToLoad[i].rotation[1],
                    "z": webEntitiesToLoad[i].rotation[2],
                    "w": 1
                }
                
                var webDimensions = {
                    "x": webEntitiesToLoad[i].dimensions[0],
                    "y": webEntitiesToLoad[i].dimensions[1],
                    "z": 0.0100
                }
                
                var webEntity = Entities.addEntity({
                    type: "Web",
                    position: webPosition,
                    rotation: webRotation,
                    dimensions: webDimensions,
                    sourceUrl: webEntitiesToLoad[i].url,
                    script: webEntitiesToLoad[i].script,
                    serverScripts: webEntitiesToLoad[i].serverScripts,
                    dpi: webEntitiesToLoad[i].dpi,
                    maxFPS: maxFPS
                }, "local");

                webEntitiesActive.push(webEntity);
            }
        }
    }
    
    function onZoneLeave (zoneID) {
        if (zoneID === zoneToHandle) {
            destroyAllWebEntities();
        }
    }
    
    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;
        var userData = getAndParseUserData();

        if (userData.options.zoneToHandle) {
            zoneToHandle = userData.options.zoneToHandle;
        }

        Entities.enterEntity.connect(onZoneEnter);
        Entities.leaveEntity.connect(onZoneLeave);
        
        Window.domainChanged.connect(function() {
            destroyAllWebEntities();
        });
    };

    this.unload = function (entityID) {
        Entities.enterEntity.disconnect(onZoneEnter);
        Entities.leaveEntity.disconnect(onZoneLeave);
        
        destroyAllWebEntities();
    };
    
});