import { useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";

export const FixedBottomControls = () => {
    const call = useCall();
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    const toggleAudio = async () => {
        if (call) {
            await call.microphone.toggle();
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = async () => {
        if (call) {
            await call.camera.toggle();
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleSpeaker = () => {
        // Lógica para cambiar audio output en mobile
        setIsSpeakerOn(!isSpeakerOn);
    };

    const endCall = () => {
        call?.leave();
    };

    return (
        <div className="fixed-controls-container">
            <div className="controls-row">
                <button
                    className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
                    onClick={toggleAudio}
                    aria-label="Toggle microphone"
                >
                    <span className="icon">{isAudioEnabled ? '🎤' : '🚫🎤'}</span>
                    <span className="label">{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
                </button>

                <button
                    className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                    onClick={toggleVideo}
                    aria-label="Toggle camera"
                >
                    <span className="icon">{isVideoEnabled ? '📹' : '🚫📹'}</span>
                    <span className="label">{isVideoEnabled ? 'Stop' : 'Start'}</span>
                </button>

                <button
                    className={`control-btn secondary ${!isSpeakerOn ? 'disabled' : ''}`}
                    onClick={toggleSpeaker}
                    aria-label="Toggle speaker"
                >
                    <span className="icon">{isSpeakerOn ? '🔊' : '🔈'}</span>
                    <span className="label">Speaker</span>
                </button>

                <button
                    className="control-btn end-call"
                    onClick={endCall}
                    aria-label="End call"
                >
                    <span className="icon">📞</span>
                    <span className="label">End</span>
                </button>
            </div>

            {/* Indicador de swipe up para más opciones (opcional) */}
            <div className="more-options-hint">
                <span className="chevron">⌃</span>
                <span className="hint-text">Más opciones</span>
            </div>
        </div>
    );
};
