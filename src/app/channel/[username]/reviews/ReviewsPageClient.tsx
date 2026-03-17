"use client";

import React from 'react';
import { useChannel } from '../layout';
import { ChannelReviews } from '@/components/channel/ChannelReviews';

export default function ReviewsPageClient({ initialReviews, initialStats }: { initialReviews: any[], initialStats: any }) {
    const { channel, currentUserProfile, activeIdentity } = useChannel();

    if (!channel) return null;

    return (
        <div style={{ padding: '0 16px' }}>
            <ChannelReviews
                channelId={channel.id}
                currentUserProfile={currentUserProfile}
                activeIdentity={activeIdentity}
                initialReviews={initialReviews}
                initialStats={initialStats}
                username={channel.username}
            />
        </div>
    );
}
