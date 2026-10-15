import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiMoreVertical, FiHash, FiGlobe, FiMenu, FiX, FiUser, FiCheck } from "react-icons/fi";
import { BiCheckDouble } from "react-icons/bi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import socket from "../../services/socket";

import toast from "react-hot-toast";

// Helper to format time
const formatTime = (dateStr) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function GeneralChat() {
    const [activeChannel, setActiveChannel] = useState("");
    const [activeChatId, setActiveChatId] = useState("");
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const { user: currentUser } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    const [unreadCounts, setUnreadCounts] = useState({});

    // Toggle Sidebar for mobile
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    // 2. Fetch/Join Chat when Channel changes
    useEffect(() => {
        if (!activeChannel) return;

        const syncChannel = async () => {
            try {
                let chatId = activeChannel;

                // Find the channel object to check type
                const channelObj = channels.find(c => c.id === activeChannel);
                const isProject = channelObj?.type === 'project';
                const isGeneral = activeChannel === 'general';

                if (isGeneral) {
                    const res = await api.get('/chats/general');
                    chatId = res.data.data._id;
                } else if (isProject) {
                    const res = await api.get(`/chats/project/${activeChannel}`);
                    chatId = res.data.data._id;
                } else {
                    // Direct/Support chat where ID is already the chat ID
                    chatId = activeChannel;
                }

                setActiveChatId(chatId);

                // Load existing messages
                const msgRes = await api.get(`/chats/${chatId}/messages`);
                setMessages(msgRes.data.data || []);

                // Join Socket Room
                socket.emit("join_room", chatId);

                // Mark messages as read (Seen status)
                try {
                    await api.put(`/chats/${chatId}/read`);
                } catch (err) {
                    console.error("Failed to mark messages as read", err);
                }

                // Mark notifications as read for this chat (Notification system)
                try {
                    await api.put(`/notifications/related/${chatId}/read`);
                    // Dispatch event to update Topbar notification count
                    window.dispatchEvent(new Event('notificationUpdate'));
                } catch (err) {
                    console.error("Failed to mark chat notifications read", err);
                }

                // Mark as read locally for sidebar badges
                if (unreadCounts[chatId] || unreadCounts[activeChannel]) {
                    setUnreadCounts(prev => {
                        const newCounts = { ...prev };
                        delete newCounts[chatId];
                        delete newCounts[activeChannel];
                        return newCounts;
                    });
                }

            } catch (error) {
                console.error("Error syncing channel:", error);
            }
        };

        syncChannel();
    }, [activeChannel, channels]);

    // 1. Initial Load: User & Channels
    useEffect(() => {
        const initChat = async () => {
            try {
                // currentUser is now from useAuth hook
                socket.connect();

                // 1. Fetch Projects
                const projRes = await api.get('/projects');
                const projects = projRes.data.data || [];

                // 2. Fetch Existing Chats (Direct/Support)
                const chatRes = await api.get('/chats');
                const existingChats = chatRes.data.data || [];

                // 3. Fetch Unread Counts
                const unreadRes = await api.get(`/chats/unread/count?t=${new Date().getTime()}`);
                if (unreadRes.data.success) {
                    setUnreadCounts(unreadRes.data.breakdown || {});
                }

                const accessibleChannels = [];

                // A) General / Support Init
                if (currentUser?.role === 'client') {
                    // For clients, "General" is their Support Channel
                    accessibleChannels.push({ id: "general", name: "Contact Admin", type: "general", category: "support" });
                } else {
                    // For others, General is Team Hub
                    accessibleChannels.push({ id: "general", name: "General Hub", type: "general", category: "general" });
                }

                // B) Projects
                if (currentUser?.role !== 'client') {
                    projects.forEach(p => {
                        accessibleChannels.push({
                            id: p._id,
                            name: p.title,
                            type: 'project',
                            category: 'projects'
                        });
                    });
                }

                // C) Existing Support/Direct Chats
                existingChats.forEach(c => {
                    if (c.type === 'support') {
                        if (currentUser?.role !== 'client') {
                            accessibleChannels.push({
                                id: c._id,
                                name: c.name || "Support Chat",
                                type: 'support',
                                category: 'support'
                            });
                        }
                    } else if (c.type === 'direct') {
                        accessibleChannels.push({
                            id: c._id,
                            name: c.participants?.find(p => (p._id || p) !== (currentUser?._id || currentUser?.id))?.username || "Direct Chat",
                            type: 'direct',
                            category: 'direct'
                        });
                    }
                });

                setChannels(accessibleChannels);

                setChannels(accessibleChannels);

                // FUNCTION TO JOIN ROOMS
                const joinRooms = () => {
                    accessibleChannels.forEach(channel => {
                        if (channel.id !== 'general') {
                            socket.emit("join_room", channel.id);
                        }
                    });

                    // Explicitly join General Chat Room (DB ID)
                    api.get('/chats/general').then(genRes => {
                        if (genRes.data.success) {
                            socket.emit("join_room", genRes.data.data._id);
                        }
                    }).catch(e => console.error("Failed to join general room", e));
                };

                // CONNECT & JOIN
                if (!socket.connected) {
                    socket.connect();
                    socket.on('connect', joinRooms);
                } else {
                    joinRooms();
                }

                // Check for navigation state to open specific chat
                if (location.state?.chatId) {
                    const targetId = location.state.chatId;
                    setActiveChannel(targetId);
                } else if (!activeChannel) {
                    setActiveChannel("general");
                }

            } catch (error) {
                console.error("Chat init error:", error);
            }
        };

        initChat();

        return () => {
            socket.off('connect'); // Cleanup listener, but don't disconnect if shared?
            // socket.disconnect(); // Better to leave it open for Topbar? 
            // Actually, if we disconnect here, Topbar loses connection too if it shares the instance!
            // WE SHOULD NOT DISCONNECT ON UNMOUNT if Topbar needs it.
            // Removing socket.disconnect() to keep Topbar alive.
        };
    }, []); // Removed dependency on location.state

    // 3. Socket Listener for new messages & READ receipts
    useEffect(() => {
        const handleNewMessage = (msg) => {
            // Only add if it belongs to current active chat
            if (msg.chatId === activeChatId) {
                setMessages(prev => [...prev, msg]);
                // Automatically mark as read if chat is open
                api.put(`/chats/${activeChatId}/read`).catch(console.error);
                api.put(`/notifications/related/${activeChatId}/read`)
                    .then(() => window.dispatchEvent(new Event('notificationUpdate')))
                    .catch(console.error);
            } else {
                // Increment unread count for other chats
                setUnreadCounts(prev => ({
                    ...prev,
                    [msg.chatId]: (prev[msg.chatId] || 0) + 1
                }));
            }
        };

        const handleMessagesRead = ({ chatId, userId }) => {
            if (chatId === activeChatId) {
                setMessages(prev => prev.map(msg => {
                    // Avoid duplicate readby entries locally
                    if (!msg.readBy.includes(userId)) {
                        return { ...msg, readBy: [...msg.readBy, userId] };
                    }
                    return msg;
                }));
            }
        };

        socket.on("new_message", handleNewMessage);
        socket.on("messages_read", handleMessagesRead);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("messages_read", handleMessagesRead);
        };
    }, [activeChatId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatId) return;

        const msgContent = newMessage;
        setNewMessage(""); // Clear early for UX

        try {
            await api.post(`/chats/${activeChatId}/messages`, {
                content: msgContent
            });
            // Socket event from backend will trigger the update for us and others
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message.");
        }
    };

    const getRoleBadgeStyle = (role) => {
        return "bg-[#004AAE] !text-white shadow-blue-500/30";
    };

    return (
        <div className="flex h-full bg-[var(--bg-card)] rounded-2xl shadow-xl overflow-hidden transition-all duration-300 relative">

            {/* MOBILE SIDEBAR TOGGLE */}
            <button
                onClick={toggleSidebar}
                className={`md:hidden absolute top-4 left-4 z-30 p-2 rounded-lg shadow-md transition-all ${isSidebarOpen ? 'bg-transparent text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}
            >
                {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* MOBILE OVERLAY BACKDROP */}
            {isSidebarOpen && (
                <div
                    className="md:hidden absolute inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR - Fixed height/positioning for mobile */}
            <div className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 md:opacity-100'} md:translate-x-0 md:w-64 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-300 flex flex-col z-40 absolute inset-y-0 left-0 md:relative md:inset-auto h-full shadow-2xl md:shadow-none`}>
                <div className="p-6 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold text-[#004AAE]">Channels</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* General Section */}
                    {currentUser?.role !== 'client' && (
                        <>
                            <div className="pb-2 px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                Team Collaboration
                            </div>
                            <button
                                onClick={() => { setActiveChannel("general"); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${activeChannel === 'general' ? 'bg-[#004AAE] !text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <FiGlobe className={activeChannel === 'general' ? '!text-white' : 'text-blue-500'} />
                                    <span>General Hub</span>
                                </div>
                            </button>
                        </>
                    )}

                    {/* Support Section (Clients/Admin/relevant staff) */}
                    {channels.filter(c => c.category === 'support').length > 0 && (
                        <div className="pt-6">
                            <div className="pb-2 px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                Client Support
                            </div>
                            {channels.filter(c => c.category === 'support').map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => { setActiveChannel(channel.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                    className={`w-full mt-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-left truncate ${activeChannel === channel.id ? 'bg-purple-600 !text-white shadow-lg shadow-purple-500/20' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <FiUser className={activeChannel === channel.id ? '!text-white' : 'text-purple-500'} />
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {unreadCounts[channel.id] > 0 && (
                                        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                                            {unreadCounts[channel.id]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Projects Section */}
                    {channels.filter(c => c.category === 'projects').length > 0 && (
                        <div className="pt-6">
                            <div className="pb-2 px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                Project Channels
                            </div>
                            {channels.filter(c => c.category === 'projects').map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => { setActiveChannel(channel.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                    className={`w-full mt-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-left truncate ${activeChannel === channel.id ? 'bg-[#004AAE] !text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <FiHash className={activeChannel === channel.id ? '!text-white' : (channel.type === 'discussion' ? 'text-blue-400' : 'text-blue-500')} />
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {/* Unread Badge for Projects */}
                                    {unreadCounts[channel.id] > 0 && (
                                        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                                            {unreadCounts[channel.id]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {channels.length === 0 && currentUser?.role === 'client' && (
                        <div className="px-4 py-2 text-sm text-[var(--text-muted)] italic">
                            No support channels available
                        </div>
                    )}
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col h-full relative w-full">
                {/* HEADER */}
                <div className="px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] border-b border-[var(--border-color)] pl-16 md:pl-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#004AAE] flex items-center gap-2">
                            {activeChannel === 'general' ? <FiGlobe className="text-[#004AAE]" /> : <FiUser className="text-[#004AAE]" />}
                            {activeChannel === 'general' ? 'General Chat' :
                                (activeChannel.startsWith('support_') ? 'Support with Admin' :
                                    (activeChannel.startsWith('discuss_') ? `Discussion: ${activeChannel.replace('discuss_', '')}` :
                                        (channels.find(c => c.id === activeChannel)?.name || activeChannel)
                                    ))}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                            {activeChannel === 'general' ? 'Team Collaboration Hub' : (activeChannel.startsWith('support_') ? 'Private 1-on-1 Support' : 'Project Discussion Room')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg ${getRoleBadgeStyle(currentUser?.role)}`}>
                            {currentUser?.role}
                        </span>
                    </div>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-main)] scrollbar-thin scrollbar-thumb-[var(--bg-secondary)] scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-70">
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-full mb-4 shadow-inner">
                                <FiMoreVertical size={32} className="text-primary" />
                            </div>
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm">Start the conversation in {activeChannel}!</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        let rawName = msg.sender?.firstName ? `${msg.sender.firstName} ${msg.sender.lastName}` : (msg.sender?.username || msg.sender?.name || "User");
                        const senderName = rawName.replace(/[0-9]/g, '').trim();

                        const currentUserId = currentUser?._id || currentUser?.id;
                        const senderId = msg.sender?._id || msg.sender;
                        const isMe = currentUserId && senderId && currentUserId.toString() === senderId.toString();

                        // Check if read by others (excluding sender)
                        const isRead = msg.readBy && msg.readBy.some(id => id !== msg.sender?._id && id !== msg.sender);

                        return (
                            <div
                                key={msg._id || index}
                                className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-3`}
                                >
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-md ${isMe ? "bg-[#004AAE] !text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>
                                        <span className="text-sm font-bold">{senderName.charAt(0).toUpperCase()}</span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="flex items-center gap-2 mb-1.5 px-1">
                                            <span className={`text-xs font-bold ${isMe ? "text-primary" : "text-[var(--text-primary)]"}`}>
                                                {senderName}
                                            </span>
                                            {!isMe && msg.sender?.role && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold opacity-90 ${getRoleBadgeStyle(msg.sender.role)}`}>
                                                    {msg.sender.role}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>

                                        <div
                                            className={`relative px-5 py-3 rounded-2xl shadow-sm leading-relaxed transition-all hover:shadow-md ${isMe
                                                ? "bg-[#004AAE] !text-white rounded-tr-sm"
                                                : "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm"
                                                }`}
                                        >
                                            <div className="pr-4">
                                                {msg.content}
                                            </div>

                                            {/* READ RECEIPT - Only for Me */}
                                            {isMe && (
                                                <div className="absolute bottom-1 right-2 text-[10px]">
                                                    {isRead ? (
                                                        <BiCheckDouble size={16} className="text-blue-300" />
                                                    ) : (
                                                        <FiCheck size={14} className="text-white/60" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                    <div className="flex gap-3 items-center bg-[var(--bg-main)] rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all shadow-sm border border-[var(--border-color)]">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message #${activeChannel}...`}
                            className="flex-1 bg-transparent px-3 py-2 text-[var(--text-primary)] focus:outline-none placeholder-gray-400 resize-none"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-primary hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <FiSend size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
