"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Identity {
    id: string;
    type: 'profile' | 'channel';
    name: string;
    username: string;
    avatar: string | null;
    isChannel: boolean;
    is_verified: boolean;
    [key: string]: any;
}

interface UserContextType {
    currentUserProfile: any;
    activeIdentity: Identity | null;
    identities: Record<string, Identity>;
    loading: boolean;
    setActiveIdentity: (id: Identity) => void;
    switchIdentity: (key: string) => void;
    refreshUserData: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
    unreadCount: number;
    isCreatePostModalOpen: boolean;
    setIsCreatePostModalOpen: (open: boolean) => void;
    isCreateChannelModalOpen: boolean;
    setIsCreateChannelModalOpen: (open: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [activeIdentity, setActiveIdentity] = useState<Identity | null>(null);
    const [identities, setIdentities] = useState<Record<string, Identity>>({});
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUserData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                return;
            }

            const userId = session.user.id;

            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            // Fetch Channels
            const { data: channels } = await supabase
                .from('channels')
                .select('*')
                .eq('owner_id', userId);

            const newIdentities: Record<string, Identity> = {};
            if (profile) {
                newIdentities['candidate'] = {
                    id: profile.id,
                    type: 'profile',
                    name: profile.full_name || 'Guest',
                    username: profile.username || 'user',
                    avatar: profile.avatar_url,
                    isChannel: false,
                    is_verified: profile.is_verified,
                    ...profile
                };
            }

            channels?.forEach(ch => {
                newIdentities[ch.id] = {
                    id: ch.id,
                    type: 'channel',
                    name: ch.name,
                    username: ch.username,
                    avatar: ch.avatar_url,
                    isChannel: true,
                    is_verified: ch.is_verified,
                    ...ch
                };
            });

            setCurrentUserProfile(profile);
            setIdentities(newIdentities);

            // Resolve Active Identity
            const saved = localStorage.getItem('jobin_active_identity');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const key = parsed.type === 'profile' ? 'candidate' : parsed.id;
                    if (newIdentities[key]) {
                        setActiveIdentity(newIdentities[key]);
                    } else {
                        setActiveIdentity(newIdentities['candidate'] || null);
                    }
                } catch (e) {
                    setActiveIdentity(newIdentities['candidate'] || null);
                }
            } else {
                setActiveIdentity(newIdentities['candidate'] || null);
            }
        } catch (error) {
            console.error('Error in fetchUserData:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            fetchUserData();
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const switchIdentity = (key: string) => {
        const id = identities[key];
        if (id) {
            setActiveIdentity(id);
            localStorage.setItem('jobin_active_identity', JSON.stringify({ type: id.type, id: id.id }));
        }
    };

    // Track unread messages for active identity
    const fetchUnreadCount = async () => {
        if (!activeIdentity) {
            setUnreadCount(0);
            return;
        }
        const receiverField = activeIdentity.type === 'channel' ? 'receiver_channel_id' : 'receiver_id';
        const { data } = await supabase
            .from('messages')
            .select('sender_id, sender_channel_id')
            .eq(receiverField, activeIdentity.id)
            .eq('is_read', false);

        if (data) {
            const uniqueSenders = new Set(data.map(m => m.sender_channel_id || m.sender_id));
            setUnreadCount(uniqueSenders.size);
        } else {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (!activeIdentity) {
            return;
        }

        fetchUnreadCount();

        // Subscribe to messages related to this active identity
        const channel = supabase.channel(`global_unread_${activeIdentity.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    const oldMsg = payload.old as any;
                    const involvesMe = (newMsg && (newMsg.receiver_id === activeIdentity.id || newMsg.receiver_channel_id === activeIdentity.id)) ||
                        (oldMsg && (oldMsg.receiver_id === activeIdentity.id || oldMsg.receiver_channel_id === activeIdentity.id));

                    if (involvesMe) {
                        fetchUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeIdentity?.id, activeIdentity?.type]);

    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);

    return (
        <UserContext.Provider value={{
            currentUserProfile,
            activeIdentity,
            identities,
            loading,
            setActiveIdentity,
            switchIdentity,
            refreshUserData: fetchUserData,
            refreshUnreadCount: fetchUnreadCount,
            unreadCount,
            isCreatePostModalOpen,
            setIsCreatePostModalOpen,
            isCreateChannelModalOpen,
            setIsCreateChannelModalOpen
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
