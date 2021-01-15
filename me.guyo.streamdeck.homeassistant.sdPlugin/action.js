//==============================================================================
/**
@file       action.js
@brief      Home Assistant Plugin
@copyright  (c) 2020, Guillaume STRUB
            (c) 2019, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function Action(inContext, inSettings) {
    var context = inContext;
    var settings = inSettings;

    // Public function returning the context
    this.getContext = function() {
        return context;
    };

    // Public function returning the settings
    this.getSettings = function() {
        return settings;
    };

    this.getEntityId = function() {
        if (settings && settings.hasOwnProperty('entity_id')) {
            return settings.entity_id;
        }
        return "";
    }

    // Public function for settings the settings
    this.setSettings = function(inSettings) {
        settings = inSettings;
    };

    this.onKeyUp = function() {}
    this.onKeyDown = function() {}
    this.onStateChange = function(newState) {}
}

function CallServiceAction(inContext, inSettings) {
    // Inherit from Action
    Action.call(this, inContext, inSettings);

    this.onKeyUp = function() {
        (async () => {
            var settings = this.getSettings();
            if (settings && settings.hasOwnProperty('service_domain') && settings.hasOwnProperty('service_name') && settings.hasOwnProperty('service_data')) {
                HAWS.callService(Hass.connection, settings.service_domain, settings.service_name, JSON.parse(settings.service_data));
            }
        })();
    }
}

function StateAction(inContext, inSettings) {
    // Inherit from Action
    Action.call(this, inContext, inSettings);

    this.onStateChange = function(newState, attributes) {
        var context = this.getContext();
        text = newState;
        if (attributes && attributes.hasOwnProperty('unit_of_measurement'))
            text += ' ' + attributes.unit_of_measurement;

        setTitle(context, text);
    }
}

function ToggleAction(inContext, inSettings) {
    // Inherit from Action
    Action.call(this, inContext, inSettings);

    this.onKeyUp = function() {
        (async () => {
            var settings = this.getSettings();
            if (settings && settings.hasOwnProperty('entity_id')) {
                HAWS.callService(Hass.connection, "homeassistant", "toggle", {entity_id: settings.entity_id});
            }
        })();
    }

    this.onKeyDown = function() {}

    this.onStateChange = function(newState, attributes) {
        var context = this.getContext();
        if (newState == "on") {
            setState(context, 1);
        } else if (newState == "off") {
            setState(context, 0);
        }
    }
}

//https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
function hsv2hex(h,s,v) 
{                              
  let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);     

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;  
}   

loadAndColorizeImage = function (url, callback, inCanvas, inFillcolor) {
    var image = new Image();

    image.onload = function () {
        const canvas =
            inCanvas && Utils.isCanvas(inCanvas)
                ? inCanvas
                : document.createElement('canvas');

        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        const ctx = canvas.getContext('2d');
        if (inFillcolor) {
            ctx.fillStyle = inFillcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "destination-atop";
        }
        ctx.drawImage(this, 0, 0);
        // Get raw image data
        // callback && callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
};


function ColorAction(inContext, inSettings) {
    // Init BrightnessAction
    var instance = this;
    var hue = 0;
    var timer = null;
    var timerHasBeenCalled = false;

    // Inherit from Action
    Action.call(this, inContext, inSettings);

    this.onKeyUp = function() {
        if (timerHasBeenCalled == false) {
            (async () => {
                var settings = this.getSettings();
                if (settings && settings.hasOwnProperty('entity_id')) {
                    HAWS.callService(Hass.connection, "light", "toggle", {entity_id: settings.entity_id});
                }
            })();
        }
        clearInterval(timer);
        timer = null;
    }

    this.onKeyDown = function() {
        timer = setInterval(this.onTimer, 100);
        timerHasBeenCalled = false;
    }

    this.onTimer = function() {
        (async () => {
            var settings = instance.getSettings();
            if (settings && settings.hasOwnProperty('entity_id')) {
                HAWS.callService(Hass.connection, "light", "turn_on", {entity_id: settings.entity_id, hs_color: [hue, 100], brightness: 255 });
            }
        })();
        timerHasBeenCalled = true;
        hue = (hue + 30) % 360;
    }

    this.onStateChange = function(newState, attributes) {
        var context = this.getContext();
        if (newState == "on") {
            if (attributes && attributes.hasOwnProperty('hs_color') && attributes.hasOwnProperty('brightness')) {
                if (!timer)
                    hue = attributes.hs_color[0];
                color = hsv2hex(attributes.hs_color[0], attributes.hs_color[1] / 100, attributes.brightness/255);
                loadAndColorizeImage("images/key-light-white.png", (image) => setImage(context, image), null, color);
            }
            else 
                loadAndColorizeImage("images/key-light-on.png", (image) => setImage(context, image));
        } else if (newState == "off") {
            //setState(context, 0);
            loadAndColorizeImage("images/key-light-off.png", (image) => setImage(context, image));
        }

        
    }
}