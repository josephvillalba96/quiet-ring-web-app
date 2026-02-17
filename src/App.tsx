import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
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
import { PublicDoorbellService } from './services/PublicDoorbellService';

// =============== CONFIG ===============
const apiKey = import.meta.env.VITE_STREAM_API_KEY;
// =====================================



function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const ringCode = searchParams.get('ring');

  // App State
  // Auth State from Context
  // Auth State from Context
  const { userName: localUserName, isAuthenticated, isProfileComplete, streamUserId, logout } = useAuth();

  // Stream Video State
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [doorbellInfo, setDoorbellInfo] = useState<any>(null);
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

        // Get callId from URL ring parameter or generate random one
        const callId = ringCode + Math.floor(Math.random() * (90000 - 10000 + 1) + 10000).toString();
        console.log('📞 Using callId:', callId);
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


  // Fetch doorbell info when ring code is present AND user is authenticated
  useEffect(() => {
    if (ringCode && isAuthenticated) {
      console.log('🔔 Ring code detected and user authenticated, fetching info:', ringCode);
      PublicDoorbellService.getDoorbellInfo(ringCode)
        .then(doorbell => {
          console.log('✅ Doorbell info loaded:', doorbell);
          setDoorbellInfo(doorbell);
        })
        .catch(err => {
          console.error('❌ Failed to load doorbell info:', err);
        });
    } else if (ringCode && !isAuthenticated) {
      console.log('⏳ Waiting for authentication to fetch doorbell info...');
    }
  }, [ringCode, isAuthenticated]);


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


        // 1. Extract remote members directly from doorbell info
        const remoteMembers = (doorbellInfo || [])
          .filter((m: any) => m && m.user_id)
          .map((m: any) => ({ user_id: m.user_id }));

        console.log('� Remote members to add:', remoteMembers);

        if (remoteMembers.length === 0) {
          console.warn('⚠️ No remote members found in doorbellInfo. Call will be just local user.');
        }

        // 2. Prepare call members (Local + Remote)
        const callMembers = [
          { user_id: streamUserId, role: 'admin' },
          ...remoteMembers
        ];

        // Unique check
        const uniqueMembers = Array.from(new Set(callMembers.map(m => m.user_id)))
          .map(id => callMembers.find(m => m.user_id === id));

        console.log('📝 Initializing call with members:', uniqueMembers);

        try {
          // 3. Get or Create the call
          await call.getOrCreate({
            data: {
              members: uniqueMembers,
              created_by_id: streamUserId,
              custom: { type: 'anonymous_video', creatorName: localUserName }
            } as any,
            ring: true
          });

          // 4. FORCE UPDATE MEMBERS (Critical Fix)
          // If the call already existed (common with fixed callId), getOrCreate might NOT update members.
          // We force-add them here using updateCall (addMembers is not a function on Call object per error).
          if (uniqueMembers.length > 1) {
            try {
              console.log('🔄 Ensuring all members are added via updateCall:', uniqueMembers);
              await call.updateCall({ members: uniqueMembers });
            } catch (addError) {
              console.warn('⚠️ Note: Error updating call members:', addError);
            }
          }

          // 5. DIAGNOSTICS
          const membersList = await call.queryMembers({});
          console.log('👥 Final Member List (Server):', membersList);

          // Validation (Check both user.id and user_id)
          const isLocalMember = membersList.members.some((m: any) =>
            (m.user && m.user.id === streamUserId) || m.user_id === streamUserId
          );

          if (!isLocalMember) {
            console.warn('⚠️ Warning: Local user not found in member list under expected keys.');
          }

        } catch (wsError: any) {
          console.error('❌ WebSocket/Create error:', wsError);
          if (wsError.message?.includes('WS connection could not be established')) {
            alert('Unable to connect to video server. Please try again.');
            return;
          } else {
            console.warn('Call creation error, attempting to proceed to join as fallback...');
          }
        }

        // 2. Actually join
        console.log('🚀 Attempting to join call...');

        try {
          // Final membership check with permissive fallback
          const finalMembers = await call.queryMembers({});
          const isMember = finalMembers.members.some((m: any) =>
            (m.user && m.user.id === streamUserId) || m.user_id === streamUserId
          );

          if (isMember) {
            console.log('✅ Confirmed membership. Joining...');
            await call.join();
            navigate('/video-call');
          } else {
            console.warn('⚠️ User not found in members list, forcing join (Anonymous/Guest mode)...');
            // Force join anyway - Stream might allow it depending on settings
            await call.join();
            navigate('/video-call');
          }
        } catch (joinError) {
          console.error('❌ Join failed:', joinError);
          // One last try blindly?
          try {
            await call.join();
            navigate('/video-call');
          } catch (finalError) {
            alert('Could not join call. Please check console.');
          }
        }
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

    // Logout to clear session and return to fresh registration
    logout();

    // Navigate to registration screen
    navigate('/');
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