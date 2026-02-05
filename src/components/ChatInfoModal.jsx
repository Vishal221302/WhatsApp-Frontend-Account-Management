import React, { useEffect, useState } from 'react';
import { getChatInfo, groupAction, getChatMedia } from '../services/api';
import { FaUserCircle, FaTimes, FaCamera, FaUserPlus, FaTrash, FaUserShield, FaPencilAlt, FaCheck, FaPhone, FaVideo, FaSearch, FaChevronRight, FaStar, FaLock, FaSignOutAlt, FaBan, FaThumbsDown, FaArrowLeft, FaFileAlt, FaLink, FaImage } from 'react-icons/fa';

const ChatInfoModal = ({ sessionId, chat, onClose }) => {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingSubject, setEditingSubject] = useState(false);
    const [newSubject, setNewSubject] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchInfo();
    }, [chat.id]);

    const fetchInfo = async () => {
        setLoading(true);
        try {
            const { data } = await getChatInfo(sessionId, chat.id);
            setInfo(data);
            setNewSubject(data.name);
        } catch (e) {
            console.error("Failed to fetch info", e);
            setError("Failed to load info");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubject = async () => {
        if (!newSubject.trim()) return;
        try {
            await groupAction(sessionId, chat.id, 'subject', { subject: newSubject });
            setEditingSubject(false);
            fetchInfo();
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed to update subject");
        }
    };

    const handleRemoveParticipant = async (participantId) => {
        if (!confirm("Remove this user?")) return;
        try {
            await groupAction(sessionId, chat.id, 'remove', { participants: [participantId] });
            fetchInfo();
        } catch (e) {
            alert("Failed to remove user");
        }
    };

    const handlePromoteParticipant = async (participantId) => {
        if (!confirm("Make group admin?")) return;
        try {
            await groupAction(sessionId, chat.id, 'promote', { participants: [participantId] });
            fetchInfo();
        } catch (e) {
            alert("Failed to promote user");
        }
    };

    const handleAddParticipant = async () => {
        const number = prompt("Enter phone number to add (with country code):");
        if (!number) return;
        try {
            const id = number.includes('@') ? number : `${number}@c.us`;
            await groupAction(sessionId, chat.id, 'add', { participants: [id] });
            fetchInfo();
        } catch (e) {
            alert("Failed to add user: " + e.message);
        }
    };

    if (!info && loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-4 rounded">Loading...</div></div>;
    if (!info) return null;

    // Helper for buttons
    const ActionButton = ({ icon, label, onClick }) => (
        <button className="flex flex-col items-center gap-2 flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors group" onClick={onClick}>
            <div className="text-[#008069] text-xl group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[#008069] text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
            <div className="w-[400px] h-full bg-[#f0f2f5] shadow-2xl flex flex-col animate-slide-in-right overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-white p-2 flex items-center gap-4 border-b border-gray-200">
                    <button onClick={onClose}><FaTimes className="text-gray-500 text-lg" /></button>
                    <h2 className="text-md font-medium text-gray-800">{info.isGroup ? 'Group Info' : 'Contact Info'}</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Profile Section */}
                    <div className="bg-white p-6 flex flex-col items-center mb-3 shadow-sm">
                        {chat.profilePicUrl ? (
                            <img src={chat.profilePicUrl} className="w-40 h-40 rounded-full object-cover mb-4 shadow-sm" />
                        ) : (
                            <FaUserCircle className="w-40 h-40 text-gray-300 mb-4" />
                        )}

                        <div className="text-center w-full">
                            {editingSubject ? (
                                <div className="flex items-center gap-2 justify-center">
                                    <input
                                        value={newSubject}
                                        onChange={e => setNewSubject(e.target.value)}
                                        className="border-b-2 border-[#008069] text-center text-xl p-1 outline-none w-2/3"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateSubject} className="text-[#008069]"><FaCheck /></button>
                                </div>
                            ) : (
                                <div className="relative group inline-block">
                                    <h1 className="text-2xl font-normal text-gray-800 mb-1">{info.name}</h1>
                                    <p className="text-gray-500 text-lg">{info.isGroup ? `Group · ${info.participants.length} participants` : info.participants[0]?.number}</p>
                                    {info.isGroup && (
                                        <button onClick={() => setEditingSubject(true)} className="absolute -right-8 top-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"><FaPencilAlt /></button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex w-full mt-6 border-t border-gray-100 pt-4 px-4 bg-white">
                            <ActionButton icon={<FaPhone />} label="Audio" onClick={() => alert('Call feature coming soon')} />
                            <ActionButton icon={<FaVideo />} label="Video" onClick={() => alert('Video calls coming soon')} />
                            <ActionButton icon={<FaSearch />} label="Search" onClick={() => alert('Search in chat coming soon')} />
                        </div>
                    </div>

                    {/* About Section */}
                    {info.about && !info.isGroup && (
                        <div className="bg-white p-4 mb-3 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
                            <p className="text-gray-800 text-base">{info.about}</p>
                            <p className="text-gray-400 text-xs mt-1">October 24, 2023</p>
                        </div>
                    )}

                    {/* Description for Groups */}
                    {info.isGroup && info.description && (
                        <div className="bg-white p-4 mb-3 shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Group Description</h3>
                            <p className="text-gray-800">{info.description}</p>
                        </div>
                    )}

                    {/* Media, Links, Docs */}
                    <div className="bg-white p-4 mb-3 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => alert('Media gallery coming soon')}>
                        <span className="text-gray-800">Media, Links, and Docs</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">0</span>
                            <FaChevronRight className="text-gray-400 text-xs" />
                        </div>
                    </div>

                    {/* Starred, Encryption placeholders */}
                    <div className="bg-white mb-3 shadow-sm">
                        <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100">
                            <div className="bg-gray-200 p-2 rounded"><FaStar className="text-gray-500" /></div>
                            <span className="text-gray-800">Starred Messages</span>
                            <FaChevronRight className="text-gray-400 text-xs ml-auto" />
                        </div>
                        <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100">
                            <div className="bg-gray-200 p-2 rounded"><FaLock className="text-gray-500" /></div>
                            <div className="flex flex-col">
                                <span className="text-gray-800">Encryption</span>
                                <span className="text-xs text-gray-500">Messages and calls are end-to-end encrypted.</span>
                            </div>
                        </div>
                    </div>


                    {/* Participants Section (Groups) */}
                    {info.isGroup && (
                        <div className="bg-white shadow-sm mb-3">
                            <div className="p-4 flex items-center justify-between pb-2">
                                <span className="text-gray-500 text-sm font-medium">{info.participants.length} participants</span>
                                <FaSearch className="text-gray-400" />
                            </div>

                            <div onClick={handleAddParticipant} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer">
                                <div className="bg-[#008069] p-3 rounded-full text-white"><FaUserPlus /></div>
                                <span className="text-gray-800">Add Participant</span>
                            </div>

                            {info.participants.map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer group relative">
                                    <FaUserCircle className="size-10 text-gray-300" />
                                    <div className="flex-1 min-w-0 border-b border-gray-100 pb-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 font-normal">{p.name || p.pushname || `+${p.number}`}</span>
                                            {p.isAdmin && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">Group Admin</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 overflow-hidden text-ellipsis">~{p.pushname || p.number}</p>
                                    </div>
                                    {/* Admin Actions */}
                                    <div className="hidden group-hover:flex items-center gap-2 absolute right-4 bg-white shadow-lg p-2 rounded-lg z-10">
                                        <button onClick={(e) => { e.stopPropagation(); handlePromoteParticipant(p.id); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded" title="Make Admin"><FaUserShield /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveParticipant(p.id); }} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Remove"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Exit/Block Actions */}
                    <div className="bg-white shadow-sm p-4 mb-10">
                        {info.isGroup ? (
                            <div className="flex items-center gap-4 text-red-500 cursor-pointer" onClick={() => alert('Exit functionality coming soon')}>
                                <FaSignOutAlt />
                                <span>Exit Group</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 text-red-500 cursor-pointer">
                                    <FaBan />
                                    <span>Block {info.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-red-500 cursor-pointer">
                                    <FaThumbsDown />
                                    <span>Report {info.name}</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};


const MediaGallery = ({ sessionId, chat, onClose }) => {
    const [media, setMedia] = useState({ media: [], docs: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('media'); // media, docs, links

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const { data } = await getChatMedia(sessionId, chat.id);
                setMedia(data);
            } catch (e) {
                console.error("Failed to load media", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [sessionId, chat.id]);

    return (
        <div className="flex flex-col h-full bg-white animate-slide-in-right">
            <div className="bg-white p-3 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onClose}><FaArrowLeft className="text-gray-500" /></button>
                <div className="flex-1">
                    <h2 className="text-md font-medium text-gray-800">Media, Links, and Docs</h2>
                </div>
            </div>

            <div className="flex items-center justify-around border-b border-gray-200">
                <button onClick={() => setTab('media')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'media' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Media</button>
                <button onClick={() => setTab('docs')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'docs' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Docs</button>
                <button onClick={() => setTab('links')} className={`flex-1 py-3 text-sm font-medium border-b-2 text-center transition-colors ${tab === 'links' ? 'border-[#008069] text-[#008069]' : 'border-transparent text-gray-500'}`}>Links</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? <div className="text-center p-4 text-gray-500">Loading...</div> : (
                    <>
                        {tab === 'media' && (
                            <div className="grid grid-cols-3 gap-1">
                                {media.media.map(m => (
                                    <div key={m.id} className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <FaImage className="text-gray-300 text-3xl" />
                                        <span className="absolute bottom-1 right-1 text-[10px] text-gray-500">{new Date(m.timestamp * 1000).toLocaleDateString()}</span>
                                    </div>
                                ))}
                                {media.media.length === 0 && <div className="col-span-3 text-center text-gray-500 mt-10">No media found</div>}
                            </div>
                        )}

                        {tab === 'docs' && (
                            <div className="flex flex-col">
                                {media.docs.map(d => (
                                    <div key={d.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-50">
                                        <FaFileAlt className="text-gray-400 text-xl" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{d.filename || 'Document'}</p>
                                            <p className="text-xs text-gray-500">{new Date(d.timestamp * 1000).toLocaleDateString()} • {d.mimetype}</p>
                                        </div>
                                    </div>
                                ))}
                                {media.docs.length === 0 && <div className="text-center text-gray-500 mt-10">No documents found</div>}
                            </div>
                        )}

                        {tab === 'links' && (
                            <div className="flex flex-col gap-2">
                                {media.links.map(l => (
                                    <div key={l.id} className="bg-gray-50 p-3 rounded-lg flex gap-3">
                                        <div className="bg-gray-200 p-2 rounded h-fit"><FaLink className="text-gray-500" /></div>
                                        <div className="flex-1 min-w-0">
                                            <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all font-medium block mb-1">{l.url}</a>
                                            <p className="text-xs text-gray-500 line-clamp-2">{l.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {media.links.length === 0 && <div className="text-center text-gray-500 mt-10">No links found</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatInfoModal;
