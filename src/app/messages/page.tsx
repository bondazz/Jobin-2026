"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalMessagesPage() {
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem('jobin_active_identity');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.type === 'channel') {
                    router.push('/channel/messages');
                    return;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
        // Default to profile messages
        router.push('/profile/messages');
    }, [router]);

    return null;
}
