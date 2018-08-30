import { createSignedToken, TokenSpec } from './token';
import { ExtensionManifest } from '../core/models/manifest';
import { generateId } from './generate-id';
import { RigRole } from '../constants/rig';
import { ViewerTypes } from '../constants/viewer-types';
import { fetchExtensionManifest } from './api';

export async function fetchUserExtensionManifest(isLocal: boolean, userId: string, secret: string, clientId: string, version: string): Promise<ExtensionManifest> {
  const tokenSpec: TokenSpec = {
    role: RigRole,
    secret,
    userId,
  };
  const token = createSignedToken(tokenSpec);
  return await fetchExtensionManifest(isLocal, clientId, version, token);
}

export function createExtensionToken(newRole: string, linkedUserId: string, channelId: string, secret: string, opaqueId: string): string {
  const opaque = opaqueId ? opaqueId : generateId(15);
  switch (newRole) {
    case ViewerTypes.LoggedOut:
      return createSignedToken({ role: 'viewer', opaqueUserId: 'ARIG' + opaque, channelId, secret });
    case ViewerTypes.LoggedIn:
      return createSignedToken({ role: 'viewer', opaqueUserId: 'URIG' + opaque, userId: linkedUserId, channelId, secret });
    case ViewerTypes.Broadcaster:
      return createSignedToken({ role: 'broadcaster', opaqueUserId: 'URIG' + opaque, userId: channelId, channelId, secret });
    default:
      return createSignedToken({ role: RigRole, opaqueUserId: 'ARIG' + opaque, channelId, secret });
  }
}

export function createExtensionObject(
  manifest: ExtensionManifest,
  index: string,
  role: string,
  linkedUserId: string,
  channelId: string,
  secret: string,
  opaqueId: string
): ExtensionCoordinator.ExtensionObject {
  return {
    authorName: manifest.authorName,
    bitsEnabled: manifest.bitsEnabled,
    clientId: manifest.id,
    description: manifest.description,
    iconUrl: manifest.iconUrls["100x100"],
    id: manifest.id + ':' + index,
    name: manifest.name,
    requestIdentityLink: manifest.requestIdentityLink,
    sku: manifest.sku,
    state: manifest.state as ExtensionCoordinator.ExtensionState,
    summary: manifest.summary,
    token: createExtensionToken(role, linkedUserId, channelId, secret, opaqueId),
    vendorCode: manifest.vendorCode,
    version: manifest.version,
    views: manifest.views,
    whitelistedConfigUrls: manifest.whitelistedConfigUrls,
    whitelistedPanelUrls: manifest.whitelistedPanelUrls,
  };
}
