//==============================================================================
/**
@file       app.js
@brief      Home Assistant Plugin
@copyright  (c) 2020, Guillaume STRUB
            (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

 const Hass = {
    connection: {},
    entities: {},
    connect: async function(host, token) {
        const auth = HAWS.createLongLivedTokenAuth(host, token);
        // Todo : try/catch on HASS invocations !
        this.connection = await HAWS.createConnection({ auth });
        // Subscribe to state changes 
        this.connection.subscribeEvents( ev => Plugin.onHassEvent(ev), "state_changed");
        // Subscribe to the entities collection
        this.entities = HAWS.entitiesColl(this.connection);
        await this.entities.refresh();
        // Fake subscriber function so that we continue getting updates to the entities collection
        this.entities.subscribe((x) => {});
    },

    getCurrentState: function(entity_id) {
        state = null;
        attributes = null;
        if (this.entities && this.entities.hasOwnProperty('state') && entity_id in this.entities.state ) {
            let entity = this.entities.state[entity_id]
            if (entity.hasOwnProperty('state'))
                state = entity.state;
            if (entity.hasOwnProperty('attributes'))
                attributes = entity.attributes;
        }
        return [state, attributes];
    }
}

// Setup the websocket and handle communication
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
    // Open the web socket to Stream Deck
    // Use 127.0.0.1 because Windows needs 300ms to resolve localhost
    websocket = new WebSocket('ws://127.0.0.1:' + inPort);

    // Web socket is connected
    websocket.onopen = function() {
        // Register plugin to Stream Deck
        registerPluginOrPI(inRegisterEvent, inPluginUUID);
        // Request the global settings of the plugin
        requestGlobalSettings(inPluginUUID);
    }

    // Web socked received a message
    websocket.onmessage = function(inEvent) {
        // Parse parameter from string to object
        var jsonObj = JSON.parse(inEvent.data);

        // Extract payload information
        var event = jsonObj['event'];
        var action = jsonObj['action'];
        var context = jsonObj['context'];
        var jsonPayload = jsonObj['payload'];
        var settings;

        // Key up event
        if(event === 'keyUp') {
            settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            var userDesiredState = jsonPayload['userDesiredState'];
            var state = jsonPayload['state'];
            Plugin.onKeyUp(context, settings, coordinates, userDesiredState, state);
        }
        else if(event === 'keyDown') {
            settings = jsonPayload['settings'];
            var coordinates = jsonPayload['coordinates'];
            var userDesiredState = jsonPayload['userDesiredState'];
            var state = jsonPayload['state'];
            Plugin.onKeyDown(context, settings, coordinates, userDesiredState, state);
        }
        else if(event === 'willAppear') {
            settings = jsonPayload['settings'];
            Plugin.onWillAppear(context, settings, action);
        }
        else if(event === 'willDisappear') {
            Plugin.onWillDisappear(context);
        }
        else if(event === 'didReceiveGlobalSettings') {
            console.log("didReceiveGlobalSettings");
            // Set global settings
            globalSettings = jsonPayload['settings'];
            
            var host, token;
            if (globalSettings.hasOwnProperty("host"))
                host = globalSettings.host;
            if (globalSettings.hasOwnProperty("token"))
                token = globalSettings.token;
            if (host && token)
                Hass.connect(host, token).then(Plugin.onHassConnected);                   
        }
        else if(event === 'didReceiveSettings') {
            settings = jsonPayload['settings'];
            Plugin.onDidReceiveSettings(context, settings);
        }
        else if(event === 'systemDidWakeUp') {
            Plugin.onSystemDidWakeUp();
        }
    };
}

const Plugin = {
    actions: {},

    onWillAppear: function(context, settings, action) {
        if (!(context in this.actions)) {
            if (action === "me.guyo.hass.toggle")
                this.actions[context] = new ToggleAction(context, settings);
            else if (action === "me.guyo.hass.light_color")
                this.actions[context] = new ColorAction(context, settings);
            else if (action === "me.guyo.hass.service")
                this.actions[context] = new CallServiceAction(context, settings);
            else if (action === "me.guyo.hass.state")
                this.actions[context] = new StateAction(context, settings);

            // Fetch current key state
            if (settings && settings.hasOwnProperty('entity_id')) {
                const [state, attributes] = Hass.getCurrentState(this.actions[context].getEntityId());
                this.actions[context].onStateChange(state, attributes);
            }
        }
    },

    onWillDisappear: function(context, settings, action) {
        // Remove current instance from array
        if (context in this.actions) {
            delete this.actions[context];
        }
    },

    onDidReceiveSettings: function(context, settings, action) {
        if (context in this.actions) {
            this.actions[context].setSettings(settings);
            if (settings && settings.hasOwnProperty('entity_id')) {
                const [state, attributes] = Hass.getCurrentState(this.actions[context].getEntityId());
                this.actions[context].onStateChange(state, attributes);
            }
        }
    },

    onKeyUp: function(context, settings, coordinates, userDesiredState, state) {
        if (context in this.actions) {
            this.actions[context].onKeyUp();
        }
    }, 

    onKeyDown: function(context, settings, coordinates, userDesiredState, state) {
        if (context in this.actions) {
            this.actions[context].onKeyDown();
        }
    }, 

    onHassConnected: function() {
        console.log("Home Assistant API connected.");
        // Fetch initial key states
        Plugin.refreshStatesFromHass();
    },

    onSystemDidWakeUp: function() {
        console.log("onSystemWakeUp");
        // Fetch initial key states
        Plugin.refreshStatesFromHass();
    },

    onHassEvent: function(ev) {
        if (this.actions) {
            Object.keys(this.actions).forEach(context => {
                if (this.actions[context].getEntityId() == ev.data.entity_id)
                    this.actions[context].onStateChange(ev.data.new_state.state, ev.data.new_state.attributes);
            });
        }
    },

    refreshStatesFromHass: function() {
        if (this.actions) {
            Object.keys(this.actions).forEach(context => {
                const [state, attributes] = Hass.getCurrentState(this.actions[context].getEntityId());
                this.actions[context].onStateChange(state, attributes);
            });
        };
    }
}
