import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ParticipantView,
  useCallStateHooks,
  useCall,
  hasScreenShare,
} from '@stream-io/video-react-sdk';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MobileVideoLayout() {
  const call = useCall();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // Sort participants: screen sharer first, then dominant speaker, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    // Screen sharer first
    if (hasScreenShare(a) && !hasScreenShare(b)) return -1;
    if (!hasScreenShare(a) && hasScreenShare(b)) return 1;
    
    // Then dominant speaker
    if (b.isDominantSpeaker && !a.isDominantSpeaker) return 1;
    if (a.isDominantSpeaker && !b.isDominantSpeaker) return -1;
    
    return 0;
  });

  // Auto-switch to dominant speaker when it changes
  useEffect(() => {
    if (sortedParticipants.length === 0) return;
    
    // Find dominant speaker or screen sharer
    const dominantIndex = sortedParticipants.findIndex(
      (p) => p.isDominantSpeaker || hasScreenShare(p)
    );
    
    if (dominantIndex !== -1 && dominantIndex !== currentIndex) {
      setCurrentIndex(dominantIndex);
    }
  }, [participants, sortedParticipants, currentIndex]);

  // Handle swipe gestures
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (sortedParticipants.length <= 1) return;
    
    if (direction === 'left' && currentIndex < sortedParticipants.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, sortedParticipants.length]);

  // Touch event handlers for swipe
  const touchStartX = useRef<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleSwipe('left');
      } else {
        handleSwipe('right');
      }
    }
    
    touchStartX.current = null;
  };

  // Setup viewport tracking for video quality optimization
  useEffect(() => {
    if (!call || !containerRef.current) return;

    const cleanup = call.dynascaleManager.setViewport(containerRef.current);
    
    return () => {
      cleanup();
    };
  }, [call]);

  if (sortedParticipants.length === 0) {
    return (
      <div className="mobile-video-layout flex items-center justify-center h-full bg-gray-900 text-white">
        <p>No participants</p>
      </div>
    );
  }

  const currentParticipant = sortedParticipants[currentIndex];
  const hasMultipleParticipants = sortedParticipants.length > 1;

  return (
    <div 
      ref={containerRef}
      className="mobile-video-layout relative w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentParticipant.sessionId}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          <ParticipantView
            participant={currentParticipant}
            trackType={hasScreenShare(currentParticipant) ? 'screenShareTrack' : 'videoTrack'}
            muteAudio={currentParticipant.isLocalParticipant}
          />
        </motion.div>
      </AnimatePresence>

      {/* Participant dots indicator */}
      {hasMultipleParticipants && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {sortedParticipants.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe indicators */}
      {hasMultipleParticipants && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => handleSwipe('right')}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < sortedParticipants.length - 1 && (
            <button
              onClick={() => handleSwipe('left')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* Participant name overlay */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
          {currentParticipant.name || currentParticipant.userId}
          {currentParticipant.isLocalParticipant && ' (You)'}
        </div>
      </div>
    </div>
  );
}
