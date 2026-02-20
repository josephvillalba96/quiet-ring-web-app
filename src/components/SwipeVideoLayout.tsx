import { useMemo, useEffect, useRef } from 'react';
import {
  ParticipantView,
  VideoPreview,
  useCallStateHooks,
  useCall,
  hasScreenShare,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';

const PARTICIPANTS_PER_SLIDE = 2;

const ParticipantTile = ({
  participant,
  showLabel = true,
}: {
  participant: StreamVideoParticipant;
  showLabel?: boolean;
}) => {
  return (
    <div className="swipe-participant-tile">
      <ParticipantView
        participant={participant}
        trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
        muteAudio={participant.isLocalParticipant}
      />
      {showLabel && (
        <div className="swipe-participant-label">
          {participant.name || participant.userId}
          {participant.isLocalParticipant && ' (You)'}
        </div>
      )}
    </div>
  );
};

const LocalParticipantPIP = () => {
  return (
    <div className="swipe-local-pip">
      <VideoPreview />
      <div className="swipe-local-pip-label">You</div>
    </div>
  );
};

export function SwipeVideoLayout() {
  const call = useCall();
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const { useParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();

  // Setup viewport tracking for bandwidth optimization
  useEffect(() => {
    if (!call || !swipeContainerRef.current) return;

    const cleanup = call.dynascaleManager.setViewport(swipeContainerRef.current);

    return () => {
      cleanup();
    };
  }, [call]);

  // Apply custom sorting: screen share > others (local last)
  useEffect(() => {
    if (!call) return;

    const customSorting = (a: StreamVideoParticipant, b: StreamVideoParticipant) => {
      if (hasScreenShare(a) && !hasScreenShare(b)) return -1;
      if (!hasScreenShare(a) && hasScreenShare(b)) return 1;
      if (a.isLocalParticipant) return 1;
      if (b.isLocalParticipant) return -1;
      return 0;
    };

    call.setSortParticipantsBy(customSorting);
  }, [call]);

  const { localParticipant, slides, hasLocalInFirstSlide } = useMemo(() => {
    const local = allParticipants.find((p) => p.isLocalParticipant);
    const remotes = allParticipants.filter((p) => !p.isLocalParticipant);

    const slideCount = Math.ceil(allParticipants.length / PARTICIPANTS_PER_SLIDE);
    const slideArray: StreamVideoParticipant[][] = [];

    if (local) {
      slideArray.push([local]);
      let currentSlide = 0;
      let slideIndex = 1;

      for (const remote of remotes) {
        if (slideArray[currentSlide].length < PARTICIPANTS_PER_SLIDE) {
          slideArray[currentSlide].push(remote);
        } else if (slideIndex < slideCount) {
          currentSlide = slideIndex;
          slideArray[currentSlide] = [remote];
          slideIndex++;
        }
      }
    } else {
      for (let i = 0; i < allParticipants.length; i += PARTICIPANTS_PER_SLIDE) {
        slideArray.push(allParticipants.slice(i, i + PARTICIPANTS_PER_SLIDE));
      }
    }

    return {
      localParticipant: local,
      slides: slideArray,
      hasLocalInFirstSlide: !!local,
    };
  }, [allParticipants]);

  if (allParticipants.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <p>No participants</p>
      </div>
    );
  }

  if (allParticipants.length === 1 && localParticipant) {
    return (
      <div className="swipe-single-participant">
        <ParticipantTile participant={localParticipant} />
      </div>
    );
  }

  const totalSlides = slides.length;

  return (
    <div className="swipe-video-layout">
      <div ref={swipeContainerRef} className="swipe-video-container">
        {slides.map((slideParticipants, slideIndex) => (
          <div key={slideIndex} className="swipe-video-slide">
            {slideParticipants.map((participant) => (
              <ParticipantTile key={participant.sessionId} participant={participant} />
            ))}
            
            {slideIndex === 0 && hasLocalInFirstSlide && localParticipant && slideParticipants.length < PARTICIPANTS_PER_SLIDE && (
              <LocalParticipantPIP />
            )}
            
            {!hasLocalInFirstSlide && slideParticipants.length < PARTICIPANTS_PER_SLIDE && (
              <LocalParticipantPIP />
            )}
          </div>
        ))}
      </div>

      {totalSlides > 1 && (
        <div className="swipe-pagination">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div key={index} className="swipe-pagination-dot" data-index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
