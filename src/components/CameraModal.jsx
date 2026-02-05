import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaTimes, FaUndo, FaPaperPlane } from 'react-icons/fa';

const CameraModal = ({ onClose, onSend }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const handleRetake = () => {
        setImgSrc(null);
    };

    const handleSend = () => {
        if (imgSrc) {
            // Convert base64 to blob/file
            fetch(imgSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    onSend(file);
                    onClose();
                });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-black rounded-lg overflow-hidden flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white z-10 p-2 bg-black/50 rounded-full hover:bg-black/70"
                >
                    <FaTimes size={24} />
                </button>

                {imgSrc ? (
                    <img src={imgSrc} alt="captured" className="w-full h-auto max-h-[70vh] object-contain" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-auto max-h-[70vh] object-contain"
                        videoConstraints={{ facingMode: "user" }}
                    />
                )}

                <div className="flex gap-6 mt-6 mb-4">
                    {imgSrc ? (
                        <>
                            <button onClick={handleRetake} className="flex flex-col items-center gap-2 text-white">
                                <div className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition">
                                    <FaUndo size={24} />
                                </div>
                                <span className="text-xs">Retake</span>
                            </button>
                            <button onClick={handleSend} className="flex flex-col items-center gap-2 text-white">
                                <div className="p-4 rounded-full bg-[#008069] hover:bg-[#006a57] transition shadow-lg">
                                    <FaPaperPlane size={24} />
                                </div>
                                <span className="text-xs">Send</span>
                            </button>
                        </>
                    ) : (
                        <button onClick={capture} className="p-1 border-4 border-white rounded-full">
                            <div className="p-4 bg-white rounded-full border-2 border-black active:scale-95 transition-transform">
                                <div className="w-6 h-6"></div>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
