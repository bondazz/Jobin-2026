"use client";

import { Suspense } from 'react';

import MessagesView from '@/components/messages/MessagesView';

export default function ChannelMessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesView baseType="channel" />
        </Suspense>
    );
}
