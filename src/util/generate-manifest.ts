import { ExtensionManifest } from '../core/models/manifest';
import { ExtensionState, ExtensionViewType } from '../constants/extension-coordinator';
import { generateId } from './generate-id';
import { toSnakeCase } from './case';

export function generateManifest(baseUri: string, ownerName: string, name: string, types: string[]): ExtensionManifest {
  return {
    authorName: ownerName,
    bitsEnabled: false,
    description: 'Description for ' + name,
    iconUrls: { "100x100": "https://media.forgecdn.net/avatars/158/128/636650453584584748.png" },
    id: generateId(30),
    name,
    requestIdentityLink: false,
    sku: "",
    state: ExtensionState.Testing,
    summary: 'Summary for ' + name,
    vendorCode: "",
    version: "0.0.1",
    views: {
      ...getViews(),
      config: {
        canLinkExternalContent: false,
        viewerUrl: `${baseUri}/config.html`,
      },
      liveConfig: {
        canLinkExternalContent: false,
        viewerUrl: `${baseUri}/live_config.html`,
      },
    },
    whitelistedConfigUrls: [],
    whitelistedPanelUrls: [],
  };

  function getViews() {
    const views: { [key: string]: any } = {};
    types.forEach((type) => {
      views[type] = getView(type);
    })
    return views;

    function getView(type: string) {
      const page: string = toSnakeCase(type);
      const viewerUrl = `${baseUri}/${type === ExtensionViewType.Component ? 'video_component' : page}.html`;
      switch (type) {
        case ExtensionViewType.Panel:
          return {
            canLinkExternalContent: false,
            height: 300,
            viewerUrl: viewerUrl,
          };
        case ExtensionViewType.Mobile:
          return {
            viewerUrl: viewerUrl,
          };
        case ExtensionViewType.Overlay:
          return {
            canLinkExternalContent: false,
            viewerUrl: viewerUrl,
          };
        case ExtensionViewType.Component:
          return {
            aspectHeight: 4000,
            aspectWidth: 3000,
            canLinkExternalContent: false,
            size: 0,
            viewerUrl: viewerUrl,
            zoom: true,
            zoomPixels: 1024,
          };
      }
    }
  }
}
