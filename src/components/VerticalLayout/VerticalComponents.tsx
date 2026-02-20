import { useParticipantViewContext, VideoPlaceholderProps } from "@stream-io/video-react-sdk";

export const VerticalParticipantViewUI = () => {
    const { participant } = useParticipantViewContext();
    const hasAudio = participant.publishedTracks.includes("audio" as any);
    const hasVideo = participant.publishedTracks.includes("video" as any);

    return (
        <div className="vertical-participant-ui">
            {/* Header con calidad de conexión */}
            <div className="video-header">
                {participant.connectionQuality === 0 /* Poor */ && (
                    <span className="quality-badge poor">Señal débil</span>
                )}
                {participant.isSpeaking && (
                    <span className="speaking-badge">Hablando...</span>
                )}
            </div>

            {/* Footer con info del participante */}
            <div className="video-footer">
                <div className="participant-identity">
                    {participant.name || participant.userId}
                    {participant.sessionId === participant.userId && " (Tú)"}
                </div>

                <div className="media-status">
                    {!hasAudio && <span className="status-icon muted">🔇</span>}
                    {!hasVideo && <span className="status-icon muted">🚫📹</span>}
                </div>
            </div>

            {/* Reacciones flotantes */}
            {participant.reaction && (
                <div className="floating-reaction">
                    {participant.reaction.emoji}
                </div>
            )}
        </div>
    );
};

export const MinimalParticipantViewUI = () => {
    const { participant } = useParticipantViewContext();
    const hasAudio = participant.publishedTracks.includes("audio" as any);

    return (
        <div className="minimal-ui">
            <span className="mini-name">{participant.name?.split(' ')[0] || participant.userId}</span>
            {!hasAudio && <span className="mini-mute">🔇</span>}
        </div>
    );
};

export const VerticalVideoPlaceholder = ({ style }: VideoPlaceholderProps) => {
    const { participant } = useParticipantViewContext();

    return (
        <div className="vertical-placeholder" style={style}>
            <div className="placeholder-avatar-large">
                {participant.image ? (
                    <img src={participant.image} alt="" />
                ) : (
                    <span className="initials">
                        {(participant.name || participant.userId).slice(0, 2).toUpperCase()}
                    </span>
                )}
            </div>
            <p className="placeholder-text">{participant.name || participant.userId}</p>
            <p className="placeholder-subtext">Cámara apagada</p>
        </div>
    );
};
