import { useEffect, useRef, useMemo } from 'react';
import {
  ParticipantView,
  VideoPreview,
  useCallStateHooks,
  useCall,
  hasScreenShare,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

// Componente para un solo participante (pantalla completa)
const SingleParticipantView = ({ participant }: { participant: StreamVideoParticipant }) => {
  return (
    <div className="mobile-video-main">
      <ParticipantView
        participant={participant}
        trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
      />
    </div>
  );
};

// Componente Picture-in-Picture
const DraggablePIP = ({
  mainParticipant,
  pipParticipant,
}: {
  mainParticipant: StreamVideoParticipant;
  pipParticipant: StreamVideoParticipant;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Video principal (remoto) */}
      <div className="w-full h-full">
        <ParticipantView
          participant={mainParticipant}
          trackType={hasScreenShare(mainParticipant) ? 'screenShareTrack' : 'videoTrack'}
        />
      </div>

      {/* Video PiP (local) - Usar VideoPreview para video local */}
      <div className="mobile-video-pip">
        <VideoPreview />
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
          You
        </div>
      </div>
    </div>
  );
};

// Componente Grid para 3+ participantes
const MobileGridLayout = ({ participants }: { participants: StreamVideoParticipant[] }) => {
  // Determinar layout de grid según cantidad
  const getGridClass = (count: number) => {
    if (count <= 2) return 'mobile-grid-1';
    if (count <= 4) return 'mobile-grid-2';
    return 'mobile-grid-many';
  };

  return (
    <div className={`mobile-grid ${getGridClass(participants.length)}`}>
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          className={`relative overflow-hidden rounded-xl bg-gray-800 ${
            participants.length === 3 ? 'aspect-[4/3]' : 'aspect-video'
          }`}
        >
          <ParticipantView
            participant={participant}
            trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
            muteAudio={participant.isLocalParticipant}
          />
          {/* Nombre del participante */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-lg text-xs text-white font-medium">
            {participant.name || participant.userId}
            {participant.isLocalParticipant && ' (You)'}
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente principal
export function MobileVideoLayout() {
  const call = useCall();
  const containerRef = useRef<HTMLDivElement>(null);

  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // Separar participantes - con fallback mejorado
  const { localParticipant, remoteParticipants, allParticipants } = useMemo(() => {
    // Intentar encontrar por isLocalParticipant
    let local = participants.find((p) => p.isLocalParticipant);
    
    // Si no se encuentra, intentar por otras propiedades
    if (!local && participants.length > 0) {
      // Fallback: último participante suele ser el local
      local = participants[participants.length - 1];
      console.log('⚠️ Fallback: using last participant as local');
    }
    
    const remotes = participants.filter((p) => p.sessionId !== local?.sessionId);
    
    return {
      localParticipant: local,
      remoteParticipants: remotes,
      allParticipants: participants,
    };
  }, [participants]);

  // Setup viewport tracking
  useEffect(() => {
    if (!call || !containerRef.current) return;

    const cleanup = call.dynascaleManager.setViewport(containerRef.current);

    return () => {
      cleanup();
    };
  }, [call]);

  // Debug: Mostrar estado de participantes
  useEffect(() => {
    console.log('📱 MobileVideoLayout - Participants:', {
      total: allParticipants.length,
      local: localParticipant?.userId || 'not found',
      remotes: remoteParticipants.map(p => p.userId),
      all: allParticipants.map(p => ({ id: p.userId, isLocal: p.isLocalParticipant }))
    });
  }, [allParticipants, localParticipant, remoteParticipants]);

  // Debug overlay para verificar renderizado
  const DebugOverlay = () => (
    <div style={{
      position: 'fixed',
      top: 60,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: '#0f0',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace',
      maxWidth: '250px'
    }}>
      <div>Participants: {allParticipants.length}</div>
      <div>Local: {localParticipant?.userId || 'NONE'}</div>
      <div>Remotes: {remoteParticipants.length}</div>
      <div>Layout: {allParticipants.length === 1 ? 'Single' : allParticipants.length >= 2 && allParticipants.length <= 3 ? 'PiP' : 'Grid'}</div>
    </div>
  );

  // Determinar qué layout mostrar
  const renderLayout = () => {
    // Si no hay participantes
    if (allParticipants.length === 0) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <p>No participants</p>
        </div>
      );
    }

    // Solo local (waiting)
    if (allParticipants.length === 1 && localParticipant) {
      return <SingleParticipantView participant={localParticipant} />;
    }

    // 2+ participantes: Picture-in-Picture o Grid
    if (allParticipants.length >= 2) {
      // Si hay más de 3, usar grid
      if (allParticipants.length > 3) {
        return <MobileGridLayout participants={allParticipants} />;
      }

      // Para 2-3 participantes: Intentar modo PiP
      if (localParticipant && remoteParticipants.length > 0) {
        // Si hay screen share, mostrar quien lo comparte como principal
        const screenSharer = allParticipants.find((p) => hasScreenShare(p));
        if (screenSharer) {
          const other = allParticipants.find((p) => p.sessionId !== screenSharer.sessionId);
          if (other) {
            console.log('📺 Showing PiP with screen sharer:', screenSharer.userId);
            return (
              <DraggablePIP
                mainParticipant={screenSharer}
                pipParticipant={other}
              />
            );
          }
        }

        // Default: Primer remoto grande, local pequeño
        console.log('📺 Showing PiP - Remote:', remoteParticipants[0].userId, 'Local:', localParticipant.userId);
        return (
          <DraggablePIP
            mainParticipant={remoteParticipants[0]}
            pipParticipant={localParticipant}
          />
        );
      }

      // Fallback: Si no se detecta local/remoto correctamente, mostrar grid
      console.log('⚠️ Fallback to grid - could not detect local/remote properly');
      return <MobileGridLayout participants={allParticipants} />;
    }

    // Fallback
    return <MobileGridLayout participants={allParticipants} />;
  };

  return (
    <div ref={containerRef} className="mobile-video-layout">
      {renderLayout()}
      <DebugOverlay />
    </div>
  );
}
