# Home Assistant Stream Deck plugin

Control your home directly from your Stream Deck!

# Supported Actions
 - Toggle entity on/off with state display
 - Call a service
 - Show entity state
 - Cycle colors for RGB lights

# Installation
Copy the me.guyo.streamdeck.homeassistant.sdplugin directory to the Plugins directory of your StreamDeck install (%AppData%\Elgato\StreamDeck\Plugins on Windows)

# Connection to your Home Assistant instance
Drop any action in your Stream Deck layout, then click the "Setup Home Assistant" button. In the pop-up window, fill out your instance's location and a long-lived access token (to create one, go to your Home Assistant profile page under the "Long-Lived Access Token" section). You can then test the connection and save those parameters when done. All actions share the same connection parameters, so you only have to run this once.
For security reasons, the location and access token fields are reset to default every time the "Setup Home Assistant" window is shown. Your settings will only be updated if you click the Save button

# Credits
 - Based on Elgato's Philips Hue plugin sample https://github.com/elgatosf/streamdeck-plugintemplate
 - Uses Home Assistant Javascript Websocket client https://github.com/home-assistant/home-assistant-js-websocket
 - Material Design Icons (c) Google https://github.com/google/material-design-icons
