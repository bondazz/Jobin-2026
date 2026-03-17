"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {

    useEffect(() => {
        let redirected = false;

        const processSession = async (session: any) => {
            if (redirected) return;
            redirected = true;

            try {
                const user = session.user;
                const meta = user.user_metadata;

                // 1. Check for existing profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .maybeSingle();

                let activeUsername = profile?.username;

                if (!activeUsername) {
                    // 2. Generate unique username
                    const emailPrefix = (user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const randomId = Math.floor(1000 + Math.random() * 9000);
                    const rawBase = meta?.user_name || meta?.username || meta?.full_name || emailPrefix;
                    const cleanBase = rawBase
                        .toString()
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '');

                    activeUsername = `${cleanBase}_${randomId}`;

                    // 3. Create profile in database
                    const { data: newProfile, error: upsertError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            username: activeUsername,
                            full_name: meta?.full_name || emailPrefix,
                            avatar_url: null,
                            followers_count: 0,
                            following_count: 0,
                            posts_count: 0,
                            karma: 0,
                            bio: null,
                            work_info: null,
                            cover_url: null
                        }, { onConflict: 'id' })
                        .select('username')
                        .maybeSingle();

                    if (upsertError) {
                        console.error('Profile creation error:', upsertError.message);
                        // Last resort: try to fetch if maybe it exists
                        const { data: lastTry } = await supabase
                            .from('profiles')
                            .select('username')
                            .eq('id', user.id)
                            .maybeSingle();
                        if (lastTry?.username) activeUsername = lastTry.username;
                    } else if (newProfile?.username) {
                        activeUsername = newProfile.username;
                    }

                    // 4. Sync username to auth metadata
                    if (activeUsername) {
                        await supabase.auth.updateUser({
                            data: {
                                username: activeUsername,
                                full_name: meta?.full_name || activeUsername
                            }
                        }).catch(() => { }); // Non-blocking
                    }
                }

                // 5. Navigate to profile (hard redirect for full state refresh)
                if (activeUsername) {
                    window.location.href = `/profile/${activeUsername}`;
                } else {
                    window.location.href = '/dashboard/candidate';
                }

            } catch (err) {
                console.error('Auth callback error:', err);
                window.location.href = '/dashboard/candidate';
            }
        };

        // CORRECT approach: listen for auth state change
        // This fires reliably when OAuth session is established from URL hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                subscription.unsubscribe();
                await processSession(session);
            } else if (event === 'INITIAL_SESSION' && !session) {
                // No session present at all - redirect to login
                subscription.unsubscribe();
                if (!redirected) {
                    redirected = true;
                    window.location.href = '/login';
                }
            }
        });

        // Safety net: if nothing happens in 10 seconds, go to login
        const timeout = setTimeout(() => {
            subscription.unsubscribe();
            if (!redirected) {
                redirected = true;
                window.location.href = '/login';
            }
        }, 10000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            background: 'linear-gradient(135deg, #f0faf6 0%, #f8fafc 100%)'
        }}>
            <div style={{
                width: '52px',
                height: '52px',
                border: '4px solid rgba(0, 162, 100, 0.15)',
                borderTop: '4px solid #00a264',
                borderRadius: '50%',
                animation: 'cb-spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#475569', fontWeight: 600, fontSize: '16px', margin: 0 }}>
                Setting up your profile...
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                This will only take a moment
            </p>
            <style>{`
                @keyframes cb-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
