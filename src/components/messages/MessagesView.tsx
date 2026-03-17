"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LottieIcon } from '@/components/common/LottieIcon';
import { formatRelativeTime } from '@/utils/postHelpers';
import { useSearchParams } from 'next/navigation';
import { VerifiedBadge } from '@/components/common/VerifiedBadge';

import { useUser } from '@/components/providers/UserProvider';

import './messages.css';

type Props = {
    baseType: 'profile' | 'channel';
};

export default function MessagesView({ baseType }: Props) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const startWith = searchParams.get('with');
    const startType = searchParams.get('type');

    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConvo, setActiveConvo] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    const {
        currentUserProfile: globalProfile,
        activeIdentity: globalActiveIdentity,
        identities: globalIdentities,
        switchIdentity: globalSwitchIdentity,
        loading: globalLoading,
        refreshUnreadCount
    } = useUser();

    // Sync local state with global provider
    useEffect(() => {
        if (!globalActiveIdentity) return;

        // Redirect if URL mismatch
        if (globalActiveIdentity.type !== baseType) {
            router.push(globalActiveIdentity.type === 'channel' ? '/channel/messages' : '/profile/messages');
        }
    }, [globalActiveIdentity, baseType, router]);

    // Handle 'Start Chat' from URL params
    useEffect(() => {
        if (!globalActiveIdentity || !startWith || !startType || globalLoading) return;

        const handleStartChat = async () => {
            // 1. Fetch the target
            const table = startType === 'channel' ? 'channels' : 'profiles';
            const { data: target } = await supabase
                .from(table)
                .select('*')
                .eq('username', startWith)
                .maybeSingle();

            if (target) {
                // 2. See if we already have a convo in the list
                const existing = conversations.find(c => c.id === target.id && c.isChannel === (startType === 'channel'));
                if (existing) {
                    setActiveConvo(existing);
                } else {
                    // 3. Virtualize a new convo
                    setActiveConvo({
                        id: target.id,
                        identity: {
                            id: target.id,
                            name: startType === 'channel' ? target.name : (target.full_name || target.username),
                            full_name: target.full_name,
                            avatar_url: target.avatar_url,
                            username: target.username
                        },
                        isChannel: startType === 'channel',
                        lastMessage: { content: 'Start a new conversation...', created_at: new Date().toISOString(), is_read: true }
                    });
                }
            }
        };
        handleStartChat();
    }, [globalActiveIdentity, startWith, startType, globalLoading, conversations.length]);

    const fetchConvos = async () => {
        if (!globalActiveIdentity) return;
        const field = globalActiveIdentity.type === 'channel' ? 'sender_channel_id' : 'sender_id';
        const recField = globalActiveIdentity.type === 'channel' ? 'receiver_channel_id' : 'receiver_id';

        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles:sender_id (*), channels:sender_channel_id (*), rec_profiles:receiver_id (*), rec_channels:receiver_channel_id (*)')
            .or(`${field}.eq.${globalActiveIdentity.id},${recField}.eq.${globalActiveIdentity.id}`)
            .order('created_at', { ascending: false });

        if (data) {
            // Group by the "Other" party
            const groups: Record<string, any> = {};
            data.forEach(m => {
                const amISender = (globalActiveIdentity.type === 'channel' ? m.sender_channel_id : m.sender_id) === globalActiveIdentity.id;
                const otherId = amISender
                    ? (m.receiver_channel_id || m.receiver_id)
                    : (m.sender_channel_id || m.sender_id);

                if (!groups[otherId]) {
                    groups[otherId] = {
                        id: otherId,
                        identity: amISender
                            ? (m.rec_channels || m.rec_profiles)
                            : (m.channels || m.profiles),
                        isChannel: amISender ? !!m.receiver_channel_id : !!m.sender_channel_id,
                        lastMessage: m
                    };
                }
            });
            setConversations(Object.values(groups));
        }
    };

    // Fetch Conversations
    useEffect(() => {
        if (!globalActiveIdentity) return;
        fetchConvos();

        const channel = supabase
            .channel(`messages_identity_${globalActiveIdentity.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new;

                // 1. Update the conversation list immediately
                fetchConvos();

                // 2. If it's for the active chat, add to messages
                const senderId = newMsg.sender_channel_id || newMsg.sender_id;
                const receiverId = newMsg.receiver_channel_id || newMsg.receiver_id;

                if (activeConvo &&
                    ((senderId === activeConvo.id && receiverId === globalActiveIdentity.id) ||
                        (senderId === globalActiveIdentity.id && receiverId === activeConvo.id))) {

                    setMessages(prev => {
                        // Avoid duplicates if we already added it via handleSendMessage response
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // Mark as read if user is looking at this chat
                    markAsRead(newMsg.id);

                    // block: 'nearest' prevents the entire window from jumping
                    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [globalActiveIdentity?.id, activeConvo?.id]); // Only depend on IDs to avoid loop

    const markAsRead = async (msgId?: string) => {
        if (!activeConvo || !globalActiveIdentity) return;

        let query = supabase
            .from('messages')
            .update({ is_read: true })
            .eq('is_read', false);

        if (msgId) {
            query = query.eq('id', msgId);
        } else {
            // Mark all unread from this party
            const otherIdField = activeConvo.isChannel ? 'sender_channel_id' : 'sender_id';
            const myIdField = globalActiveIdentity.type === 'channel' ? 'receiver_channel_id' : 'receiver_id';
            query = query.eq(otherIdField, activeConvo.id).eq(myIdField, globalActiveIdentity.id);
        }

        const { error } = await query;
        if (!error) {
            // Update local state to remove unread dots
            setConversations(prev => prev.map(c => {
                if (c && c.id === activeConvo.id) {
                    return { ...c, lastMessage: { ...c.lastMessage, is_read: true } };
                }
                return c;
            }));

            // Sync global unread count immediately and with delays to ensure consistency
            refreshUnreadCount();
            setTimeout(() => refreshUnreadCount(), 500);
            setTimeout(() => refreshUnreadCount(), 2000);
        }
    };

    // Fetch Messages
    useEffect(() => {
        if (!globalActiveIdentity || !activeConvo) return;

        const fetchMessages = async () => {
            const myField = globalActiveIdentity.type === 'channel' ? 'sender_channel_id' : 'sender_id';
            const myRecField = globalActiveIdentity.type === 'channel' ? 'receiver_channel_id' : 'receiver_id';
            const otherField = activeConvo.isChannel ? 'sender_channel_id' : 'sender_id';
            const otherRecField = activeConvo.isChannel ? 'receiver_channel_id' : 'receiver_id';

            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(${myField}.eq.${globalActiveIdentity.id},${otherRecField}.eq.${activeConvo.id}),and(${otherField}.eq.${activeConvo.id},${myRecField}.eq.${globalActiveIdentity.id})`)
                .order('created_at', { ascending: true });

            setMessages(data || []);
            markAsRead(); // Mark existing unread messages when opening chat
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        };
        fetchMessages();
    }, [activeConvo, globalActiveIdentity]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !globalActiveIdentity || !activeConvo) return;
        setSending(true);

        const payload: any = {
            content: newMessage,
            sender_id: globalActiveIdentity.type === 'channel' ? null : globalActiveIdentity.id,
            sender_channel_id: globalActiveIdentity.type === 'channel' ? globalActiveIdentity.id : null,
            receiver_id: activeConvo.isChannel ? null : activeConvo.id,
            receiver_channel_id: activeConvo.isChannel ? activeConvo.id : null
        };

        const { data, error } = await supabase.from('messages').insert([payload]).select().single();

        if (error) {
            console.error("Message send error:", error);
            alert("Error sending message: " + error.message);
            setSending(false);
        } else if (data) {
            // Update local messages
            setMessages(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });

            // CLEAR INPUT AND ENABLE IMMEDIATELY
            setNewMessage('');
            setSending(false);

            // Refresh conversation list in background
            fetchConvos();

            // Scroll to bottom
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
        }
    };

    if (globalLoading) return null;

    return (
        <>
            {/* MAIN RAIL - CHAT CONTENT */}
            <section className="comm-main-rail msg-chat-main-v5" style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
                {activeConvo ? (
                    <>
                        <header className="msg-chat-header-v5">
                            <button className="msg-mobile-back-v5" onClick={() => setMobileView('list')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <div className="chat-party">
                                <div className="convo-avatar" style={{
                                    backgroundImage: activeConvo.identity.avatar_url ? `url(${activeConvo.identity.avatar_url})` : 'none',
                                    backgroundColor: activeConvo.isChannel ? '#1e293b' : '#00a264',
                                    width: '40px', height: '40px', borderRadius: activeConvo.isChannel ? '12px' : '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px'
                                }}>
                                    {!activeConvo.identity.avatar_url && (activeConvo.isChannel ? activeConvo.identity.name : (activeConvo.identity.full_name || activeConvo.identity.username)).substring(0, 2).toUpperCase()}
                                </div>
                                <div style={{ marginLeft: '12px' }}>
                                    <Link href={activeConvo.isChannel ? `/channel/${activeConvo.identity.username}` : `/profile/${activeConvo.identity.username}`} className="chat-p-name-v5">
                                        {activeConvo.isChannel ? activeConvo.identity.name : (activeConvo.identity.full_name || activeConvo.identity.username)}
                                    </Link>
                                    <span className="chat-p-status-v5">Active Now <span className="online-dot"></span></span>
                                </div>
                            </div>
                        </header>

                        <div className="msg-thread-v5">
                            {messages.map(m => {
                                const isMe = (globalActiveIdentity?.type === 'channel' ? m.sender_channel_id : m.sender_id) === globalActiveIdentity?.id;
                                return (
                                    <div key={m.id} className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                                        {!isMe && (
                                            <div className="msg-them-avatar" style={{
                                                backgroundImage: activeConvo.identity.avatar_url ? `url(${activeConvo.identity.avatar_url})` : 'none',
                                                backgroundColor: activeConvo.isChannel ? '#1e293b' : '#00a264',
                                                borderRadius: activeConvo.isChannel ? '8px' : '50%'
                                            }}>
                                                {!activeConvo.identity.avatar_url && (activeConvo.isChannel ? activeConvo.identity.name : (activeConvo.identity.full_name || activeConvo.identity.username)).substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="msg-bubble-v5">
                                            {m.content}
                                            <div className="bubble-time-v5">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.8 }}><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        <footer className="msg-input-v5">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            </button>
                        </footer>
                    </>
                ) : (
                    <div className="chat-empty-state-v5">
                        <div style={{ background: '#f0fdf4', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#00a264" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h2>Your Messages</h2>
                        <p>Select a conversation or start a new one to connect with talent and companies.</p>
                    </div>
                )}
            </section>

            {/* RIGHT RAIL - CONVERSATIONS & INFO */}
            <aside className="comm-right-rail msg-list-rail-v5" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', width: '320px', minHeight: '500px' }}>

                {activeConvo && (
                    <div className="msg-target-card-v5" style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div className="convo-avatar-v5" style={{
                            width: '80px', height: '80px', margin: '0 auto 16px',
                            backgroundImage: activeConvo.identity.avatar_url ? `url(${activeConvo.identity.avatar_url})` : 'none',
                            backgroundColor: activeConvo.isChannel ? '#1e293b' : '#00a264',
                            borderRadius: activeConvo.isChannel ? '16px' : '50%',
                            fontSize: '24px'
                        }}>
                            {!activeConvo.identity.avatar_url && (activeConvo.isChannel ? activeConvo.identity.name : (activeConvo.identity.full_name || activeConvo.identity.username)).substring(0, 2).toUpperCase()}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                            {activeConvo.isChannel ? activeConvo.identity.name : (activeConvo.identity.full_name || activeConvo.identity.username)}
                        </h3>
                        <p style={{ margin: '4px 0 16px', fontSize: '14px', color: '#64748b' }}>@{activeConvo.identity.username}</p>
                        <Link href={activeConvo.isChannel ? `/channel/${activeConvo.identity.username}` : `/profile/${activeConvo.identity.username}`} style={{
                            display: 'inline-flex', padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: '20px', fontSize: '13px', fontWeight: 700, color: '#1e293b', textDecoration: 'none'
                        }}>
                            View {activeConvo.isChannel ? 'Channel' : 'Profile'}
                        </Link>
                    </div>
                )}

                <div style={{ padding: '20px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent chats</h4>
                </div>

                <div className="convo-list-v5" style={{ flex: 1, overflowY: 'auto' }}>
                    {conversations.length > 0 ? conversations.map(convo => (
                        <div key={convo.id}
                            className={`convo-item-v5 ${activeConvo?.id === convo.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveConvo(convo);
                                setMobileView('chat');
                            }}
                            style={{ padding: '12px 20px' }}
                        >
                            <div className="convo-avatar-v5" style={{
                                backgroundImage: convo.identity.avatar_url ? `url(${convo.identity.avatar_url})` : 'none',
                                backgroundColor: convo.isChannel ? '#1e293b' : '#00a264',
                                borderRadius: convo.isChannel ? '12px' : '50%'
                            }}>
                                {!convo.identity.avatar_url && (convo.isChannel ? convo.identity.name : (convo.identity.full_name || convo.identity.username)).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="convo-meta-v5">
                                <div className="convo-top-v5">
                                    <span className="convo-name-v5" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {convo.isChannel ? convo.identity.name : (convo.identity.full_name || convo.identity.username)}
                                        {/* Green dot for unread messages (if last message isn't read and I am the receiver) */}
                                        {!convo.lastMessage.is_read &&
                                            (convo.isChannel ? convo.lastMessage.receiver_channel_id === globalActiveIdentity?.id : convo.lastMessage.receiver_id === globalActiveIdentity?.id) && (
                                                <span style={{ width: '8px', height: '8px', background: '#00a264', borderRadius: '50%', flexShrink: 0 }}></span>
                                            )}
                                    </span>
                                    <span className="convo-time-v5">{formatRelativeTime(convo.lastMessage.created_at)}</span>
                                </div>
                                <p className="convo-last-msg-v5" style={{ maxWidth: '160px' }}>{convo.lastMessage.content}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-convos-v5">
                            <div style={{ background: '#f8fafc', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            No messages yet.
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
