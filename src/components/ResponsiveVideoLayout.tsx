import { SpeakerLayout, PaginatedGridLayout, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileVideoLayout } from './MobileVideoLayout';

export function ResponsiveVideoLayout() {
  // Detect mobile devices (tablets and phones in portrait)
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const participantCount = participants.length;

  // Mobile layout: Full screen single participant with swipe
  if (isMobile || isSmallMobile) {
    return <MobileVideoLayout />;
  }

  // Tablet layout: Paginated grid for better space usage
  if (participantCount > 4) {
    return (
      <PaginatedGridLayout 
        groupSize={6}
        mirrorLocalParticipantVideo={true}
        pageArrowsVisible={true}
      />
    );
  }

  // Desktop layout: Speaker layout with participants bar at bottom
  return (
    <SpeakerLayout 
      participantsBarPosition="bottom"
      mirrorLocalParticipantVideo={true}
      enableDragToScroll={true}
    />
  );
}
