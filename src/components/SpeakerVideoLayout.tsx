import { useEffect, useRef, useMemo } from 'react';
import {
    ParticipantView,
    useCallStateHooks,
    useCall,
    hasScreenShare,
} from '@stream-io/video-react-sdk';

// Configurable heights
const PARTICIPANTS_BAR_HEIGHT = 120; // Height of the bottom bar

export function SpeakerVideoLayout() {
    const call = useCall();
    const { useParticipants } = useCallStateHooks();
    const allParticipants = useParticipants();
    const participantsBarRef = useRef<HTMLDivElement>(null);

    // Apply custom sorting: Screen Share > Dominant Speaker > Local > Others
    // This ensures the "most important" person is first (Spotlight)
    useEffect(() => {
        if (!call) return;
        // We'll rely on default sorting for the bar, but we can enforce some rules if needed.
        // For now, let's keep it simple.
    }, [call]);

    // Determine who is in the Spotlight vs Bar
    const { spotlightParticipant, barParticipants } = useMemo(() => {
        if (allParticipants.length === 0) return { spotlightParticipant: null, barParticipants: [] };

        // Priority for Spotlight:
        // 1. Screen Share (any remote)
        // 2. Pinned Participant (if we had pinning, skipping for now)
        // 3. Dominant Speaker (Remote)
        // 4. First Remote Participant
        // 5. Local Participant (fallback)

        // Find screen sharer
        const screenSharer = allParticipants.find(p => hasScreenShare(p) && !p.isLocalParticipant); // Prefer remote screen share

        // Find dominant speaker (that is not local, ideally)
        const dominant = allParticipants.find(p => p.isDominantSpeaker && !p.isLocalParticipant);

        // Find first remote video
        const firstRemote = allParticipants.find(p => !p.isLocalParticipant);

        let spotlight = screenSharer || dominant || firstRemote || allParticipants[0];

        // The rest go to the bar
        let others = allParticipants.filter(p => p.sessionId !== spotlight?.sessionId);

        // Always put local participant in the bar if they are not the spotlight
        // (They might be spotlight if they are the only one, or if they are screen sharing and we want to show it)

        return {
            spotlightParticipant: spotlight,
            barParticipants: others
        };
    }, [allParticipants]);

    // Optimize bandwidth: only subscribe to visible videos in the bar
    useEffect(() => {
        if (!call || !participantsBarRef.current) return;

        const cleanup = call.dynascaleManager.setViewport(participantsBarRef.current);

        return () => cleanup();
    }, [call]);

    if (!spotlightParticipant) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-950 text-white">
                <p>Waiting for everyone...</p>
            </div>
        );
    }

    return (
        <div className="speaker-video-layout">
            {/* Spotlight Area (Main Speaker) */}
            <div className="spotlight-container">
                <ParticipantView
                    participant={spotlightParticipant}
                    trackType={hasScreenShare(spotlightParticipant) ? 'screenShareTrack' : 'videoTrack'}
                    className="mobile-spotlight-view"
                // High quality for spotlight
                />
                <div className="participant-label-large">
                    {spotlightParticipant.name || spotlightParticipant.userId}
                    {spotlightParticipant.isLocalParticipant && ' (You)'}
                    {hasScreenShare(spotlightParticipant) && ' (Presenting)'}
                </div>
            </div>

            {/* Participants Bar (Horizontal Scroll) */}
            {barParticipants.length > 0 && (
                <div
                    ref={participantsBarRef}
                    className="participants-bar-container"
                    style={{ height: PARTICIPANTS_BAR_HEIGHT }}
                >
                    <div className="participants-bar-scroll">
                        {barParticipants.map((participant) => (
                            <div key={participant.sessionId} className="participant-bar-item">
                                <ParticipantView
                                    participant={participant}
                                    trackType={hasScreenShare(participant) ? 'screenShareTrack' : 'videoTrack'}
                                    muteAudio={participant.isLocalParticipant} // Prevent echo from own audio in view
                                />
                                <div className="participant-label-small">
                                    {participant.isLocalParticipant ? 'You' : (participant.name || participant.userId)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
