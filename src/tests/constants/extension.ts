import { MobileOrientation } from '../../constants/mobile';
import { ExtensionManifest } from '../../core/models/manifest';
import { RigExtensionView } from '../../core/models/rig';

export const createExtensionManifestForTest = (): ExtensionManifest => ({
  authorName: 'test',
  bitsEnabled: true,
  description: 'test',
  iconUrls: {
    '100x100': 'test',
  },
  id: 'test',
  name: 'test',
  requestIdentityLink: false,
  sku: 'test',
  state: 'test',
  summary: 'test',
  vendorCode: 'test',
  version: '0.0.1',
  views: {
    panel: {
      canLinkExternalContent: false,
      height: 300,
      viewerUrl: 'https://test:8080',
    },
    config: {
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
    },
    liveConfig: {
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
    },
    component: {
      aspectHeight: 3000,
      aspectWidth: 2500,
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
      size: 1024,
      zoom: false,
      zoomPixels: 24,
    }
  },
  whitelistedConfigUrls: [],
  whitelistedPanelUrls: [],
});

export const createExtensionForTest = (): ExtensionCoordinator.ExtensionObject => ({
  authorName: 'test',
  clientId: 'mockClientId',
  bitsEnabled: false,
  description: 'description',
  iconUrl: 'iconUrl',
  iconUrls: { square100: '100x100' },
  id: 'id',
  name: 'name',
  requestIdentityLink: false,
  sku: 'sku',
  summary: 'summary',
  token: 'token',
  vendorCode: 'vendorCode',
  version: '0.1',
  state: 'Released' as ExtensionCoordinator.ExtensionState,
  views: {
    config: {
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
    },
    component: {
      aspectHeight: 3000,
      aspectWidth: 2500,
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
      zoom: false,
      zoomPixels: 100,
    },
    liveConfig: {
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
    },
    mobile: {
      viewerUrl: 'https://test:8080',
    },
    panel: {
      canLinkExternalContent: false,
      height: 300,
      viewerUrl: 'https://test:8080',
    },
    videoOverlay: {
      canLinkExternalContent: false,
      viewerUrl: 'https://test:8080',
    },
  },
  whitelistedConfigUrls: ['foo'],
  whitelistedPanelUrls: ['bar'],
});

export function createViewsForTest(numOfViews: number, type: string, role: string, extras?: any): RigExtensionView[] {
  let ex = {
    x: 0,
    y: 0,
    orientation: MobileOrientation.Portrait,
  }
  const extViews: RigExtensionView[] = [];
  if (extras) {
    ex.x = extras.x;
    ex.y = extras.y;
  }

  for (let i = 0; i < numOfViews; i++) {
    extViews.push({
      channelId: 'twitch',
      id: (extViews.length + 1).toString(),
      type: type,
      mode: 'viewer',
      linked: false,
      linkedUserId: '',
      opaqueId: 'ARIGopaqueId',
      role: role,
      x: ex.x,
      y: ex.y,
      isPopout: false,
      orientation: ex.orientation,
      features: {
        isChatEnabled: true,
      }
    })
  }

  return extViews;
}
