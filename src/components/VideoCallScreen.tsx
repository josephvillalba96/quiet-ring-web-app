import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Call,
  StreamCall,
  CallControls,
  useCallStateHooks,
  useCall,
  CallingState
} from '@stream-io/video-react-sdk';
import { ResponsiveVideoLayout } from './ResponsiveVideoLayout';

interface VideoCallScreenProps {
  call: Call | null;
  onEndCall: () => void;
}



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

  if (callingState !== CallingState.JOINED) {
    // If we're already left or in some other terminal state, don't show "Connecting..."
    if (callingState === CallingState.LEFT) {
      return <div className="h-full bg-gray-950" />;
    }

    return (
      <div className="flex items-center justify-center h-full text-white font-sora">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <p>Connecting to call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:items-center md:justify-center md:p-4">
      {/* Main Video Layout - Responsive: Mobile gets full screen, Desktop gets SpeakerLayout */}
      <div className="w-full flex-1 relative md:rounded-3xl overflow-hidden shadow-2xl bg-gray-900 md:border md:border-white/10 md:mb-6">
        <ResponsiveVideoLayout />
      </div>

      {/* Controls */}
      {/* Stream SDK provides <CallControls /> but we can use our custom ControlBar if adapted, 
                or just use SDK controls for simplicity and reliability first. 
                Let's use SDK controls to ensure functionality, styled if possible. 
                Or we can wrap our own. Let's start with SDK controls to be safe. 
            */}
      <div className="w-full flex justify-center pb-8 safe-area-bottom">
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