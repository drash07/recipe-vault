'use strict';

function isNative()  { return window.Capacitor?.isNativePlatform() ?? false; }
function isIOS()     { return window.Capacitor?.getPlatform() === 'ios'; }
function isAndroid() { return window.Capacitor?.getPlatform() === 'android'; }
