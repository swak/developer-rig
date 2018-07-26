import { ViewerTypes } from '../constants/viewer-types';
import { RigRole } from '../constants/rig';
import { sign } from 'jsonwebtoken';

const OneYearMS: number = 365 * 24 * 60 * 60 * 1000;
const idSource: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const idLength: number = 15;

interface PubsubPerms {
  listen?: string[];
  send?: string[];
}

export interface TokenPayload {
  exp: number;
  user_id?: string;
  opaque_user_id: string;
  channel_id?: string;
  role: string;
  pubsub_perms: PubsubPerms;
}

export function generateOpaqueID(): string {
  let id = '';
  for (let i = 0; i < idLength; i++) {
    id += idSource.charAt(Math.floor(Math.random() * idSource.length));
  }
  return id;
}

export function createToken(role: string, isLinked: boolean, ownerID: string, secret: string, opaqueId: string, channelId?: string): string {
  const opaque = opaqueId ? opaqueId : generateOpaqueID();
  switch (role) {
    case ViewerTypes.LoggedOut:
      return createSignedToken('viewer', 'ARIG' + opaque, '', secret, channelId)
    case ViewerTypes.LoggedIn:
      if (isLinked) {
        return createSignedToken('viewer', 'URIG' + opaque, 'RIG' + ownerID, secret, channelId)
      } else {
        return createSignedToken('viewer', 'URIG' + opaque, '', secret, channelId)
      }
    case ViewerTypes.Broadcaster:
      return createSignedToken('broadcaster', 'URIG' + opaque, 'RIG' + ownerID, secret, channelId)
    default:
      return createSignedToken(RigRole, 'ARIG' + opaque, '', secret, channelId);
  }
}

export function createSignedToken(role: string, opaqueUserId: string, userId: string, secret: string, channelId?: string): string {
  let pubsub_perms: PubsubPerms = {
    listen: ['broadcast', 'global'],
  }
  if (role === 'broadcaster') {
    pubsub_perms.send = ['broadcast']
  } else if (role === RigRole) {
    pubsub_perms.send = ['*']
    pubsub_perms.listen = ['*']
  }

  const payload: TokenPayload = {
    exp: Math.floor(((Date.now() + OneYearMS) / 1000)),
    opaque_user_id: opaqueUserId,
    role: role,
    pubsub_perms: pubsub_perms,
  };
  if (channelId) {
    payload['channel_id'] = channelId;
  }
  if (userId !== '') {
    payload['user_id'] = userId;
  }

  return sign(payload, new Buffer(secret, 'base64'), { algorithm: 'HS256' });
}
