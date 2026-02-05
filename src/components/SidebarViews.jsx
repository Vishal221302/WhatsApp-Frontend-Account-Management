import { useState, useEffect } from 'react';
import { getStatus, postStatus, deleteStatus } from '../services/api';
import { FaPlus, FaTimes, FaPen, FaCircleNotch, FaUserCircle, FaTrash, FaEye, FaArrowLeft, FaCamera, FaImage, FaPaperPlane } from "react-icons/fa";
import CameraModal from './CameraModal';

export const StatusView = ({ sessionId }) => {
    const [statuses, setStatuses] = useState({ myStatus: [], otherStatuses: [] });
    const [loading, setLoading] = useState(true);
    const [viewingStatus, setViewingStatus] = useState(null); // content of status being viewed
    const [creatingStatus, setCreatingStatus] = useState(false);
    const [newStatusText, setNewStatusText] = useState("");
    const [viewedStatusIds, setViewedStatusIds] = useState(new Set());
    const [managingMyStatus, setManagingMyStatus] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(`viewedStatuses_${sessionId}`);
        if (stored) {
            setViewedStatusIds(new Set(JSON.parse(stored)));
        }
    }, [sessionId]);

    useEffect(() => {
        fetchStatus();
    }, [sessionId]);

    const fetchStatus = async () => {
        try {
            const response = await getStatus(sessionId);
            const { data } = response;
            setStatuses(data);
        } catch (e) {
            console.error("[StatusView] Failed to fetch status", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePostStatus = async () => {
        if (!newStatusText.trim() && !selectedFile) return;
        try {
            await postStatus(sessionId, newStatusText, selectedFile);
            setCreatingStatus(false);
            setNewStatusText("");
            setSelectedFile(null);
            fetchStatus();
        } catch (e) {
            alert("Failed to post status");
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDeleteStatus = async (statusId) => {
        if (!confirm("Delete this status update?")) return;
        try {
            await deleteStatus(sessionId, statusId);
            fetchStatus();
        } catch (e) {
            alert("Failed to delete status");
        }
    };

    const markAsViewed = (statusId) => {
        if (!viewedStatusIds.has(statusId)) {
            const newSet = new Set(viewedStatusIds);
            newSet.add(statusId);
            setViewedStatusIds(newSet);
            localStorage.setItem(`viewedStatuses_${sessionId}`, JSON.stringify([...newSet]));
        }
    };

    const hasUnseenStatus = (userStatus) => {
        return userStatus.statuses.some(s => !viewedStatusIds.has(s.id));
    };

    const StatusViewer = ({ statusList, onClose }) => {
        // Mark all as viewed when opening for now
        useEffect(() => {
            statusList.forEach(s => markAsViewed(s.id));
        }, []);

        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white" onClick={onClose}>
                <button className="absolute top-4 right-4 text-white p-2 z-50 rounded-full bg-black/50 hover:bg-black/80" onClick={onClose}><FaTimes size={24} /></button>
                <div className="w-full max-w-md h-full flex flex-col justify-center p-4 relative" onClick={e => e.stopPropagation()}>
                    {statusList.map(s => (
                        <div key={s.id} className="mb-4 bg-gray-900 p-2 rounded-lg text-center relative flex flex-col items-center justify-center min-h-[50vh]">
                            {s.media ? (
                                <div className="w-full flex justify-center mb-4 bg-black rounded overflow-hidden">
                                    {s.media.mimetype.startsWith('video') ? (
                                        <video src={`data:${s.media.mimetype};base64,${s.media.data}`} controls className="max-h-[70vh] max-w-full object-contain" autoPlay muted />
                                    ) : (
                                        <img src={`data:${s.media.mimetype};base64,${s.media.data}`} className="max-h-[70vh] max-w-full object-contain" />
                                    )}
                                </div>
                            ) : null}
                            {s.body && <p className={`text-xl font-medium ${s.media ? 'bg-black/50 p-2 rounded w-full' : 'text-3xl'}`}>{s.body}</p>}
                            <span className="text-xs text-gray-400 mt-2 block">{new Date(s.timestamp * 1000).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // My Status Details View
    if (managingMyStatus) {
        return (
            <div className="flex-1 bg-white flex flex-col h-full animate-slide-in-right overflow-hidden">
                <div className="p-3 flex items-center gap-4 border-b border-gray-200 shrink-0">
                    <button onClick={() => setManagingMyStatus(false)}><FaArrowLeft className="text-gray-500" /></button>
                    <h2 className="text-xl font-bold text-gray-800">My Status</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-140px)]">
                    {/* Note: max-h is a safety net, but flex-1 should work with overflow-hidden parent */}
                    {statuses.myStatus.length > 0 ? (
                        statuses.myStatus.map(s => (
                            <div key={s.id} className="flex items-center gap-4 py-3 border-b border-gray-100">
                                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                    {s.hasMedia ? (s.media ? <img src={`data:${s.media.mimetype};base64,${s.media.data}`} className="w-full h-full object-cover" /> : 'Media') : 'T'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{s.body || (s.hasMedia ? 'Photo/Video' : 'Status')}</p>
                                    <p className="text-xs text-gray-500">{new Date(s.timestamp * 1000).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-4 text-gray-500">
                                    <div className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded-full">
                                        <FaEye size={12} />
                                        <span>0</span>
                                    </div>
                                    <button onClick={() => handleDeleteStatus(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"><FaTrash /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 mt-10">No status updates</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-gray-800">Status</h2>
                <div className="flex gap-3">
                    <button onClick={() => setCreatingStatus(true)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"><FaPen /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* My Status */}
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => statuses.myStatus.length > 0 ? setManagingMyStatus(true) : setCreatingStatus(true)}>
                    <div className="relative">
                        <FaUserCircle className="size-12 text-gray-300" />
                        {statuses.myStatus.length === 0 && (
                            <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                                <FaPlus size={10} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">My Status</h3>
                        <p className="text-xs text-gray-500">{statuses.myStatus.length > 0 ? 'Tap to view your status updates' : 'Tap to add status update'}</p>
                    </div>
                </div>

                <div className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 uppercase">Recent updates</div>

                {loading ? <div className="p-4 text-center text-gray-400">Loading updates...</div> : (
                    <div className="flex flex-col">
                        {statuses.otherStatuses.filter(s => hasUnseenStatus(s)).map(userStatus => {
                            return (
                                <div key={userStatus.id} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors" onClick={() => setViewingStatus(userStatus.statuses)}>
                                    <div className="p-[2px] rounded-full border-2 border-green-500">
                                        <FaUserCircle className="size-10 text-gray-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{userStatus.name}</h3>
                                        <p className="text-xs text-gray-500">{new Date(userStatus.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {statuses.otherStatuses.filter(s => hasUnseenStatus(s)).length === 0 && <div className="p-4 text-center text-gray-400 text-sm italic">No recent updates</div>}

                        {/* Viewed Updates Section */}
                        {statuses.otherStatuses.filter(s => !hasUnseenStatus(s)).length > 0 && (
                            <>
                                <div className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 uppercase mt-2">Viewed updates</div>
                                {statuses.otherStatuses.filter(s => !hasUnseenStatus(s)).map(userStatus => (
                                    <div key={userStatus.id} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors" onClick={() => setViewingStatus(userStatus.statuses)}>
                                        <div className="p-[2px] rounded-full border-2 border-gray-300">
                                            <FaUserCircle className="size-10 text-gray-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{userStatus.name}</h3>
                                            <p className="text-xs text-gray-500">{new Date(userStatus.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Create Status Modal */}
            {creatingStatus && (
                <div className="absolute inset-0 z-10 bg-[#e9edef] flex flex-col animate-slide-up">
                    <div className="bg-[#008069] p-3 flex items-center text-white gap-4">
                        <button onClick={() => { setCreatingStatus(false); setSelectedFile(null); }}><FaTimes size={20} /></button>
                        <h2 className="font-semibold text-lg">Type a status</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#54c0a5] relative">
                        {selectedFile ? (
                            <div className="relative mb-4 max-h-[50%]">
                                <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="max-h-[300px] rounded shadow-lg" />
                                <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow">
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        ) : null}

                        <textarea
                            value={newStatusText}
                            onChange={e => setNewStatusText(e.target.value)}
                            placeholder={selectedFile ? "Add a caption..." : "Type a status"}
                            className="w-full h-full bg-transparent text-center text-white text-3xl placeholder-white/60 outline-none resize-none font-medium flex items-center justify-center"
                            autoFocus={!selectedFile}
                        />
                    </div>

                    <div className="bg-[#00000033] p-4 flex justify-between items-center">
                        <div className="flex gap-4">
                            <label className="cursor-pointer text-white hover:text-gray-200 transition-colors">
                                <FaImage size={24} />
                                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                            </label>
                            <button onClick={() => setShowCamera(true)} className="text-white hover:text-gray-200 transition-colors">
                                <FaCamera size={24} />
                            </button>
                        </div>

                        <button onClick={handlePostStatus} className="bg-[#00a884] text-white p-4 rounded-full shadow-lg hover:bg-[#008f70] transition-colors disabled:opacity-50" disabled={!newStatusText.trim() && !selectedFile}>
                            <FaPaperPlane size={24} />
                        </button>
                    </div>
                </div>
            )}

            {showCamera && (
                <CameraModal
                    isOpen={showCamera}
                    onClose={() => setShowCamera(false)}
                    onSend={(file) => {
                        setSelectedFile(file);
                        setShowCamera(false);
                    }}
                />
            )}

            {/* View Status Overlay */}
            {viewingStatus && <StatusViewer statusList={viewingStatus} onClose={() => setViewingStatus(null)} />}
        </div>
    );
};

export const CallsView = () => (
    <div className="flex-1 bg-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Calls</h2>
        <p className="text-gray-500">Call history coming soon.</p>
    </div>
);

export const SettingsView = () => (
    <div className="flex-1 bg-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Settings</h2>
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => {
            if (confirm('Logout?')) window.location.reload();
        }}>Logout</button>
    </div>
);
