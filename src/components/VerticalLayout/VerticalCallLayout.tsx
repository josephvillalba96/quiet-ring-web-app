import {
    useCallStateHooks,
    ParticipantView,
    useParticipantViewContext
} from "@stream-io/video-react-sdk";
import { useMemo } from "react";
import { VerticalVideoPlaceholder, VerticalParticipantViewUI, MinimalParticipantViewUI } from "./VerticalComponents";

export const VerticalCallLayout = () => {
    const { useParticipants, useLocalParticipant, useDominantSpeaker } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const dominantSpeaker = useDominantSpeaker();

    // Lógica: Priorizar participantes remotos para la pantalla principal.
    // El usuario local debe ir a los thumbnails (PiP).
    const mainParticipant = useMemo(() => {
        const remoteParticipants = participants.filter(p => p.sessionId !== localParticipant?.sessionId);
        if (remoteParticipants.length > 0) {
            // Si el orador dominante es remoto, lo usamos. Si no, el primer remoto disponible.
            const isDominantRemote = dominantSpeaker && dominantSpeaker.sessionId !== localParticipant?.sessionId;
            return isDominantRemote ? dominantSpeaker : remoteParticipants[0];
        }
        // Si no hay nadie más, mostramos al local como fallback.
        return localParticipant;
    }, [dominantSpeaker, localParticipant, participants]);

    const otherParticipants = useMemo(() => {
        // Los "otros" son todos los que no están en la pantalla principal (incluyendo al local si el main es remoto).
        return participants.filter(p => p.sessionId !== mainParticipant?.sessionId);
    }, [participants, mainParticipant]);

    return (
        <div className="vertical-layout">
            {/* SECCIÓN PRINCIPAL - Video Grande */}
            <div className="main-video-section">
                {mainParticipant && (
                    <ParticipantView
                        participant={mainParticipant}
                        trackType="videoTrack"
                        VideoPlaceholder={VerticalVideoPlaceholder}
                        ParticipantViewUI={VerticalParticipantViewUI}
                        // Add specific style to force object-fit cover via class, but also inline style if needed for SDK specificity
                        className="main-participant-view"
                    />
                )}
            </div>

            {/* SECCIÓN SECUNDARIA - Thumbnails Verticales */}
            {otherParticipants.length > 0 && (
                <div className="thumbnails-section">
                    <div className="thumbnails-scroll">
                        {otherParticipants.map((participant) => (
                            <div key={participant.sessionId} className="thumbnail-item">
                                <ParticipantView
                                    participant={participant}
                                    trackType="videoTrack"
                                    VideoPlaceholder={VerticalVideoPlaceholder}
                                    ParticipantViewUI={MinimalParticipantViewUI}
                                    className="thumbnail-participant-view"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
