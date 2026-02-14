import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { RegistrationScreen } from './components/RegistrationScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { VideoCallScreen } from './components/VideoCallScreen';
import {
  StreamVideo,
  StreamVideoClient,
  StreamTheme,
  User,
  Call,
  CallingState
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { AuthService } from './services/AuthService';
import { AuthGuard } from './components/AuthGuard';
import { useAuth } from './contexts/AuthContext';

// =============== CONFIG ===============
const apiKey = import.meta.env.VITE_STREAM_API_KEY;
// =====================================

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // App State
  // Auth State from Context
  // Auth State from Context
  const { userName: localUserName, isAuthenticated, isProfileComplete, streamUserId, logout } = useAuth();

  // Stream Video State
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const initializationRef = useRef(false);

  // Initialize Stream Client when user is authenticated
  useEffect(() => {
    if (!localUserName || !isAuthenticated || !streamUserId || initializationRef.current || client) return;

    const initClient = async () => {
      initializationRef.current = true;
      try {
        const user: User = {
          id: streamUserId,
          name: localUserName,
          image: `https://getstream.io/random_png/?id=${streamUserId}&name=${localUserName}`,
        };

        // Use secure token from backend (AuthService)
        // Token is automatically injected by interceptor if present
        const token = await AuthService.getStreamToken(streamUserId);
        console.log('🔑 Stream Token received:', token ? 'Token present (length: ' + token.length + ')' : 'No token');

        if (!token) {
          throw new Error('No token received from backend');
        }

        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user,
          token,
        });

        await videoClient.connectUser(user, token);

        // Create the call instance
        const callId = Math.floor(Math.random() * (9000000 - 1000000 + 1) + 1000000).toString();
        const myCall = videoClient.call('default', callId);

        setClient(videoClient);
        setCall(myCall); // Ensure call object is available for Lobby preview
        console.log('✅ Stream Client initialized for:', localUserName, 'with ID:', streamUserId);

      } catch (error) {
        console.error('Failed to initialize Stream Client', error);
        initializationRef.current = false; // Allow retry
      }
    };

    initClient();

    return () => {
      if (client) {
        // client.disconnectUser();
      }
    };
  }, [localUserName, isAuthenticated, streamUserId]);


  const handleRegistrationComplete = () => {
    // AuthContext now manages persistence and complete state
    navigate('/lobby');
  };

  const handleLobbyCancel = async () => {
    if (call) {
      try {
        await call.camera.disable();
        await call.microphone.disable();
        // Optional: leave the call if it was somehow joined or created
        await call.leave();
      } catch (e) {
        console.error('Error disabling devices on cancel:', e);
      }
    }
    logout(); // Clear session to return to fresh registration
    navigate('/');
  };

  const handleCallStart = async () => {
    if (!call || !localUserName || !streamUserId) return;

    try {
      if (call.state.callingState === CallingState.IDLE) {
        console.log('🚀 Starting call for:', localUserName);

        // Check if client is connected
        if (!client) {
          console.error('❌ Stream client is not initialized');
          alert('Connection error. Please refresh the page and try again.');
          return;
        }

        // 1. Join and Get Stream call instance
        try {
          await call.getOrCreate({
            data: {
              members: [
                { user_id: streamUserId },
                { user_id: '3246513976-5785369ebaa940d2a6901823d421b722' }
              ],
              created_by_id: streamUserId,
              custom: { type: 'anonymous_video', creatorName: localUserName }
            } as any,
            ring: true
          });
        } catch (wsError: any) {
          console.error('❌ WebSocket connection failed:', wsError);
          if (wsError.message?.includes('WS connection could not be established')) {
            alert('Unable to connect to video server. This might be a network or authentication issue. Please try again in a moment.');
          } else {
            alert('Failed to create call. Please try again.');
          }
          return;
        }

        // 2. Actually join
        await call.join();

        navigate('/video-call');
      }
    } catch (e) {
      console.error("Error creating/joining call", e);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleEndCall = async () => {
    if (call) {
      try {
        // Only leave if the call is not already in a terminal state
        if (call.state.callingState !== CallingState.LEFT) {
          await call.leave();
          console.log('Call left successfully');
        }
      } catch (err) {
        console.error('Error leaving call:', err);
      }
    }
    // Set call to null to ensure we don't reuse a stale call object
    setCall(null);
    // Regenerate call for the next use (lobby needs it for preview)
    if (client) {
      const callId = Math.floor(Math.random() * (9000000 - 1000000 + 1) + 1000000).toString();
      setCall(client.call('default', callId));
    }

    // Go to lobby if authenticated, else home
    navigate(isAuthenticated ? '/lobby' : '/');
  };

  // Fallback client for Registration (unauthenticated)
  // Or just display Registration outside StreamVideo if client is null.
  // Actually, Registration doesn't need StreamVideo.

  // If authenticated but client not ready, show loader
  // Only show loader if user has a name (otherwise they're still in registration)
  if (isAuthenticated && localUserName && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sora">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <p>Connecting to secure server...</p>
        </div>
      </div>
    );
  }

  // We only wrap in StreamVideo if we have a client. 
  // If we are on registration, we don't need it.
  // However, keeping the structure simple:

  return (
    <div className="w-full min-h-screen font-sora overflow-hidden">
      {client ? (
        <StreamVideo client={client}>
          <StreamTheme>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                  (isAuthenticated && isProfileComplete) ? <Navigate to="/lobby" replace /> : <RegistrationScreen onContinue={handleRegistrationComplete} />
                } />
                <Route path="/lobby" element={
                  <AuthGuard>
                    <LobbyScreen
                      userName={localUserName || ''}
                      onCancel={handleLobbyCancel}
                      // onCallStart is passed the joining logic
                      onCallStart={handleCallStart}
                      call={call}
                    />
                  </AuthGuard>
                } />
                <Route path="/video-call" element={
                  <AuthGuard>
                    <VideoCallScreen
                      call={call}
                      onEndCall={handleEndCall}
                    />
                  </AuthGuard>
                } />
              </Routes>
            </AnimatePresence>
          </StreamTheme>
        </StreamVideo>
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              (isAuthenticated && isProfileComplete) ? <Navigate to="/lobby" replace /> : <RegistrationScreen onContinue={handleRegistrationComplete} />
            } />
            {/* Fallback for other routes if hit directly without client ready (though we handled that above with loader) */}
            <Route path="*" element={<div />} />
          </Routes>
        </AnimatePresence>
      )}
    </div>
  );
}

export function App() {
  return (
    <div className="app-container">
      <AppContent />
    </div>
  );
}