import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/env';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map(); // Store all listeners for re-attachment
    this.currentUserId = null; // Store the current user ID for reconnection
  }

  connect(userId) {
    // If no userId provided, try to get from localStorage
    if (!userId) {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || parsed._id || parsed.userId;
        }
      } catch (e) { /* ignore */ }
    }
    
    // Store the userId for reconnection
    if (userId) {
      this.currentUserId = userId;
    }
    
    if (this.socket && this.isConnected) {
      console.log('Socket: Already connected, re-joining room for userId:', userId || this.currentUserId);
      if (userId || this.currentUserId) {
        this.socket.emit('join', { userId: userId || this.currentUserId });
      }
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const socketUrl = getSocketUrl();
    console.log('Socket: Connecting to Socket.IO server at', socketUrl, 'with userId:', userId);
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server:', this.socket.id);
      this.isConnected = true;
      
      // Join user room for receiving messages
      const userIdToJoin = userId || this.currentUserId;
      if (userIdToJoin) {
        this.socket.emit('join', { userId: userIdToJoin });
        console.log('✅ Joined room for userId:', userIdToJoin);
      } else {
        console.warn('⚠️ No userId available to join room');
      }
      
      // Re-attach all stored listeners after reconnect
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          console.log('Re-attaching listener for:', event);
          this.socket.on(event, callback);
        });
      });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts');
      if (this.currentUserId) {
        this.socket.emit('join', { userId: this.currentUserId });
        console.log('✅ Re-joined room after reconnect for userId:', this.currentUserId);
      }
    });

    return this.socket;
  }

  // Listen for new messages (convenience method)
  onNewMessage(callback) {
    this.on('message:new', callback);
  }

  // Generic listener - stores for re-attachment on reconnect
  on(event, callback) {
    // Store the listener
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Attach immediately if socket exists
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
      } else {
        this.listeners.delete(event);
      }
    }
    // Remove from socket
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Send message via socket (accepts either object payload or (to, message))
  sendMessage(arg1, arg2) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected, cannot send message');
      return;
    }

    let payload = {};

    // If first arg is an object, assume it's the full payload
    if (arg1 && typeof arg1 === 'object' && !arg2) {
      payload = arg1;
    } else {
      // Otherwise treat as (to, messageContentOrObject)
      const to = arg1;
      const messageArg = arg2;

      // Try to infer senderId from stored user profile
      let senderId = null;
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          senderId = user && (user.id || user._id || user.userId) ? (user.id || user._id || user.userId) : null;
        }
      } catch (e) {
        // ignore parsing errors
      }

      // If second arg is an object (client-side message), extract content and metadata
      if (messageArg && typeof messageArg === 'object') {
        payload = {
          senderId,
          receiverId: to,
          content: messageArg.content || '',
          messageType: messageArg.messageType || 'text',
          timestamp: messageArg.timestamp || messageArg.createdAt || new Date().toISOString(),
          clientId: messageArg._id || null
        };
      } else {
        // Plain string message
        payload = {
          senderId,
          receiverId: to,
          content: messageArg
        };
      }
    }

    console.log('Sending Socket.IO message payload:', payload);
    this.socket.emit('message:send', payload);
    console.log('Socket.IO message emitted');
  }

  // Remove message listener
  offNewMessage() {
    if (this.socket) {
      this.socket.off('message:new');
    }
  }

  // Emit arbitrary events to server
  emit(event, payload) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, payload);
    } else {
      console.warn('Socket not connected — cannot emit', event);
    }
  }

  // =============================================
  // NGO Dashboard Methods
  // =============================================
  
  // Subscribe to NGO dashboard events
  subscribeToNgoDashboard(userId) {
    this.emit('ngo:subscribe', { userId });
    console.log('NGO: Subscribed to dashboard events');
  }

  // Request full data sync for NGO dashboard
  requestNgoSync(organizationId) {
    this.emit('ngo:sync:request', { organizationId });
    console.log('NGO: Requested data sync for organization:', organizationId);
  }

  // Notify supervisor assignment
  notifySupervisorAssignment(supervisorId, organizationId) {
    this.emit('ngo:supervisor:assign', { supervisorId, organizationId });
  }

  // Notify patient assignment
  notifyPatientAssignment(patientId, organizationId) {
    this.emit('ngo:patient:assign', { patientId, organizationId });
  }

  // Listen for NGO events
  onNgoSupervisorAssigned(callback) {
    this.on('ngo:supervisor:assigned', callback);
  }

  onNgoPatientAssigned(callback) {
    this.on('ngo:patient:assigned', callback);
  }

  onNgoSupervisorRemoved(callback) {
    this.on('ngo:supervisor:removed', callback);
  }

  onNgoPatientRemoved(callback) {
    this.on('ngo:patient:removed', callback);
  }

  onNgoSyncResponse(callback) {
    this.on('ngo:sync:response', callback);
  }

  onNgoStatsUpdate(callback) {
    this.on('ngo:stats:initial', callback);
    this.on('ngo:stats:updated', callback);
  }

  // Listen for patient mood updates (for NGO dashboard)
  onPatientMoodUpdate(callback) {
    this.on('patient:mood:created', callback);
  }

  // Listen for crisis alerts
  onCrisisAlert(callback) {
    this.on('crisis:alert', callback);
  }

  // =============================================
  // Admin Dashboard Methods
  // =============================================
  
  subscribeToAdminDashboard(userId) {
    this.emit('admin:subscribe', { userId });
    console.log('Admin: Subscribed to dashboard events');
  }

  onAdminStatsUpdate(callback) {
    this.on('stats:updated', callback);
  }

  onSystemUpdate(callback) {
    this.on('system:update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export default new SocketService();