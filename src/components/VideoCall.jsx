import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';

const VideoCall = ({
    localStream,
    remoteStream,
    isCallAccepted,
    isCallEnded,
    callEnded,
    onEndCall,
    userName,
    partnerName
}) => {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, isCallAccepted]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track in local stream
                const videoTrack = localStream.getVideoTracks()[0];
                localStream.removeTrack(videoTrack);
                localStream.addTrack(screenTrack);

                // Listen for when user stops screen sharing via browser UI
                screenTrack.onended = () => {
                    stopScreenShare();
                };

                setIsScreenSharing(true);
            } else {
                stopScreenShare();
            }
        } catch (error) {
            console.error("Error sharing screen", error);
        }
    };

    const stopScreenShare = async () => {
        // Revert to camera
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const cameraTrack = userStream.getVideoTracks()[0];

            const screenTrack = localStream.getVideoTracks()[0];
            localStream.removeTrack(screenTrack);
            localStream.addTrack(cameraTrack);
            screenTrack.stop(); // Stop screen share explicitly if not already

            setIsScreenSharing(false);
        } catch (e) {
            console.error("Failed to switch back to camera", e);
        }
    };

    if (callEnded && !localStream) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            <div className="flex-1 relative flex items-center justify-center p-4">
                {/* Remote Video (Main) */}
                {isCallAccepted && !callEnded ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <video
                            playsInline
                            ref={remoteVideoRef}
                            autoPlay
                            className="max-w-full max-h-full rounded-lg shadow-xl bg-black"
                            style={{ transform: 'scaleX(-1)' }} // Mirror effect often desired but maybe optional for remote
                        />
                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                            {partnerName || "Remote User"}
                        </div>
                    </div>
                ) : (
                    <div className="text-white text-2xl animate-pulse">
                        Calling
                    </div>
                )}

                {/* Local Video (PiP) */}
                {localStream && (
                    <div className="absolute bottom-24 right-4 w-48 h-36 bg-black rounded-lg border-2 border-gray-700 shadow-2xl overflow-hidden z-20">
                        <video
                            playsInline
                            muted
                            ref={localVideoRef}
                            autoPlay
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            You
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-6 flex justify-center items-center space-x-6">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={toggleScreenShare}
                    className={`p-4 rounded-full transition ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                >
                    {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                </button>

                <button
                    onClick={onEndCall}
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition transform hover:scale-105"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
