import { apiFetch } from '../config/env';

// API service for chat functionality - Uses REAL logged-in user data

// Helper to get current user from localStorage (set during login)
export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) { 
    console.error('Error parsing user from localStorage:', e);
  }
  return null;
};

// Helper to get current user ID from localStorage
export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user?.id || user?._id || user?.userId || null;
};

// Helper to get current user role from localStorage
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user?.role?.toLowerCase() || null;
};

// Get the assigned supervisor info for a patient
export const getAssignedSupervisor = () => {
  const user = getCurrentUser();
  if (user?.role?.toLowerCase() === 'patient' && user?.assignedSupervisor) {
    // assignedSupervisor might be an object (populated) or just an ID
    if (typeof user.assignedSupervisor === 'object') {
      return user.assignedSupervisor;
    }
    // If it's just an ID, return it as-is
    return { id: user.assignedSupervisor, _id: user.assignedSupervisor };
  }
  return null;
};

// Build headers with auth token
const getHeaders = (includeContentType = false) => {
  const headers = {};
  const token = localStorage.getItem('token');
  
  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export const apiService = {
  // Get patients for a supervisor
  async getPatients() {
    try {
      const supervisorId = getCurrentUserId();
      if (!supervisorId) {
        console.error('No supervisor ID found');
        return [];
      }
      const response = await apiFetch(`/api/supervisors/${supervisorId}/patients`, {
        headers: getHeaders()
      });
      const data = await response.json();
      return data.patients || data.data?.patients || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },
  
  // Get messages between current user and the other user
  async getMessages(otherUserId) {
    try {
      if (!otherUserId) {
        console.log('No target user ID provided for getMessages');
        return [];
      }
      
      console.log('🔍 chatService.getMessages: Fetching messages with:', otherUserId);
      
      const response = await apiFetch(`/api/messages/conversation/${otherUserId}`, {
        headers: getHeaders()
      });
      
      console.log('🔍 chatService.getMessages: Response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('🔍 chatService.getMessages: Raw response:', data);
      
      const messages = data?.data?.messages || data?.messages || [];
      console.log('🔍 chatService.getMessages: Extracted messages count:', messages.length);
      
      return messages;
    } catch (error) {
      console.error('❌ chatService.getMessages Error:', error);
      return [];
    }
  },

  // Send a new message
  async sendMessage(senderId, receiverId, content, messageType = 'text') {
    try {
      console.log('Sending message via API:', { senderId, receiverId, content, messageType });

      const response = await apiFetch(`/api/messages`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          receiverId,
          content,
          messageType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Send message API Response:', data);
      return data?.data?.message || null;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get messages for supervisor (with specific patient)
  async getMessagesForSupervisor(patientId) {
    try {
      const response = await apiFetch(`/api/messages/conversation/${patientId}`, {
        headers: getHeaders()
      });
      const data = await response.json();
      return data?.data?.messages || data?.messages || [];
    } catch (error) {
      console.error('Error fetching messages for supervisor:', error);
      return [];
    }
  }
};

// DEPRECATED: Legacy exports for backward compatibility during transition
// These should NOT be used in new code
export const DEMO_PATIENT_ID = null;
export const DEMO_SUPERVISOR_ID = null;
export const setupDemoUser = () => {
  console.warn('setupDemoUser is deprecated - using real logged-in user data');
  return getCurrentUser();
};