"use client";

import { Suspense } from 'react';

import MessagesView from '@/components/messages/MessagesView';

export default function ProfileMessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesView baseType="profile" />
        </Suspense>
    );
}
