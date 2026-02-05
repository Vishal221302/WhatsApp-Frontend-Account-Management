import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { getChats } from '../services/api';
import { FaUserCircle, FaComment, FaCircleNotch, FaUsers, FaPhone, FaCog, FaPlus } from "react-icons/fa";
import { StatusView, CallsView, SettingsView } from './SidebarViews';
import NewGroupModal from './NewGroupModal';

const ChatList = ({ sessionId, sessionStatus, onSelectChat, selectedChatId }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const { socket } = useSocket();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('chats'); // chats, status, groups, calls, settings
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);

    useEffect(() => {
        if (sessionId && (sessionStatus === 'ready' || sessionStatus === 'authenticated')) {
            fetchChats();
        } else if (!sessionId) {
            setChats([]);
        }
    }, [sessionId, sessionStatus]);

    useEffect(() => {
        if (!socket || !sessionId) return;
        const handleMessage = (data) => {
            if (data.sessionId === sessionId) {
                setChats(prevChats => {
                    const chatIndex = prevChats.findIndex(c => c.id === data.message.chatId);
                    if (chatIndex > -1) {
                        const updatedChat = { ...prevChats[chatIndex] };
                        updatedChat.timestamp = data.message.timestamp;
                        updatedChat.lastMessage = { body: data.message.body, type: data.message.type };
                        if (data.message.chatId !== selectedChatId && !data.message.fromMe) {
                            updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
                        }
                        const newChats = [...prevChats];
                        newChats.splice(chatIndex, 1);
                        newChats.unshift(updatedChat);
                        return newChats;
                    } else {
                        const newChat = {
                            id: data.message.chatId,
                            name: data.message.sender?.pushname || data.message.sender?.number || data.message.chatId,
                            unreadCount: data.message.fromMe ? 0 : 1,
                            timestamp: data.message.timestamp,
                            isGroup: data.message.chatId.includes('@g.us'),
                            profilePicUrl: '',
                            lastMessage: { body: data.message.body, type: data.message.type }
                        };
                        return [newChat, ...prevChats];
                    }
                });
            }
        };
        socket.on('message_received', handleMessage);
        return () => socket.off('message_received', handleMessage);
    }, [socket, sessionId, selectedChatId]);

    const fetchChats = async () => {
        setLoading(true);
        try {
            const { data } = await getChats(sessionId);
            setChats(data);
        } catch (error) {
            console.error("Failed to load chats", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat => {
        const matchesSearch = chat.name ? chat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        if (activeTab === 'groups') return matchesSearch && chat.isGroup;
        return matchesSearch;
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Ensure robust sorting

    const renderContent = () => {
        if (activeTab === 'status') return <StatusView sessionId={sessionId} />;
        if (activeTab === 'calls') return <CallsView />;
        if (activeTab === 'settings') return <SettingsView />;

        // Chats or Groups view
        if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

        return (
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'groups' && (
                    <div className="p-3 border-b flex justify-center">
                        <button onClick={() => setShowNewGroupModal(true)} className="flex items-center gap-2 bg-[#008069] text-white px-4 py-2 rounded-full font-bold shadow hover:bg-[#006a57] transition">
                            <FaPlus /> New Group
                        </button>
                    </div>
                )}
                {filteredChats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No {activeTab} found</div>
                ) : (
                    filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => {
                                onSelectChat(chat);
                                setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                            }}
                            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${selectedChatId === chat.id ? 'bg-gray-100' : ''}`}
                        >
                            <div className="mr-3">
                                {chat.profilePicUrl ? (
                                    <img src={chat.profilePicUrl} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <FaUserCircle className="text-gray-400 size-12" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                                    {chat.timestamp && (
                                        <span className={`text-xs ${chat.unreadCount > 0 ? 'text-[#008069] font-semibold' : 'text-gray-500'}`}>
                                            {new Date(chat.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate w-[90%] ${chat.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                                        {chat.lastMessage?.body || (chat.lastMessage?.type ? <span className="italic">Media ({chat.lastMessage.type})</span> : '')}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <div className="ml-2 bg-[#25D366] text-white rounded-full text-[10px] font-bold h-5 min-w-[1.25rem] px-1 flex items-center justify-center transform scale-100 transition-transform">
                                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <div className="w-96 flex flex-col border-r border-gray-200 bg-white h-full shrink-0 relative">
            {/* Header / Search (Only for Chats/Groups) */}
            {(activeTab === 'chats' || activeTab === 'groups') && (
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-gray-800 capitalize">{activeTab}</h2>
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full p-2 rounded-lg bg-gray-100 border-none focus:ring-0 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Content Area */}
            {renderContent()}

            {/* Bottom Navigation */}
            <div className="bg-gray-100 border-t border-gray-200 p-2 flex justify-around items-center h-16">
                <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-[#008069]' : 'text-gray-500'}`}>
                    <FaComment size={20} />
                    <span className="text-[10px]">Chats</span>
                </button>
                <button onClick={() => setActiveTab('status')} className={`flex flex-col items-center gap-1 ${activeTab === 'status' ? 'text-[#008069]' : 'text-gray-500'}`}>
                    <FaCircleNotch size={20} />
                    <span className="text-[10px]">Status</span>
                </button>
                <button onClick={() => setActiveTab('groups')} className={`flex flex-col items-center gap-1 ${activeTab === 'groups' ? 'text-[#008069]' : 'text-gray-500'}`}>
                    <FaUsers size={20} />
                    <span className="text-[10px]">Community</span>
                </button>
                <button onClick={() => setActiveTab('calls')} className={`flex flex-col items-center gap-1 ${activeTab === 'calls' ? 'text-[#008069]' : 'text-gray-500'}`}>
                    <FaPhone size={20} />
                    <span className="text-[10px]">Calls</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-[#008069]' : 'text-gray-500'}`}>
                    <FaCog size={20} />
                    <span className="text-[10px]">Settings</span>
                </button>
            </div>

            {showNewGroupModal && (
                <NewGroupModal
                    sessionId={sessionId}
                    onClose={() => {
                        setShowNewGroupModal(false);
                        fetchChats(); // Refresh list after creation
                    }}
                />
            )}
        </div>
    );
};

export default ChatList;
