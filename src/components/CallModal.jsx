import React from 'react';
import { Phone, Video, X } from 'lucide-react';

const CallModal = ({ callData, onClose }) => {
    if (!callData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-80 text-center animate-bounce-in">
                <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {callData.isVideo ? (
                        <Video className="text-white w-8 h-8" />
                    ) : (
                        <Phone className="text-white w-8 h-8" />
                    )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-1">Incoming WhatsApp Call</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                    {callData.from}
                </p>

                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded mb-6 text-left">
                    <strong>Note:</strong> WhatsApp Web API does not support answering calls directly within this dashboard. Please answer on your phone or native WhatsApp app.
                </div>

                <button
                    onClick={onClose}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-full w-full transition duration-300"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

export default CallModal;
