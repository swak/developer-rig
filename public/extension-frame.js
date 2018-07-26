let extensionFrameAPI, parameters;
window.addEventListener('message', proxyIframeEvent);

function proxyIframeEvent(event) {
  const data = event.data;
  switch (data.action) {
    case 'extension-frame-init':
      const ExtensionFrame = window['extension-coordinator'].ExtensionFrame;
      parameters = event.data.extension;
      parameters.parentElement = document.getElementById('extension-frame');
      parameters.dobbin = { trackEvent: () => { } };
      extensionFrameAPI = new ExtensionFrame(parameters);
      break;
    case 'extension-frame-authorize':
      event.source.postMessage({
        action: "extension-frame-authorize-response",
        response: {
          channelId: parameters.channelId,
          clientId: parameters.extension.clientId,
          token: parameters.extension.token,
          userId: JSON.parse(atob(parameters.extension.token.split('.')[1])).opaque_user_id,
        },
      }, event.origin);
      break;
    case 'extension-frame-pubsub':
      const { channelId, target, contentType, message } = e.data;
      const url = `${window.origin}/extensions/message/${channelId}`;
      fetch(url, {
        body: JSON.stringify({ targets: [target], content_type: contentType, message }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }).catch(reason => console.error(endpoint, reason));
      break;
    case 'twitch-ext-auth':
    case 'twitch-ext-context':
      const ext = document.getElementById('extension-frame').getElementsByTagName('iframe')[0].contentWindow;
      ext.postMessage(data, '*');
      break;
    case 'twitch-ext-rig-log':
      window.parent.postMessage(data, '*');
      break;
    default:
      break;
  }
}
