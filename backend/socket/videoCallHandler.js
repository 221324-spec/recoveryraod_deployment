// backend/socket/videoCallHandler.js
// Socket.IO signaling only (WebRTC media stays peer-to-peer)

const activeCallPartnerByUserId = new Map(); // userId -> partnerUserId

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
}

async function isUserOnline(io, userId) {
  if (!userId) return false;
  const roomName = `user:${userId}`;
  try {
    // Works in Socket.IO v4+ (adapter fetch)
    const sockets = await io.in(roomName).fetchSockets();
    return sockets.length > 0;
  } catch (e) {
    // Fallback: if fetchSockets not supported by adapter, assume online when room exists
    const room = io.sockets.adapter.rooms.get(roomName);
    return !!(room && room.size);
  }
}

function setPartner(userId, partnerId) {
  if (!userId || !partnerId) return;
  activeCallPartnerByUserId.set(String(userId), String(partnerId));
}

function clearPartner(userId) {
  if (!userId) return;
  activeCallPartnerByUserId.delete(String(userId));
}

function getPartner(userId) {
  if (!userId) return null;
  return activeCallPartnerByUserId.get(String(userId)) || null;
}

function isBusy(userId) {
  return !!getPartner(userId);
}

module.exports = function videoCallHandler(io, socket) {
  // We rely on your existing `join` event to set this.
  const getSelfUserId = () => normalizeId(socket.userId || socket.data?.userId);

  const safeEmitToUser = (userId, event, payload) => {
    if (!userId) return;
    io.to(`user:${userId}`).emit(event, payload);
  };

  // Ring first (no SDP yet) so receiver gets an immediate incoming call UI.
  socket.on('call-ring', async (payload = {}) => {
    try {
      const fromUserId = normalizeId(payload.from) || getSelfUserId();
      const userToCall = normalizeId(payload.userToCall);

      if (!fromUserId) {
        socket.emit('call-failed', { reason: 'unauthorized', message: 'Missing caller identity' });
        return;
      }

      if (!userToCall) {
        socket.emit('call-failed', { reason: 'bad_request', message: 'Missing userToCall' });
        return;
      }

      if (String(fromUserId) === String(userToCall)) {
        socket.emit('call-failed', { reason: 'bad_request', message: 'Cannot call yourself' });
        return;
      }

      const targetOnline = await isUserOnline(io, userToCall);
      if (!targetOnline) {
        socket.emit('call-failed', { reason: 'offline', message: 'User is currently offline' });
        return;
      }

      if (isBusy(userToCall)) {
        socket.emit('user-busy', { userId: userToCall, message: 'User is currently in another call' });
        return;
      }

      if (isBusy(fromUserId)) {
        socket.emit('call-failed', { reason: 'busy', message: 'You are already in a call' });
        return;
      }

      // Mark both as busy (pending ring)
      setPartner(fromUserId, userToCall);
      setPartner(userToCall, fromUserId);

      safeEmitToUser(userToCall, 'incoming-call', {
        signal: null,
        from: fromUserId,
        callerName: payload.callerName || payload.name || 'Unknown',
        callerAvatar: payload.callerAvatar || null,
        phase: 'ring'
      });
    } catch (err) {
      console.error('[videoCallHandler] call-ring error:', err);
      socket.emit('call-failed', { reason: 'server_error', message: 'Failed to ring user' });
    }
  });

  socket.on('call-user', async (payload = {}) => {
    try {
      const fromUserId = normalizeId(payload.from) || getSelfUserId();
      const userToCall = normalizeId(payload.userToCall);

      if (!fromUserId) {
        socket.emit('call-failed', { reason: 'unauthorized', message: 'Missing caller identity' });
        return;
      }

      if (!userToCall) {
        socket.emit('call-failed', { reason: 'bad_request', message: 'Missing userToCall' });
        return;
      }

      if (String(fromUserId) === String(userToCall)) {
        socket.emit('call-failed', { reason: 'bad_request', message: 'Cannot call yourself' });
        return;
      }

      const targetOnline = await isUserOnline(io, userToCall);
      if (!targetOnline) {
        socket.emit('call-failed', { reason: 'offline', message: 'User is currently offline' });
        return;
      }

      // If a ring is already pending between these two users, allow attaching the offer.
      const existingPartnerForTarget = getPartner(userToCall);
      const existingPartnerForCaller = getPartner(fromUserId);
      const isSamePairPending =
        String(existingPartnerForTarget || '') === String(fromUserId) &&
        String(existingPartnerForCaller || '') === String(userToCall);

      if (!isSamePairPending) {
        if (isBusy(userToCall)) {
          socket.emit('user-busy', { userId: userToCall, message: 'User is currently in another call' });
          return;
        }

        if (isBusy(fromUserId)) {
          socket.emit('call-failed', { reason: 'busy', message: 'You are already in a call' });
          return;
        }

        // Mark both as busy (pending)
        setPartner(fromUserId, userToCall);
        setPartner(userToCall, fromUserId);
      }

      safeEmitToUser(userToCall, 'incoming-call', {
        signal: payload.signalData,
        from: fromUserId,
        callerName: payload.callerName || payload.name || 'Unknown',
        callerAvatar: payload.callerAvatar || null
      });
    } catch (err) {
      console.error('[videoCallHandler] call-user error:', err);
      socket.emit('call-failed', { reason: 'server_error', message: 'Failed to place call' });
    }
  });

  socket.on('accept-call', async (payload = {}) => {
    try {
      const fromUserId = getSelfUserId() || normalizeId(payload.from);
      const toUserId = normalizeId(payload.to);

      if (!fromUserId || !toUserId) return;

      const callerOnline = await isUserOnline(io, toUserId);
      if (!callerOnline) {
        // Caller disappeared; cleanup both
        clearPartner(fromUserId);
        clearPartner(toUserId);
        socket.emit('call-failed', { reason: 'offline', message: 'Caller went offline' });
        return;
      }

      safeEmitToUser(toUserId, 'call-accepted', {
        signal: payload.signal,
        from: fromUserId
      });
    } catch (err) {
      console.error('[videoCallHandler] accept-call error:', err);
    }
  });

  socket.on('reject-call', (payload = {}) => {
    try {
      const fromUserId = getSelfUserId();
      const toUserId = normalizeId(payload.to);
      if (!fromUserId || !toUserId) return;

      // Clear both sides
      clearPartner(fromUserId);
      clearPartner(toUserId);

      safeEmitToUser(toUserId, 'call-rejected', {
        from: fromUserId,
        message: payload.message || 'Call rejected'
      });
    } catch (err) {
      console.error('[videoCallHandler] reject-call error:', err);
    }
  });

  socket.on('end-call', (payload = {}) => {
    try {
      const fromUserId = getSelfUserId();
      const toUserId = normalizeId(payload.to) || getPartner(fromUserId);
      if (!fromUserId || !toUserId) return;

      clearPartner(fromUserId);
      clearPartner(toUserId);

      safeEmitToUser(toUserId, 'call-ended', { from: fromUserId, reason: payload.reason || 'ended' });
      socket.emit('call-ended', { from: toUserId, reason: payload.reason || 'ended' });
    } catch (err) {
      console.error('[videoCallHandler] end-call error:', err);
    }
  });

  socket.on('disconnect', () => {
    try {
      const fromUserId = getSelfUserId();
      const partner = getPartner(fromUserId);
      if (fromUserId) clearPartner(fromUserId);
      if (partner) {
        clearPartner(partner);
        safeEmitToUser(partner, 'call-ended', { from: fromUserId, reason: 'disconnect' });
      }
    } catch (err) {
      console.error('[videoCallHandler] disconnect cleanup error:', err);
    }
  });
};
