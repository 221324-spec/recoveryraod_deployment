import React, { useState, useEffect, useRef } from 'react';
import { FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { apiService, getCurrentUser, getCurrentUserId } from '../../services/chatService';
import socketService from '../../services/socketService';
import { VideoCallButton } from '../VideoCall';

export default function CommunicationHub() {
  console.log('🎨 Communication Hub loaded');
  
  const [patients, setPatients] = useState([]);
  const [userStatusById, setUserStatusById] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSupervisorId, setCurrentSupervisorId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to merge loaded messages with existing ones (preserves optimistic updates)
  const mergeMessages = async () => {
    if (!selectedPatient) return;
    
    console.log('🔄 MERGING SUPERVISOR MESSAGES FROM DATABASE...');
    try {
      const chatMessages = await apiService.getMessages(selectedPatient._id);
      console.log('🔄 Got messages to merge:', chatMessages?.length || 0);
      setMessages(prevMessages => {
        const loadedMessages = chatMessages || [];
        // Create a map of existing messages by ID for quick lookup
        const existingMap = new Map(prevMessages.map(msg => [msg._id, msg]));
        
        // Merge: keep all loaded messages, but preserve any optimistic messages not in loaded set
        const merged = [...loadedMessages];
        
        // Add any existing messages that aren't in the loaded set (optimistic updates)
        prevMessages.forEach(existingMsg => {
          if (existingMsg._id && !loadedMessages.some(loaded => loaded._id === existingMsg._id)) {
            console.log('🔄 Preserving optimistic message:', existingMsg._id);
            merged.push(existingMsg);
          }
        });
        
        // Sort by creation date
        merged.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
        
        console.log('✅ SUPERVISOR MESSAGES MERGED -', merged.length, 'total messages');
        return merged;
      });
    } catch (error) {
      console.error('❌ Error merging supervisor messages:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Combined initialization - setup, connect socket, load patients and messages
  useEffect(() => {
    console.log('🔄 SUPERVISOR COMMUNICATION HUB COMPONENT MOUNTED - LOADING DATA');
    
    // Get real logged-in user data
    const user = getCurrentUser();
    const supervisorId = getCurrentUserId();
    
    console.log('👤 Current supervisor:', user);
    console.log('🆔 Supervisor ID:', supervisorId);
    
    setCurrentSupervisorId(supervisorId);
    
    if (!supervisorId) {
      console.error('No supervisor ID found - user not logged in');
      setError('Please log in to access messages');
      setIsLoading(false);
      return;
    }
    
    // Connect socket (or reuse existing) and always re-join the supervisor's user room
    // This is critical because the singleton socket may still be from a previous session
    const sock = socketService.connect(supervisorId);
    sock.emit('join', { userId: supervisorId });
    console.log('🔌 Supervisor socket connected & joined room with ID:', supervisorId);

    // Load patients and messages
    const loadData = async () => {
      console.log('📥 LOADING SUPERVISOR DATA FROM DATABASE...');
      setIsLoading(true);
      try {
        // Load patients assigned to this supervisor
        const apiPatients = await apiService.getPatients();
        console.log('✅ Patients loaded:', apiPatients?.length || 0);
        
        if (apiPatients && apiPatients.length > 0) {
          // Seed initial presence from API if available
          const initialStatuses = {};
          apiPatients.forEach((p) => {
            const id = p._id;
            if (!id) return;
            initialStatuses[id] = (p.onlineStatus || p.online_status || '').toString().toLowerCase() || 'offline';
          });
          setUserStatusById((prev) => ({ ...initialStatuses, ...prev }));

          // Ask server for freshest presence (covers the case where a user was already online)
          apiPatients.forEach((p) => {
            if (p?._id) sock.emit('user:status:request', { userId: p._id });
          });

          setPatients(apiPatients);
          const firstPatient = apiPatients[0];
          setSelectedPatient(firstPatient);
          
          // Load messages for selected patient
          console.log('📥 Loading messages for patient:', firstPatient._id);
          const chatMessages = await apiService.getMessages(firstPatient._id);
          console.log('📨 Messages loaded:', chatMessages?.length || 0);
          setMessages(chatMessages || []);
          console.log('✅ SUPERVISOR MESSAGES LOADED SUCCESSFULLY -', (chatMessages || []).length, 'messages in chat history');
        } else {
          console.log('No patients assigned to this supervisor');
          setPatients([]);
          setSelectedPatient(null);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setPatients([]);
        setSelectedPatient(null);
      }
      setIsLoading(false);
    };
    
    loadData();

    // Setup socket listeners
    const handleNewMessage = (data) => {
      console.log('📨 Supervisor received message:', data);
      const message = data.message || data;
      if (message) {
        const messageReceiverId = message.receiverId?._id || message.receiverId;
        const messageSenderId = message.senderId?._id || message.senderId;
        const isForMe = messageReceiverId === supervisorId;
        const isFromMe = messageSenderId === supervisorId;
        
        if (isForMe && !isFromMe) {
          console.log('✅ Adding message from patient to chat');
          setMessages(prev => {
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        }
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.on('message:sent', (data) => console.log('📨 Message sent confirmation:', data));

    const handleUserStatus = (data) => {
      const userId = data?.userId;
      const status = (data?.status || '').toString().toLowerCase();
      if (!userId || !status) return;
      setUserStatusById((prev) => ({ ...prev, [userId]: status }));
    };

    socketService.on('user:status', handleUserStatus);

    // Reload data when window regains focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab became visible - merging supervisor messages');
        mergeMessages();
      }
    };
    
    const handleWindowFocus = () => {
      console.log('🔄 Window focused - merging supervisor messages');
      mergeMessages();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      console.log('🔄 SUPERVISOR COMMUNICATION HUB COMPONENT UNMOUNTED');
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:sent');
      socketService.off('user:status', handleUserStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const getPatientPresence = (patientId) => {
    const status = userStatusById?.[patientId];
    return status === 'online' ? 'online' : 'offline';
  };

  const loadMessages = async (patientId) => {
    if (!patientId) return;
    try {
      console.log('💬 Loading messages for patient:', patientId);
      const chatMessages = await apiService.getMessages(patientId);
      console.log('📨 Messages loaded:', chatMessages?.length || 0);
      setMessages(chatMessages || []);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient || !currentSupervisorId) return;

    console.log('📤 Supervisor sending message to:', selectedPatient.name);

    try {
      // Optimistic UI: create message locally first
      const messageToAdd = {
        _id: Date.now().toString(),
        senderId: currentSupervisorId,
        receiverId: selectedPatient._id,
        content: newMessage.trim(),
        timestamp: new Date(),
        messageType: 'text',
        pending: true
      };

      setMessages(prev => [...prev, messageToAdd]);
      setNewMessage('');

      console.log('📡 Supervisor emitting Socket.IO message to patient:', selectedPatient._id);
      socketService.sendMessage({
        senderId: currentSupervisorId,
        receiverId: selectedPatient._id,
        content: messageToAdd.content,
        messageType: 'text'
      });

      // Persist via API
      const response = await apiService.sendMessage(
        currentSupervisorId,
        selectedPatient._id,
        messageToAdd.content,
        'text'
      );
      
      console.log('✅ Supervisor message sent successfully:', response);
      
      if (response) {
        // Replace optimistic message with server response
        setMessages(prev => prev.map(m => (m._id === messageToAdd._id ? { ...response } : m)));
      } else {
        console.warn('❗ Supervisor API did not return saved message; keeping optimistic copy.');
      }
    } catch (error) {
      console.error('❌ Supervisor error sending message:', error);
    }
  };

  const selectPatient = async (patient) => {
    console.log('🎯 Patient selected:', patient);
    setSelectedPatient(patient);
    console.log('📞 Loading messages for patient:', patient._id);
    await loadMessages(patient._id);
    console.log('✅ Messages loaded, patient is now selected');
  };

  // When patient selection changes, load their messages
  useEffect(() => {
    if (selectedPatient) {
      console.log('🔄 Patient selected, loading messages for:', selectedPatient._id);
      loadMessages(selectedPatient._id);
    }
  }, [selectedPatient]); // Reload whenever selectedPatient changes

  console.log('📊 Supervisor render state:', {
    totalMessages: messages.length,
    selectedPatient: selectedPatient?._id,
    selectedPatientName: selectedPatient?.name,
    hasSelectedPatient: !!selectedPatient,
    patientsCount: patients.length
  });

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Patient Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-xl flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2">💬 Patients</h2>
          <p className="text-blue-100 text-sm">Select a patient to chat</p>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-t-4 border-purple-400"></div>
              </div>
              <span className="ml-4 text-gray-700 font-medium">Loading patients...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4 mb-4 shadow-md">
              <div className="flex items-center">
                <span className="text-red-500 mr-3 text-xl"><FaExclamationTriangle /></span>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {patients.map((patient) => (
              <div
                key={patient._id}
                onClick={() => selectPatient(patient)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  selectedPatient?._id === patient._id
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {patient.name?.charAt(0)?.toUpperCase() || <FaUser />}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-md ${
                      getPatientPresence(patient._id) === 'online' ? 'bg-sky-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-lg">{patient.name}</h4>
                    <p className="text-sm text-gray-600 truncate">Patient ID: {patient._id?.slice(-8)}</p>
                    <div className="flex items-center mt-2">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        getPatientPresence(patient._id) === 'online' ? 'bg-sky-400 animate-pulse' : 'bg-gray-300'
                      }`}></span>
                      <span className={`text-xs font-semibold ${
                        getPatientPresence(patient._id) === 'online' ? 'text-sky-600' : 'text-gray-500'
                      }`}>{getPatientPresence(patient._id) === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Chat Interface */}
      <div className="flex-1 flex flex-col bg-white shadow-lg h-full overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 p-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-lg">
                      {selectedPatient.name?.charAt(0)?.toUpperCase() || <FaUser />}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                      getPatientPresence(selectedPatient._id) === 'online' ? 'bg-sky-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                  
                  <div className="ml-4">
                    <h2 className="font-bold text-gray-900 text-lg">{selectedPatient.name}</h2>
                    <p className="text-sm text-sky-600 flex items-center font-medium">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        getPatientPresence(selectedPatient._id) === 'online' ? 'bg-sky-400 animate-pulse' : 'bg-gray-300'
                      }`}></span>
                      {getPatientPresence(selectedPatient._id) === 'online' ? 'Online' : 'Offline'} • Available for chat
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <VideoCallButton
                    recipientUser={selectedPatient}
                    className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    title="Video Call"
                  />
                  <button className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 hover:from-sky-100 hover:to-indigo-100 transition-all duration-200 group" title="Voice Call">
                    <svg className="w-5 h-5 text-sky-600 group-hover:text-sky-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🔄 Manual refresh clicked - merging supervisor messages');
                      mergeMessages();
                    }}
                    className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group" 
                    title="Refresh messages"
                  >
                    <svg className="w-5 h-5 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group" title="More Options">
                    <svg className="w-5 h-5 text-purple-600 group-hover:text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
                    💬
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
                  <p className="text-gray-600">Start a conversation to begin helping your patient</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    // Handle both string and object formats for senderId
                    const senderId = msg.senderId?._id || msg.senderId;
                    const isSupervisor = senderId?.toString() === currentSupervisorId?.toString();
                    const isCallLog = msg.messageType === 'call';
                    return (
                      <div key={msg._id || index} className={`flex ${isSupervisor ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-md ${isSupervisor ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${
                              isSupervisor 
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                                : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                            }`}>
                              {isSupervisor ? '👨‍⚕️' : selectedPatient?.name?.charAt(0)?.toUpperCase() || '👤'}
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <div className={`px-4 py-3 rounded-2xl shadow-md ${
                              isCallLog
                                ? 'bg-gray-100 border border-gray-200 text-gray-700'
                                : isSupervisor 
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm' 
                                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                            }`}>
                              {isCallLog ? (
                                <div className="text-sm font-medium">{msg.content}</div>
                              ) : (
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                              )}
                            </div>
                            <span className={`text-xs text-gray-500 mt-1 ${isSupervisor ? 'text-right' : 'text-left'} px-1`}>
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
              )}              <div ref={messagesEndRef} />            </div>

            {/* Message Input Area */}
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
                    placeholder={`Message ${selectedPatient.name}...`}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md p-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-xl">
                💬
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Communication Hub</h3>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Select a patient from the sidebar to start a secure conversation
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>HIPAA Compliant • End-to-end Encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}