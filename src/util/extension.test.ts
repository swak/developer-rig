import { createExtensionObject, createExtensionToken, fetchUserExtensionManifest } from './extension';
import { ExtensionManifest } from '../core/models/manifest';
import { RigRole } from '../constants/rig';
import { TokenPayload } from './token';
import { verify } from 'jsonwebtoken';
import { ViewerTypes } from '../constants/viewer-types';

describe('extension', () => {
  const manifest: ExtensionManifest = {
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
        viewerUrl: 'test'
      },
      config: {
        canLinkExternalContent: false,
        viewerUrl: 'test'
      },
      liveConfig: {
        canLinkExternalContent: false,
        viewerUrl: 'test',
      },
      component: {
        aspectHeight: 3000,
        aspectWidth: 2500,
        canLinkExternalContent: false,
        viewerUrl: 'test',
        size: 1024,
        zoom: false,
        zoomPixels: 24,
      }
    },
    whitelistedConfigUrls: [],
    whitelistedPanelUrls: [],
  };

  const index = '0';
  const role = ViewerTypes.LoggedOut;
  const channelId = 'test';
  const secret = 'test';
  const opaqueId = 'testOpaqueId';

  it("fetches a user's extension with the correct data", async () => {
    const globalAny = global as any;
    const expected = { id: 'test' };
    globalAny.fetch = jest.fn().mockImplementation(() => Promise.resolve({ status: 200, json: () => Promise.resolve({ extensions: [expected]}) }));
    const actual = await fetchUserExtensionManifest(true, 'userId', 'secret', 'clientId', 'version');
    expect(actual).toEqual(expected);
  });

  it('creates an extension with the correct data', () => {
    const expected = {
      authorName: manifest.authorName,
      bitsEnabled: manifest.bitsEnabled,
      clientId: manifest.id,
      description: manifest.description,
      iconUrl: manifest.iconUrls['100x100'],
      iconUrls: { square100: manifest.iconUrls['100x100'] },
      id: manifest.id + ':' + index,
      name: manifest.name,
      requestIdentityLink: manifest.requestIdentityLink,
      sku: manifest.sku,
      state: manifest.state,
      summary: manifest.summary,
      token: createExtensionToken(role, '', channelId, secret, opaqueId),
      vendorCode: manifest.vendorCode,
      version: manifest.version,
      views: {
        panel: {
          canLinkExternalContent: false,
          height: 300,
          viewerUrl: 'test'
        },
        config: {
          canLinkExternalContent: false,
          viewerUrl: 'test'
        },
        liveConfig: {
          canLinkExternalContent: false,
          viewerUrl: 'test',
        },
        component: {
          aspectHeight: 3000,
          aspectWidth: 2500,
          canLinkExternalContent: false,
          size: 1024,
          viewerUrl: 'test',
          zoom: false,
          zoomPixels: 24,
        }
      },
      whitelistedConfigUrls: manifest.whitelistedConfigUrls,
      whitelistedPanelUrls: manifest.whitelistedPanelUrls,
    };

    const result = createExtensionObject(manifest, index, role, '', channelId, secret, opaqueId);
    expect(result).toEqual(expected);
  });
});

describe('createExtensionToken', () => {
  const secret = 'secret';
  const ouid = 'rig_ouid';
  const channelId = '999999999';
  const linkedUserId = '888888888';

  const LOGGED_OUT_PAYLOAD = {
    channel_id: channelId,
    opaque_user_id: 'ARIG' + ouid,
    pubsub_perms: {
      listen: ['broadcast'],
    },
    role: 'viewer',
  };

  const LOGGED_IN_UNLINKED_PAYLOAD = {
    channel_id: channelId,
    opaque_user_id: 'URIG' + ouid,
    pubsub_perms: {
      listen: ['broadcast'],
    },
    role: 'viewer',
  };

  const LOGGED_IN_LINKED_PAYLOAD = {
    channel_id: channelId,
    opaque_user_id: 'URIG' + ouid,
    pubsub_perms: {
      listen: ['broadcast'],
    },
    role: 'viewer',
    user_id: linkedUserId,
  };

  const BROADCASTER_PAYLOAD = {
    channel_id: channelId,
    opaque_user_id: 'URIG' + ouid,
    pubsub_perms: {
      listen: ['broadcast'],
      send: ['broadcast'],
    },
    role: 'broadcaster',
    user_id: channelId,
  };

  it('should create a token for logged-out users', () => {
    const token = createExtensionToken(ViewerTypes.LoggedOut, '', channelId, secret, ouid);
    const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

    expect(payload.opaque_user_id).toBe(LOGGED_OUT_PAYLOAD.opaque_user_id);
    expect(payload.role).toBe(LOGGED_OUT_PAYLOAD.role);
    expect(payload.pubsub_perms.send).toBeUndefined();
    expect(payload.pubsub_perms.listen).toEqual(['broadcast', 'global']);
  });

  it('should create a token for unlinked logged-in users', () => {
    const token = createExtensionToken(ViewerTypes.LoggedIn, '', channelId, secret, ouid);
    const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

    expect(payload.opaque_user_id).toBe(LOGGED_IN_UNLINKED_PAYLOAD.opaque_user_id);
    expect(payload.role).toBe(LOGGED_IN_UNLINKED_PAYLOAD.role);
    expect(payload.pubsub_perms.send).toBeUndefined();
    expect(payload.pubsub_perms.listen).toEqual(['broadcast', 'global']);
  });

  it('should create a token for linked logged-in users', () => {
    const token = createExtensionToken(ViewerTypes.LoggedIn, linkedUserId, channelId, secret, ouid);
    const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

    expect(payload.opaque_user_id).toBe(LOGGED_IN_LINKED_PAYLOAD.opaque_user_id);
    expect(payload.user_id).toBe(LOGGED_IN_LINKED_PAYLOAD.user_id);
    expect(payload.role).toBe(LOGGED_IN_LINKED_PAYLOAD.role);
    expect(payload.pubsub_perms.send).toBeUndefined();
    expect(payload.pubsub_perms.listen).toEqual(['broadcast', 'global']);
  });

  it('should create a token for broadcaster users', () => {
    const token = createExtensionToken(ViewerTypes.Broadcaster, '', channelId, secret, ouid);
    const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

    expect(payload.opaque_user_id).toBe(BROADCASTER_PAYLOAD.opaque_user_id);
    expect(payload.role).toBe(BROADCASTER_PAYLOAD.role);
    expect(payload.user_id).toBe(BROADCASTER_PAYLOAD.user_id)
    expect(payload.pubsub_perms.send).toEqual(['broadcast']);
    expect(payload.pubsub_perms.listen).toEqual(['broadcast', 'global']);
  });

  it('should create a token for the rig', () => {
    const token = createExtensionToken(RigRole, '', channelId, secret, ouid);
    const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

    expect(payload.role).toBe(RigRole);
    expect(payload.pubsub_perms.send).toEqual(['*']);
    expect(payload.pubsub_perms.listen).toEqual(['*']);
  });
});
