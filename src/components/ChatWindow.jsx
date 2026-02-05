/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from 'react';
import { getMessages } from '../services/api';
import { FaUserCircle, FaPaperPlane, FaPaperclip, FaSmile, FaChevronDown, FaCamera, FaHeadphones, FaImage, FaFileAlt, FaVideo, FaPhone, FaSearch } from "react-icons/fa";
import { useSocket } from '../context/SocketContext';
import CameraModal from './CameraModal';
import EmojiPicker from 'emoji-picker-react';
import ImagePreviewModal from './ImagePreviewModal';

import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
import ChatInfoModal from './ChatInfoModal';

const MessageStatus = ({ status, fromMe }) => {
    if (!fromMe) return null;

    // Ack statuses:
    // 0 = Pending/Clock (local)
    // 1 = Sent (1 grey tick)
    // 2 = Received (2 grey ticks)
    // 3 = Read (2 blue ticks)
    // 4 = Played (2 blue ticks)

    if (status === 3 || status === 4) { // Read or Played
        return <IoCheckmarkDone className="text-blue-500 text-[16px] inline ml-1" />;
    } else if (status === 2) { // Received
        return <IoCheckmarkDone className="text-gray-500 text-[16px] inline ml-1" />;
    } else if (status === 1) { // Sent
        return <IoCheckmark className="text-gray-500 text-[16px] inline ml-1" />;
    } else { // Pending or other
        return <span className="text-gray-400 text-[10px] inline ml-1">🕒</span>;
    }
};

const formatMessage = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>{part}</a>;
        }
        return part;
    });
};

