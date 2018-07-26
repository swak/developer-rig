import { verify } from 'jsonwebtoken';
import { createToken, createSignedToken, generateOpaqueID } from './token';
import { ViewerTypes } from '../constants/viewer-types';
import { RigRole } from '../constants/rig';
import { TokenPayload } from './token';

describe('token', () => {
  const secret = 'secret';
  const role = 'rig_role';
  const ouid = 'rig_ouid';
  const uid = 'rig_uid';
  const channelId = 'rig_channel';
  const ownerId = 'rig_owner';
  const isLinked = false;

  describe('createSignedToken', () => {
    const expected = {
      opaqueUserId: ouid,
      userId: uid,
      role: role,
      channelId: channelId,
    }

    it('should leave userId out if it is not specified', () => {
      const token = createSignedToken(role, ouid, '', secret, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(expected.opaqueUserId);
      expect(payload.channel_id).toBe(expected.channelId);
      expect(payload.role).toBe(expected.role);
      expect(payload.user_id).toBeUndefined();
    });

    it('should have userId if it is specified', () => {
      const token = createSignedToken(role, ouid, uid, secret, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(expected.opaqueUserId);
      expect(payload.channel_id).toBe(expected.channelId);
      expect(payload.role).toBe(expected.role);
      expect(payload.user_id).toBe(expected.userId);
    });
  });

  describe('createToken', () => {
    const LOGGED_OUT_PAYLOAD = {
      channel_id: channelId,
      opaque_user_id: 'ARIG'+ouid,
      pubsub_perms: {
        listen: ['broadcast'],
      },
      role: 'viewer',
    };

    const LOGGED_IN_UNLINKED_PAYLOAD = {
      channel_id: channelId,
      opaque_user_id: 'URIG'+ouid,
      pubsub_perms: {
        listen: ['broadcast'],
      },
      role: 'viewer',
    };

    const LOGGED_IN_LINKED_PAYLOAD = {
      channel_id: channelId,
      opaque_user_id: 'URIG'+ouid,
      pubsub_perms: {
        listen: ['broadcast'],
      },
      role: 'viewer',
      user_id: 'RIG'+ownerId,
    };

    const BROADCASTER_PAYLOAD = {
      channel_id: channelId,
      opaque_user_id: 'URIG'+ouid,
      pubsub_perms: {
        listen: ['broadcast'],
        send: ['broadcast'],
      },
      role: 'broadcaster',
      user_id: 'RIG'+ownerId,
    };

    it('should create a token for logged out unlinked users', () => {
      const token = createToken(ViewerTypes.LoggedOut, isLinked, ownerId, secret, ouid, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(LOGGED_OUT_PAYLOAD.opaque_user_id);
      expect(payload.role).toBe(LOGGED_OUT_PAYLOAD.role);
      expect(payload.pubsub_perms.send).toBeUndefined();
      expect(payload.pubsub_perms.listen).toEqual(['broadcast','global']);
    });

    it('should create a token for logged in unlinked users', () => {
      const token = createToken(ViewerTypes.LoggedIn, isLinked, ownerId, secret, ouid, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(LOGGED_IN_UNLINKED_PAYLOAD.opaque_user_id);
      expect(payload.role).toBe(LOGGED_IN_UNLINKED_PAYLOAD.role);
      expect(payload.pubsub_perms.send).toBeUndefined();
      expect(payload.pubsub_perms.listen).toEqual(['broadcast','global']);
    });

    it('should create a token for logged in linked users', () => {
      const token = createToken(ViewerTypes.LoggedIn, !isLinked, ownerId, secret, ouid, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(LOGGED_IN_LINKED_PAYLOAD.opaque_user_id);
      expect(payload.user_id).toBe(LOGGED_IN_LINKED_PAYLOAD.user_id);
      expect(payload.role).toBe(LOGGED_IN_LINKED_PAYLOAD.role);
      expect(payload.pubsub_perms.send).toBeUndefined();
      expect(payload.pubsub_perms.listen).toEqual(['broadcast','global']);
    });

    it('should create a token for broadcaster users', () => {
      const token = createToken(ViewerTypes.Broadcaster, isLinked, ownerId, secret, ouid, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.opaque_user_id).toBe(BROADCASTER_PAYLOAD.opaque_user_id);
      expect(payload.role).toBe(BROADCASTER_PAYLOAD.role);
      expect(payload.user_id).toBe(BROADCASTER_PAYLOAD.user_id)
      expect(payload.pubsub_perms.send).toEqual(['broadcast']);
      expect(payload.pubsub_perms.listen).toEqual(['broadcast','global']);
    });

    it('should create a token for the rig', () => {
      const token = createToken(RigRole, isLinked, ownerId, secret, ouid, channelId);
      const payload = verify(token, Buffer.from(secret, 'base64')) as TokenPayload;

      expect(payload.role).toBe(RigRole);
      expect(payload.pubsub_perms.send).toEqual(['*']);
      expect(payload.pubsub_perms.listen).toEqual(['*']);
    });

    it('generateOpaqueId should generate an opaque ID we expect', () => {
      const idLength = 15;
      const genOpaqueId = generateOpaqueID();
      expect(genOpaqueId).toHaveLength(idLength);
    });
  });
});
