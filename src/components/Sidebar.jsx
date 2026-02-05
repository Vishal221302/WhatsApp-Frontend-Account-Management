/* eslint-disable react/prop-types */
import React from 'react';
import { IoAdd, IoLogOut } from 'react-icons/io5';
import { FaWhatsapp } from "react-icons/fa";

const Sidebar = ({ sessions, activeSessionId, onSelectSession, onAddAccount, onSessionLogout, onAdminLogout }) => {
    return (
        <div className="w-64 bg-gray-900 h-screen flex flex-col border-r border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h1 className="text-white font-bold flex items-center gap-2">
                    <FaWhatsapp className="text-green-500 size-6" /> MultiWa
                </h1>
                <button
                    onClick={onAddAccount}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                    title="Add Account"
                >
                    <IoAdd size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {sessions.map(session => (
                    <div
                        key={session.sessionId}
                        onClick={() => onSelectSession(session.sessionId)}
                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors ${activeSessionId === session.sessionId ? 'bg-gray-800 border-l-4 border-green-500' : ''}`}
                    >
                        <div className="mr-3 relative">
                            {session.userInfo?.profilePicUrl ? (
                                <img
                                    src={session.userInfo.profilePicUrl}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                    onClick={(e) => { e.stopPropagation(); alert(`User: ${session.userInfo.pushname || 'Unknown'}\nNumber: ${session.userInfo.number}`); }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                    {session.userInfo?.pushname?.[0] || session.sessionId[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <p className="text-gray-200 font-medium truncate">
                                    {session.userInfo?.pushname || session.sessionId}
                                </p>
                                {session.unreadCount > 0 && (
                                    <div className="bg-green-500 text-white rounded-full text-[10px] font-bold h-5 min-w-[1.25rem] px-1 flex items-center justify-center transform scale-100 transition-transform">
                                        {session.unreadCount > 99 ? '99+' : session.unreadCount}
                                    </div>
                                )}
                            </div>
                            <p className={`text-xs ${getStatusColor(session.status)}`}>
                                {session.status}
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSessionLogout(session.sessionId); }}
                            className="text-gray-500 hover:text-red-500 transition-colors ml-2"
                        >
                            <IoLogOut size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={onAdminLogout}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white p-2 rounded-lg transition-colors text-sm font-medium"
                >
                    <IoLogOut size={18} /> Sign Out
                </button>
            </div>
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'ready': return 'text-green-500';
        case 'authenticated': return 'text-blue-500';
        case 'disconnected': return 'text-red-500';
        case 'initializing': return 'text-yellow-500';
        default: return 'text-gray-500';
    }
}

export default Sidebar;