const ChatWindow = ({ sessionId, chat, onCall }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const { socket } = useSocket();
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (chat && sessionId) {
            fetchMessages();
        }
    }, [chat, sessionId]);
    useEffect(() => {
        if (socket) {
            const handleMessage = (data) => {
                if (data.sessionId === sessionId && data.message.chatId === chat?.id) {
                    setMessages(prev => {
                        // Dedup based on ID
                        if (prev.some(m => m.id === data.message.id)) return prev;

                        return [...prev, {
                            id: data.message.id,
                            fromMe: data.message.fromMe,
                            body: data.message.body,
                            timestamp: data.message.timestamp,
                            ack: data.message.ack || 0,
                            hasMedia: data.message.hasMedia,
                            media: data.message.media,
                            type: data.message.type,
                            quotedMessage: data.message.quotedMessage,
                            sender: data.message.sender
                        }];
                    });
                }
            };

            const handleAck = (data) => {
                if (data.sessionId === sessionId) {
                    // Update specific message
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === data.msgId) {
                            return { ...msg, ack: data.ack };
                        }
                        return msg;
                    }));
                }
            };

            socket.on('message_received', handleMessage);
            socket.on('message_ack', handleAck);

            return () => {
                socket.off('message_received', handleMessage);
                socket.off('message_ack', handleAck);
            };
        }
    }, [socket, sessionId, chat]);

    const isFirstLoad = useRef(true);

    useEffect(() => {
        // Reset first load flag when chat changes
        isFirstLoad.current = true;
    }, [chat?.id]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const scrollToBottom = () => {
        if (isFirstLoad.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            isFirstLoad.current = false;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data } = await getMessages(sessionId, chat.id);
            // Ensure chronological order (Oldest -> Newest)
            // whatsapp-web.js usually returns chronological, so just to be safe we sort by timestamp
            const sortedMessages = data.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sortedMessages);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoading(false);
        }
    };

    const [replyingTo, setReplyingTo] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const typingTimeoutRef = useRef(null);

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            // Start typing
            import('../services/api').then(({ setTypingState }) => {
                setTypingState(sessionId, chat.id, true).catch(console.error);
            });
        }

        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            import('../services/api').then(({ setTypingState }) => {
                setTypingState(sessionId, chat.id, false).catch(console.error);
            });
            typingTimeoutRef.current = null;
        }, 3000);
    };

    const handleFileSelect = async (e, type, fileObj = null) => {
        const file = fileObj || (e.target.files ? e.target.files[0] : null);
        if (!file) return;

        setActiveMenuId(null); // Close menu

        // Optimistic UI or Loading state could go here

        try {
            const { sendMessage } = await import('../services/api');
            // Send file directly
            await sendMessage(sessionId, chat.id, type === 'media' ? '' : file.name, {}, file);

            // Play Sent Sound
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
                audio.play().catch(e => { });
            } catch (e) { }

        } catch (error) {
            console.error("Failed to send file", error);
            alert("Failed to send file: " + error.message);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        const options = replyingTo ? { quotedMessageId: replyingTo.id } : {};

        setNewMessage(""); // Clear input immediately
        setReplyingTo(null); // Clear reply state

        // Stop typing immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        import('../services/api').then(({ setTypingState }) => {
            setTypingState(sessionId, chat.id, false).catch(console.error);
        });

        try {
            const { sendMessage } = await import('../services/api');
            await sendMessage(sessionId, chat.id, content, options);

            // Play Sent Sound
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'); // Pop sound
                audio.play().catch(e => console.error("Audio play failed", e));
            } catch (e) { console.error("Audio error", e); }
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message: " + error.message);
            setNewMessage(content); // Restore message on failure
        }
    };

    if (!chat) return <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-500">Select a chat to start messaging</div>;

    const filteredMessages = searchQuery
        ? messages.filter(msg => msg.body && msg.body.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] min-w-0">
            {/* Header */}
            <div className="bg-gray-100 p-3 border-b border-gray-200 flex items-center justify-between shadow-sm">
                {isSearching ? (
                    <div className="flex-1 flex items-center gap-3 animate-in fade-in duration-200">
                        <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="text-gray-500 hover:text-gray-700">
                            <FaChevronDown className="rotate-90" />
                        </button>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search messages..."
                            className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors rounded p-1" onClick={() => setShowInfoModal(true)}>
                        {chat.profilePicUrl ? (
                            <img src={chat.profilePicUrl} alt={chat.name} className="size-10 rounded-full object-cover" />
                        ) : (
                            <FaUserCircle className="text-gray-400 size-10" />
                        )}
                        <div>
                            <h3 className="font-semibold text-gray-800">{chat.name}</h3>
                            <p className="text-xs text-gray-500">Online</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 mr-4 ml-4">
                    {!isSearching && (
                        <>
                            <button
                                onClick={() => onCall(chat.id, true)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-200 rounded-full transition-colors"
                                title="Video Call"
                            >
                                <FaVideo size={20} />
                            </button>
                            <button
                                onClick={() => onCall(chat.id, false)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-200 rounded-full transition-colors"
                                title="Voice Call"
                            >
                                <FaPhone size={20} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setIsSearching(!isSearching)}
                        className={`p-2 rounded-full transition-colors ${isSearching ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
                    >
                        <FaSearch size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-opacity-50" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Loading messages...</div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} group`}>
                            <div className={`max-w-[70%] rounded-lg p-2 shadow-sm relative ${msg.fromMe ? 'bg-[#d9fdd3]' : 'bg-white'}`}>
                                {chat.isGroup && !msg.fromMe && msg.sender && (
                                    <div className="text-[12px font-bold text-orange-600 mb-1">
                                        {msg.sender.pushname || `+${msg.sender.number}`}
                                    </div>
                                )}
                                {msg.quotedMessage && (
                                    <div className="bg-black/5 p-2 rounded-md mb-2 border-l-4 border-gray-400 text-xs">
                                        <div className="font-bold text-gray-600 mb-1">
                                            {msg.quotedMessage.fromMe ? 'You' : (msg.quotedMessage.participant?.name || msg.quotedMessage.participant?.pushname || msg.quotedMessage.participant?.number || 'Contact')}
                                        </div>
                                        <div className="text-gray-500 truncate">
                                            {msg.quotedMessage.body || (msg.quotedMessage.hasMedia ? '📷 Media' : '')}
                                        </div>
                                    </div>
                                )}
                                <div className={`absolute top-0 ${msg.fromMe ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 ${activeMenuId === msg.id ? 'opacity-100' : ''} transition-opacity`}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <FaChevronDown />
                                    </button>

                                    {activeMenuId === msg.id && (
                                        <div
                                            className="absolute top-6 z-50 w-32 bg-white rounded-md shadow-xl border border-gray-100 py-1 flex flex-col items-start overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => { setReplyingTo(msg); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            >
                                                Reply
                                            </button>
                                            {msg.fromMe && (
                                                <button
                                                    onClick={async () => {
                                                        setActiveMenuId(null);
                                                        if (!confirm("Delete this message for everyone?")) return;
                                                        try {
                                                            const { deleteMessage } = await import('../services/api');
                                                            await deleteMessage(sessionId, chat.id, msg.id);
                                                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                                                        } catch (e) {
                                                            console.error("Delete failed", e);
                                                            alert("Failed to delete");
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {msg.hasMedia && msg.media ? (
                                    <div className="mb-1">
                                        {msg.media.mimetype.startsWith('image/') ? (
                                            <img
                                                src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                                alt="Media"
                                                className="rounded-lg max-w-full h-auto cursor-pointer"
                                                onClick={() => setPreviewImage(`data:${msg.media.mimetype};base64,${msg.media.data}`)}
                                            />
                                        ) : msg.media.mimetype.startsWith('video/') ? (
                                            <video controls className="rounded-lg max-w-full h-auto">
                                                <source src={`data:${msg.media.mimetype};base64,${msg.media.data}`} type={msg.media.mimetype} />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <a
                                                href={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                                                download={msg.media.filename || 'download'}
                                                className="flex items-center gap-2 bg-gray-100 p-2 rounded text-blue-600 hover:text-blue-800"
                                            >
                                                <FaPaperclip />
                                                {msg.media.filename || 'Download Document'}
                                            </a>
                                        )}
                                    </div>
                                ) : null}
                                {msg.hasMedia && !msg.media ? (
                                    <div className="mb-1 italic text-gray-500 text-xs">Media not available</div>
                                ) : null}
                                {msg.body && <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">{formatMessage(msg.body)}</p>}
                                <div className="flex items-center justify-end mt-1 gap-1">
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <MessageStatus status={msg.ack} fromMe={msg.fromMe} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
                <div className="bg-gray-200 px-4 py-2 border-l-4 border-green-500 flex justify-between items-center text-sm">
                    <div className="flex-1 truncate">
                        <span className="text-green-600 font-bold block">{replyingTo.fromMe ? 'You' : (replyingTo.sender?.name || replyingTo.sender?.pushname || replyingTo.sender?.number || chat.name || 'Contact')}</span>
                        <span className="text-gray-600 truncate block">{replyingTo.body || (replyingTo.hasMedia ? 'Media' : '')}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-gray-700 font-bold text-lg px-2">
                        &times;
                    </button>
                </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
                <CameraModal
                    onClose={() => setShowCamera(false)}
                    onSend={(file) => handleFileSelect(null, 'media', file)}
                />
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    imageUrl={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            {/* Input */}
            <div className="bg-gray-100 p-3 flex items-center gap-2 relative">
                <button
                    className="text-gray-500 hover:text-gray-700 p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === 'emoji' ? null : 'emoji');
                    }}
                >
                    <FaSmile size={24} />
                    {activeMenuId === 'emoji' && (
                        <div
                            className="absolute bottom-16 left-0 z-50 shadow-xl border border-gray-200 rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EmojiPicker
                                onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                                width={350}
                                height={400}
                            />
                        </div>
                    )}
                </button>

                {/* Attachment Menu */}
                <button
                    className="text-gray-500 hover:text-gray-700 p-2 relative"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === 'attachment' ? null : 'attachment');
                    }}
                >
                    <FaPaperclip size={20} />
                    {activeMenuId === 'attachment' && (
                        <div
                            className="absolute bottom-12 left-0 bg-white shadow-xl rounded-lg p-2 flex flex-col gap-2 min-w-[180px] z-20 border border-gray-100 animate-in fade-in zoom-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors text-gray-700">
                                <span className="bg-indigo-100 p-2 rounded-full text-indigo-600"><FaFileAlt /></span>
                                <span className="text-sm font-medium">Document</span>
                                <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'document')} />
                            </label>
                            <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors text-gray-700">
                                <span className="bg-purple-100 p-2 rounded-full text-purple-600"><FaImage /></span>
                                <span className="text-sm font-medium">Photos & Videos</span>
                                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'media')} />
                            </label>
                            <button onClick={() => { setActiveMenuId(null); setShowCamera(true); }} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors text-gray-700 w-full text-left">
                                <span className="bg-pink-100 p-2 rounded-full text-pink-600"><FaCamera /></span>
                                <span className="text-sm font-medium">Camera</span>
                            </button>
                            <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors text-gray-700">
                                <span className="bg-orange-100 p-2 rounded-full text-orange-600"><FaHeadphones /></span>
                                <span className="text-sm font-medium">Audio</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e, 'media')} />
                            </label>
                        </div>
                    )}
                </button>

                <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type a message"
                        className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
                    />
                    <button type="submit" className="text-gray-500 hover:text-green-600 p-2">
                        <FaPaperPlane size={20} />
                    </button>
                </form>
            </div>

            {showInfoModal && (
                <ChatInfoModal
                    sessionId={sessionId}
                    chat={chat}
                    onClose={() => setShowInfoModal(false)}
                />
            )}
        </div>
    );
};

export default ChatWindow;
