import React from 'react';
import { motion } from 'framer-motion';
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneOffIcon } from
'lucide-react';
interface ControlBarProps {
  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25
};
export function ControlBar({
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  onEndCall
}: ControlBarProps) {
  return (
    <motion.div
      initial={{
        y: 40,
        opacity: 0
      }}
      animate={{
        y: 0,
        opacity: 1
      }}
      transition={{
        delay: 0.3,
        ...springTransition
      }}
      className="flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl"
      style={{
        background:
        'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(234,89,45,0.08) 50%, rgba(51,66,149,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.4)',
        boxShadow:
        '0 8px 32px -4px rgba(0,0,0,0.12), 0 4px 16px -2px rgba(234,89,45,0.08)'
      }}>

      {/* Mic Toggle */}
      <motion.button
        whileTap={{
          scale: 0.9
        }}
        transition={springTransition}
        onClick={onToggleMic}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${micOn ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
        style={
        micOn ?
        {
          background: 'linear-gradient(135deg, #EA592D, #334295)'
        } :
        undefined
        }
        aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}>

        {micOn ?
        <MicIcon className="w-5 h-5" /> :

        <MicOffIcon className="w-5 h-5" />
        }
      </motion.button>

      {/* Camera Toggle */}
      <motion.button
        whileTap={{
          scale: 0.9
        }}
        transition={springTransition}
        onClick={onToggleCamera}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${cameraOn ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
        style={
        cameraOn ?
        {
          background: 'linear-gradient(135deg, #EA592D, #334295)'
        } :
        undefined
        }
        aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}>

        {cameraOn ?
        <VideoIcon className="w-5 h-5" /> :

        <VideoOffIcon className="w-5 h-5" />
        }
      </motion.button>

      {/* End Call */}
      <motion.button
        whileTap={{
          scale: 0.88
        }}
        transition={springTransition}
        onClick={onEndCall}
        className="w-14 h-12 rounded-full flex items-center justify-center text-white ml-1"
        style={{
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          boxShadow: '0 4px 16px -2px rgba(239,68,68,0.4)'
        }}
        aria-label="End call">

        <PhoneOffIcon className="w-5 h-5" />
      </motion.button>
    </motion.div>);

}