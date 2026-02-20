import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VideoIcon, MicIcon, MicOffIcon, VideoOffIcon } from 'lucide-react';
import { VideoPreview, Call, StreamCall, useCallStateHooks, useCall, CallingState } from '@stream-io/video-react-sdk';

interface LobbyScreenProps {
  userName: string;
  onCancel: () => void;
  onCallStart: () => void;
  call: Call | null;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 28
};

// Componente interno que usa los hooks del call - DEBE estar dentro de StreamCall
const LobbyContent = ({
  userName,
  onCancel,
  onCallStart,
}: Omit<LobbyScreenProps, 'call'>) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // Obtener estado del call - AHORA está dentro de StreamCall context
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Toggle local devices usando el call del contexto
  const call = useCall();

  // Toggle local devices
  useEffect(() => {
    if (call) {
      if (!micEnabled) call.microphone.disable();
      else call.microphone.enable();
    }
  }, [micEnabled, call]);

  useEffect(() => {
    if (call) {
      if (!camEnabled) call.camera.disable();
      else call.camera.enable();
    }
  }, [camEnabled, call]);

  // Apply mobile constraints (9:16) when camera is ready
  const { useCameraState } = useCallStateHooks();
  const { mediaStream } = useCameraState();

  useEffect(() => {
    if (mediaStream && camEnabled) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        console.log('📱 Applying mobile portrait constraints (9:16)...');
        videoTrack.applyConstraints({
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 0.5625 }, // 9/16
          facingMode: 'user'
        }).catch(e => console.warn('⚠️ Could not apply mobile constraints:', e));
      }
    }
  }, [mediaStream, camEnabled]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (call) {
        call.camera.disable();
        call.microphone.disable();
      }
    };
  }, [call]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="min-h-screen w-full flex flex-col items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at center, #fffbf7 0%, #fef7f0 30%, #f5f0ff 70%, #eef2ff 100%)'
      }}>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Header */}
        <motion.h2
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="text-2xl font-bold text-gray-900 font-sora mb-2">
          Ready to join?
        </motion.h2>

        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="text-gray-500 text-sm font-sora mb-8 text-center">
          Check your audio and video settings before joining.
        </motion.p>


        {/* Video Preview Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, ...springTransition }}
          className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gray-900 shadow-2xl mb-8 border-4 border-white/50"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Provide visual feedback if cam is off, handled by VideoPreview mostly but we can overlay */}
            {!camEnabled && (
              <div className="flex flex-col items-center text-white/50 gap-2">
                <div className="p-4 rounded-full bg-white/10">
                  <VideoOffIcon className="w-8 h-8" />
                </div>
                <p className="font-sora text-sm">Camera is off</p>
              </div>
            )}
            <div className={camEnabled ? "w-full h-full" : "hidden"}>
              <VideoPreview />
            </div>
          </div>

          {/* Media Controls Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-3 rounded-xl transition-all ${micEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
            >
              {micEnabled ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setCamEnabled(!camEnabled)}
              className={`p-3 rounded-xl transition-all ${camEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'}`}
            >
              {camEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>


        {/* Footer Actions */}
        <div className="flex items-center gap-4 w-full justify-center">
          <motion.button
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onCancel}
            className="px-6 py-3.5 rounded-2xl bg-white text-gray-700 font-sora font-semibold text-sm hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm"
          >
            Cancel
          </motion.button>

          <motion.button
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onCallStart}
            disabled={callingState !== CallingState.IDLE}
            className="flex-1 max-w-xs px-8 py-3.5 rounded-2xl text-white font-sora font-semibold text-sm shadow-xl shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #EA592D 0%, #FF6B4A 100%)'
            }}
          >
            Join Call
          </motion.button>
        </div>

        <p className="mt-8 text-xs text-gray-400 font-sora">
          Logged in as <span className="font-semibold text-gray-600">{userName}</span>
        </p>

      </div>
    </motion.div>
  );
};

// Componente wrapper que verifica que el call esté listo y envuelve en StreamCall
export function LobbyScreen(props: LobbyScreenProps) {
  const { call, userName, onCancel, onCallStart } = props;
  const [isCallReady, setIsCallReady] = useState(false);

  useEffect(() => {
    if (!call) {
      setIsCallReady(false);
      return;
    }

    // Esperar a que el call tenga el estado inicializado
    const checkCallReady = () => {
      try {
        // Verificar si el call tiene los datos necesarios
        if (call.state && call.camera && call.microphone) {
          setIsCallReady(true);
        } else {
          setIsCallReady(false);
        }
      } catch {
        setIsCallReady(false);
      }
    };

    checkCallReady();

    // Revisar cada 100ms hasta que esté listo
    const interval = setInterval(checkCallReady, 100);

    // Timeout de 5 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsCallReady(true); // Forzar renderizado después de 5s
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [call]);

  if (!call || !isCallReady) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <p className="text-gray-600 font-sora text-sm">Initializing camera...</p>
        </div>
      </div>
    );
  }

  // AHORA StreamCall envuelve a LobbyContent, así que los hooks funcionan correctamente
  return (
    <StreamCall call={call}>
      <LobbyContent
        userName={userName}
        onCancel={onCancel}
        onCallStart={onCallStart}
      />
    </StreamCall>
  );
}
