/* eslint-disable react/prop-types */
import React from 'react';
import { IoClose } from 'react-icons/io5';

const QRModal = ({ qrCode, sessionId, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl relative max-w-sm w-full">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    <IoClose size={24} />
                </button>
                <h3 className="text-xl font-bold mb-4 text-center">Scan QR Code</h3>
                <p className="text-center text-gray-600 mb-2 font-mono text-sm">{sessionId}</p>
                <div className="flex justify-center h-64 items-center bg-gray-100 rounded mb-4">
                    {qrCode ? (
                        <img src={qrCode} alt="WhatsApp QR" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-gray-400 animate-pulse">Loading QR...</div>
                    )}
                </div>
                <p className="text-sm text-center text-gray-400">
                    Open WhatsApp {'>'} Linked Devices {'>'} Link a Device
                </p>
            </div>
        </div>
    );
};

export default QRModal;
