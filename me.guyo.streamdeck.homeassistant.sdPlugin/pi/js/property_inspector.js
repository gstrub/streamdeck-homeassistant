//==============================================================================
/**
@file       property_inspector.js
@brief      Home Assistant Plugin
@copyright  (c) 2020, Guillaume STRUB
            (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function EntityIDPropertyInspector(inContext, inLanguage, inAction) {
    // Init ScenePI
    var instance = this;

    // Inherit from PI
    PropertyInspector.call(this, inContext, inLanguage, inAction);

    // Add entity ID field
    this.makeTextField("entity_id", "Entity ID");
}

function CallServicePropertyInspector(inContext, inLanguage, inAction) {
    // Init ScenePI
    var instance = this;

    // Inherit from PI
    PropertyInspector.call(this, inContext, inLanguage, inAction);

    // Add entity ID field
    this.makeTextField("service_domain", "Domain");
    this.makeTextField("service_name", "Service");
    this.makeTextArea("service_data", "Data");
}

function openSetupWindow() {
    if (!window.xtWindow || window.xtWindow.closed) {
        window.xtWindow  = window.open('setup.html', 'Setup Home Assitant Plugin');
    }
}

function PropertyInspector(inContext, inLanguage, inAction) {
    var instance = this;

    document.getElementById("open_setup").addEventListener("click", openSetupWindow);
    document.addEventListener("saveHassAuth", (inEvent) => instance.onSaveHassAuth(inEvent));

    // Public function to save the settings
    this.saveSettings = function () {
        saveSettings(inAction, inContext, settings);
    }

    // Public function to send data to the plugin
    this.sendToPlugin = function (inData) {
        sendToPlugin(inAction, inContext, inData);
    }

    // Generic value changed handleer
    this.genericValueChanged = function (inEvent) {
        // Save the new settings
        settings[inEvent.target.id] = inEvent.target.value;
        instance.saveSettings();
    }

    this.onSaveHassAuth = function(inEvent) {
        console.log(inEvent);
        globalSettings.host = inEvent.detail.host;
        globalSettings.token = inEvent.detail.token;
        saveGlobalSettings(inContext); 
    }

    function getValue(field_id) {
        if (settings && settings.hasOwnProperty(field_id)) {
            value = settings[field_id];
        } else {
            value = ""
        }
        return value;
    }

    this.makeTextArea = function (field_id, label) {
        var html = "<div type='textarea' class='sdpi-item'> \
                        <div class='sdpi-item-label up20' data-localize='" + label + "'>" + label + "</div> \
                        <div class='sdpi-item-value textarea'> \
                            <textarea type='textarea' id='" + field_id + "'>" + getValue(field_id) + "</textarea> \
                        </div> \
                    </div>";
        document.getElementById('placeholder').insertAdjacentHTML("beforeend", html);          
        document.getElementById(field_id).addEventListener('change', (ev) => this.genericValueChanged(ev));
    }
        
    this.makeTextField = function (field_id, label) {
        var html = "<div class='sdpi-item'> \
                        <div class='sdpi-item-label' id='scene-label'>" + label + "</div> \
                        <input class='sdpi-item-value' id='" + field_id + "' value='" + getValue(field_id) + "'> \
                    </div>";
        document.getElementById('placeholder').insertAdjacentHTML("beforeend", html);          
        document.getElementById(field_id).addEventListener('change', (ev) => this.genericValueChanged(ev));
    }
};