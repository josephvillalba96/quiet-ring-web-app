import {
    StreamVideo,
    StreamCall,
    useCallStateHooks,
    ParticipantView,
    useParticipantViewContext,
    VideoPlaceholderProps,
    Call
} from "@stream-io/video-react-sdk";
import { useEffect, useState, useMemo } from "react";
import { VerticalCallLayout } from "./VerticalCallLayout";
import { FixedBottomControls } from "./FixedBottomControls";
import "./vertical-mobile-call.css";

interface VerticalMobileCallProps {
    client: any;
    callId: string;
    call?: Call; // Allow passing existing call object
}

export const VerticalMobileCall = ({ client, callId, call }: VerticalMobileCallProps) => {
    // If a call object is provided, use it directly (StreamCall context might already be present in parent)
    // However, the prompt example wraps StreamVideo and StreamCall. 
    // We will support both: if call is passed, we assume client is already handled or we ignore wrapper if inside existing context.

    // Based on strict prompt adherence:
    return (
        <StreamVideo client={client}>
            <StreamCall call={call} callId={!call ? callId : undefined}>
                <div className="vertical-call-wrapper">
                    <VerticalCallLayout />
                    <FixedBottomControls />
                </div>
            </StreamCall>
        </StreamVideo>
    );
};
