import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Call,
  StreamCall,
  CallControls, // Restore SDK Controls
  useCallStateHooks,
  useCall,
  CallingState
} from '@stream-io/video-react-sdk';
import { ResponsiveVideoLayout } from './ResponsiveVideoLayout';

interface VideoCallScreenProps {
  call: Call | null;
  onEndCall: () => void;
}



import { VerticalCallLayout } from './VerticalLayout/VerticalCallLayout';
// import { FixedBottomControls } from './VerticalLayout/FixedBottomControls'; // User rejected this
import './VerticalLayout/vertical-mobile-call.css';

// Internal component to handle call state and layout
const CallLayout = ({ onEndCall }: { onEndCall: () => void }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const call = useCall();

  useEffect(() => {
    // Cleanup media on unmount
    return () => {
      if (call) {
        call.camera.disable();
        call.microphone.disable();
      }
    };
  }, [call]);

  // Handle auto-navigation when call ends
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onEndCall();
    }
  }, [callingState, onEndCall]);

  if (callingState !== CallingState.JOINED) {
    if (callingState === CallingState.LEFT) {
      return <div className="h-full bg-black" />; // Black background for mobile vibe
    }

    return (
      <div className="flex items-center justify-center h-full text-white font-sora bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <p>Connecting...</p>
        </div>
      </div>
    );
  }

  // Vertical Mobile Layout Structure
  return (
    <div className="vertical-call-wrapper">
      <VerticalCallLayout />

      {/* 
          User requested specifically "original controls" because the custom ones were "terrible".
          Restoring SDK CallControls. 
          We wrap it to position it at the bottom.
       */}
      <div className="vertical-controls-wrapper">
        <CallControls onLeave={onEndCall} />
      </div>
    </div>
  );
};

export function VideoCallScreen({ call, onEndCall }: VideoCallScreenProps) {
  if (!call) {
    // Should handle this better, maybe redirect back
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">No active call</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative min-h-screen w-full bg-gray-950 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-orange/10 to-transparent opacity-30" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 blur-[100px] rounded-full opacity-20" />
      </div>

      <StreamCall call={call}>
        <CallLayout onEndCall={onEndCall} />
      </StreamCall>
    </motion.div>
  );
}