"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CandidateDashboard() {
    useEffect(() => {
        const fetchAndRedirect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', session.user.id)
                    .single();

                const username = profile?.username?.replace(/\s+/g, '_') || session.user.email?.split('@')[0];
                window.location.href = `/profile/${username}`;
            } else {
                window.location.href = '/login';
            }
        };
        fetchAndRedirect();
    }, []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div className="loading-spinner"></div>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Syncing your personal hub...</p>
        </div>
    );
}
