import React, { useState, useEffect, useRef } from 'react';
import { apiService, getCurrentUser, getCurrentUserId, getAssignedSupervisor } from '../../services/chatService';
import socketService from '../../services/socketService';
import api from '../../api';
import { VideoCallButton } from '../VideoCall';

export default function Messages({ onBack, supervisorProp }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [supervisor, setSupervisor] = useState(null);
  const [supervisorPresence, setSupervisorPresence] = useState('offline');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const normalizeSupervisor = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      return { id: value, _id: value };
    }
    if (typeof value === 'object') {
      const id = value._id || value.id;
      return id ? { ...value, _id: value._id || id, id: value.id || id } : null;
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get supervisor ID from assigned supervisor object
  const getSupervisorId = () => {
    if (!supervisor) return null;
    if (typeof supervisor === 'string') return supervisor;
    return supervisor._id || supervisor.id;
  };

  useEffect(() => {
    const supervisorId = getSupervisorId();
    if (!supervisorId) return;
    const seeded = (supervisor?.onlineStatus || supervisor?.online_status || '').toString().toLowerCase();
    if (seeded) setSupervisorPresence(seeded === 'online' ? 'online' : 'offline');

    const handleUserStatus = (data) => {
      if (!data?.userId) return;
      if (String(data.userId) !== String(supervisorId)) return;
      const status = (data.status || '').toString().toLowerCase();
      if (status) setSupervisorPresence(status === 'online' ? 'online' : 'offline');
    };

    socketService.on('user:status', handleUserStatus);

    // Initial sync in case the supervisor was already online before this screen mounted
    socketService.emit('user:status:request', { userId: supervisorId });

    return () => socketService.off('user:status', handleUserStatus);
  }, [supervisor]);

  // Function to merge loaded messages with existing ones (preserves optimistic updates)
  const mergeMessages = async () => {
    const supervisorId = getSupervisorId();
    if (!supervisorId) return;
    
    console.log('🔄 MERGING PATIENT MESSAGES FROM DATABASE...');
    try {
      const data = await apiService.getMessages(supervisorId);
      console.log('🔄 Got messages to merge:', data?.length || 0);
      setMessages(prevMessages => {
        const loadedMessages = data || [];
        const merged = [...loadedMessages];
        
        prevMessages.forEach(existingMsg => {
          if (existingMsg._id && !loadedMessages.some(loaded => loaded._id === existingMsg._id)) {
            console.log('🔄 Preserving optimistic message:', existingMsg._id);
            merged.push(existingMsg);
          }
        });
        
        merged.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
        console.log('✅ MESSAGES MERGED -', merged.length, 'total messages');
        return merged;
      });
    } catch (error) {
      console.error('❌ Error merging messages:', error);
    }
  };

  // Initialize component with real user data
  useEffect(() => {
    console.log('🔄 PATIENT MESSAGES COMPONENT MOUNTED - LOADING DATA');
    
    // Get current user from localStorage (set during login)
    const user = getCurrentUser();
    const userId = getCurrentUserId();
    let assignedSupervisor = normalizeSupervisor(supervisorProp) || normalizeSupervisor(getAssignedSupervisor());
    
    console.log('👤 Current user:', user);
    console.log('🆔 Current user ID:', userId);
    console.log('👨‍⚕️ Assigned supervisor:', assignedSupervisor);
    
    setCurrentUserId(userId);

    // Connect socket immediately and always join the patient's user room
    // (singleton connect() returns early if already connected, but join must still be emitted)
    if (userId) {
      const sock = socketService.connect(userId);
      sock.emit('join', { userId });
      console.log('🔌 Patient socket connected & joined room with ID:', userId);
    }

    // Helper to initialize chat once we have a supervisor
    const initChat = (sup) => {
      setSupervisor(sup);
      const supId = sup._id || sup.id;

      // Load initial messages
      const loadInitialMessages = async () => {
        console.log('📥 LOADING PATIENT MESSAGES FROM DATABASE...');
        setLoading(true);
        try {
          const data = await apiService.getMessages(supId);
          console.log('📨 Patient messages loaded:', data?.length || 0);
          setMessages(data || []);
        } catch (error) {
          console.error('❌ Error loading patient messages:', error);
          setMessages([]);
        }
        setLoading(false);
      };
      
      loadInitialMessages();
    };

    const needsSupervisorHydration = !assignedSupervisor || (typeof assignedSupervisor === 'object' && !assignedSupervisor.name);

    // If supervisor is missing or only an ID, fetch fresh profile from backend
    if (needsSupervisorHydration) {
      console.log('⚠️ Supervisor details missing/incomplete, fetching fresh profile from server...');
      api.get('/auth/me')
        .then(response => {
          const freshUser = response.data.user;
          if (freshUser?.assignedSupervisor) {
            console.log('✅ Found supervisor from server:', freshUser.assignedSupervisor);
            // Update localStorage with fresh data
            const stored = getCurrentUser();
            if (stored) {
              stored.assignedSupervisor = freshUser.assignedSupervisor;
              localStorage.setItem('user', JSON.stringify(stored));
            }
            const sup = normalizeSupervisor(freshUser.assignedSupervisor);
            initChat(sup);
          } else if (assignedSupervisor) {
            // Fallback: keep existing supervisor id so messaging still works.
            initChat(normalizeSupervisor(assignedSupervisor));
          } else {
            console.log('❌ No supervisor assigned to this patient (confirmed by server)');
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('❌ Error fetching fresh profile:', err);
          setLoading(false);
        });
    } else {
      initChat(normalizeSupervisor(assignedSupervisor));
    }

    // Reload messages when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) mergeMessages();
    };
    const handleWindowFocus = () => mergeMessages();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      console.log('🔄 PATIENT MESSAGES COMPONENT UNMOUNTED');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Register socket listener independently — always runs on mount regardless
  // of how/when the supervisor is resolved (localStorage vs async /auth/me fetch)
  useEffect(() => {
    const userId = getCurrentUserId();

    const handleNewMessage = (data) => {
      console.log('📨 Patient received message:new event:', data);
      const message = data.message || data;
      if (!message) return;
      const messageReceiverId = message.receiverId?._id || message.receiverId;
      const messageSenderId = message.senderId?._id || message.senderId;
      const isForMe = String(messageReceiverId) === String(userId);
      const isFromMe = String(messageSenderId) === String(userId);
      if (isForMe && !isFromMe) {
        console.log('✅ Adding message from supervisor to chat');
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    const handleMessageSent = (data) => console.log('📨 Patient: message:sent confirmation', data);

    socketService.on('message:new', handleNewMessage);
    socketService.on('message:sent', handleMessageSent);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:sent', handleMessageSent);
    };
  }, []);

  const sendMessage = async () => {
    const supervisorId = getSupervisorId();
    if (!newMessage.trim() || !supervisorId || !currentUserId) {
      console.log('❌ Cannot send message: missing content, supervisor, or user ID');
      return;
    }

    console.log('📤 Patient attempting to send message:', {
      senderId: currentUserId,
      receiverId: supervisorId,
      content: newMessage.trim()
    });

    try {
      const messageToAdd = {
        _id: Date.now().toString(),
        senderId: currentUserId,
        receiverId: supervisorId,
        content: newMessage.trim(),
        timestamp: new Date(),
        messageType: 'text',
        pending: true
      };

      setMessages(prev => [...prev, messageToAdd]);
      setNewMessage('');

      socketService.sendMessage({
        senderId: currentUserId,
        receiverId: supervisorId,
        content: messageToAdd.content,
        messageType: 'text'
      });

      const response = await apiService.sendMessage(
        currentUserId,
        supervisorId,
        messageToAdd.content
      );

      if (response) {
        setMessages(prev => prev.map(m => (m._id === messageToAdd._id ? { ...response } : m)));
      }
    } catch (error) {
      console.error('❌ Patient error sending message (API):', error);
    }
  };

  // Get supervisor display name
  const supervisorName = supervisor?.name || 'Your Supervisor';
  const supervisorInitial = supervisorName.charAt(0).toUpperCase();

  // Show "No supervisor assigned" state
  if (!loading && !supervisor) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-semibold text-gray-900 text-base">Messages</h2>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg">
            👨‍⚕️
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Supervisor Assigned</h3>
          <p className="text-gray-600 max-w-md mb-6">
            You haven't been assigned a supervisor yet. Once an NGO administrator assigns you to a supervisor, 
            you'll be able to message them here.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">What happens next?</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your NGO administrator will review your profile and assign you to an appropriate supervisor 
                  based on your needs. You'll receive a notification when this happens.
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Supervisor Profile - Now Dynamic */}
            <div className="flex items-center flex-1">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md text-lg">
                  {supervisorInitial}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-sky-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="ml-3 flex-1">
                <h2 className="font-semibold text-gray-900 text-base">{supervisorName}</h2>
                <p className="text-sm text-sky-600 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${supervisorPresence === 'online' ? 'bg-sky-500' : 'bg-gray-300'}`}></span>
                  {supervisorPresence === 'online' ? 'Online' : 'Offline'} • {supervisor?.specialization || 'Supervisor'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <VideoCallButton
                recipientUser={supervisor}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-700 disabled:opacity-60"
                title="Video Call"
              />
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Voice Call">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  console.log('🔄 Manual refresh clicked - merging messages');
                  mergeMessages();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
                title="Refresh messages"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="More options">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area - Matching Supervisor Design */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
                <p>Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
                💬
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
              <p className="text-gray-600">Start a conversation with {supervisorName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const senderId = msg.senderId?._id || msg.senderId;
                const isPatient = senderId?.toString() === currentUserId?.toString();
                const isCallLog = msg.messageType === 'call';
                return (
                  <div key={msg._id || index} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-md ${isPatient ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${
                          isPatient
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                        }`}>
                          {isPatient ? '👤' : supervisorInitial}
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className={`px-4 py-3 rounded-2xl shadow-md ${
                          isCallLog
                            ? 'bg-gray-100 border border-gray-200 text-gray-700'
                            : isPatient
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}>
                          {isCallLog ? (
                            <div className="text-sm font-medium">{msg.content}</div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          )}
                        </div>
                        <span className={`text-xs text-gray-500 mt-1 ${isPatient ? 'text-right' : 'text-left'} px-1`}>
                          {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area - Matching Supervisor Design */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${supervisorName}...`}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all"
              />
              
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-xl transform hover:scale-105 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
    </div>
  );
}