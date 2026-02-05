import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'whatsapp-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Controls */}
                <div className="absolute -top-12 right-0 flex gap-4">
                    <button
                        onClick={handleDownload}
                        className="text-white hover:text-gray-300 transition-colors p-2 bg-black/40 rounded-full"
                        title="Download"
                    >
                        <FaDownload size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 transition-colors p-2 bg-black/40 rounded-full"
                        title="Close"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Image */}
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};

export default ImagePreviewModal;
