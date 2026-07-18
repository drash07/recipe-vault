'use strict';

function trackEvent(name, props) {
  if (window.posthog) posthog.capture(name, props || {});
}

function identifyUser(userId, traits) {
  if (window.posthog) posthog.identify(userId, traits || {});
}
