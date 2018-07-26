import { createToken } from './token';
import { ExtensionManifest } from '../core/models/manifest';
import { RigExtension } from '../core/models/rig';

export function createExtensionObject(
  manifest: ExtensionManifest,
  index: string,
  role: string,
  isLinked: boolean,
  ownerID: string,
  secret: string,
  opaqueId: string): RigExtension {
  return {
    authorName: manifest.author_name,
    clientId: manifest.id,
    description: manifest.description,
    iconUrl: manifest.icon_url,
    id: manifest.id + ':' + index,
    name: manifest.name,
    requestIdentityLink: manifest.request_identity_link,
    sku: manifest.sku,
    state: manifest.state,
    summary: manifest.summary,
    token: createToken(role, isLinked, ownerID, secret, opaqueId),
    vendorCode: manifest.vendor_code,
    version: manifest.version,
    views: manifest.views,
    whitelistedConfigUrls: manifest.whitelisted_config_urls,
    whitelistedPanelUrls: manifest.whitelisted_panel_urls,
    bitsEnabled: manifest.bits_enabled,
  };
}
