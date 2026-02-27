import React, { useState, useRef, useEffect } from 'react';
import { Search, Send, Image as ImageIcon, Smile, MoreVertical, Phone, Video, Info } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import CreatePostModal from '../../components/modals/CreatePostModal';
import './css/Messages.css';

const MOCK_CHATS = [
    {
        id: 'c1',
        name: 'The Weeknd',
        avatar: 'https://images.unsplash.com/photo-1514525253361-bee8a487409e?q=80&w=200',
        lastMsg: 'See you at the concert!',
        time: '12:45 PM',
        online: true,
        messages: [
            { id: 'm1', text: 'Hey, I heard you are dropping a new album?', sent: false, time: '10:00 AM' },
            { id: 'm2', text: 'Yeah, almost done with it!', sent: true, time: '10:05 AM' },
            { id: 'm3', text: 'Can\'t wait for the world tour!', sent: false, time: '12:40 PM' },
            { id: 'm4', text: 'See you at the concert!', sent: false, time: '12:45 PM' },
        ]
    },
    {
        id: 'c2',
        name: 'Taylor Swift',
        avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200',
        lastMsg: 'The recording session was great.',
        time: 'Yesterday',
        online: false,
        messages: [
            { id: 'm1', text: 'How was the recording today?', sent: true, time: '4:00 PM' },
            { id: 'm2', text: 'The recording session was great.', sent: false, time: '4:30 PM' },
        ]
    },
    {
        id: 'c3',
        name: 'Billie Eilish',
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200',
        lastMsg: 'Check out this new demo.',
        time: 'Tue',
        online: true,
        messages: [
            { id: 'm1', text: 'Check out this new demo.', sent: false, time: '11:15 AM' },
        ]
    }
];

const Messages = () => {
    const [chats, setChats] = useState(MOCK_CHATS);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef(null);

    const selectedChat = chats.find(c => c.id === selectedChatId);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedChatId, chats]);

    const handleSendMessage = () => {
        if (!inputText.trim() || !selectedChatId) return;

        const newMessage = {
            id: Date.now().toString(),
            text: inputText,
            sent: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChats(prev => prev.map(chat =>
            chat.id === selectedChatId
                ? { ...chat, messages: [...chat.messages, newMessage], lastMsg: inputText, time: 'Just now' }
                : chat
        ));
        setInputText('');
    };

    return (
        <div className="messages-container">
            <Sidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            <main className="messages-main">
                <div className="messages-wrapper animate-slide-up">
                    {/* Left Panel: Chat List */}
                    <aside className="messages-list-panel">
                        <header className="messages-list-header">
                            <h2 className="messages-list-title">Messages</h2>
                            <div className="messages-search-container">
                                <Search className="w-4 h-4 opacity-50" />
                                <input
                                    className="messages-search-input"
                                    placeholder="Search messages..."
                                />
                            </div>
                        </header>
                        <div className="messages-list-scroll">
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedChatId(chat.id)}
                                >
                                    <div className="chat-avatar-wrapper">
                                        <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
                                        {chat.online && <div className="online-status" />}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name">{chat.name}</div>
                                        <div className="chat-last-msg">{chat.lastMsg}</div>
                                    </div>
                                    <div className="text-[10px] opacity-40 whitespace-nowrap">{chat.time}</div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Right Panel: Chat View */}
                    <section className="messages-chat-panel">
                        {selectedChat ? (
                            <>
                                <header className="chat-header">
                                    <div className="chat-header-user">
                                        <div className="chat-avatar-wrapper">
                                            <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-xl object-cover" />
                                            {selectedChat.online && <div className="online-status !w-3 !h-3 !border-2" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{selectedChat.name}</div>
                                            <div className="text-[11px] opacity-50">{selectedChat.online ? 'Online' : 'Offline'}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 opacity-60">
                                        <Phone className="w-5 h-5 cursor-pointer hover:text-indigo-400" />
                                        <Video className="w-5 h-5 cursor-pointer hover:text-indigo-400" />
                                        <Info className="w-5 h-5 cursor-pointer hover:text-indigo-400" />
                                    </div>
                                </header>

                                <div className="chat-messages-scroll" ref={scrollRef}>
                                    {selectedChat.messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`message-bubble ${msg.sent ? 'message-sent' : 'message-received'}`}
                                        >
                                            {msg.text}
                                            <span className="message-time">{msg.time}</span>
                                        </div>
                                    ))}
                                </div>

                                <footer className="chat-input-area">
                                    <div className="chat-input-container">
                                        <Smile className="chat-action-btn" />
                                        <ImageIcon className="chat-action-btn" />
                                        <input
                                            className="chat-input"
                                            placeholder="Message..."
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <div className="chat-send-btn" onClick={handleSendMessage}>
                                            <Send className="w-5 h-5" />
                                        </div>
                                    </div>
                                </footer>
                            </>
                        ) : (
                            <div className="empty-chat-view">
                                <div className="empty-chat-icon" />
                                <h3 className="text-xl font-bold mb-2">Your Messages</h3>
                                <p className="opacity-60 max-w-[280px]">Send private photos and messages to a friend or group.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Messages;
