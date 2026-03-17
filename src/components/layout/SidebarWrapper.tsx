"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/UserProvider';
import LeftSidebar from '@/components/layout/LeftSidebar';
import CreateChannelModal from '@/components/layout/CreateChannelModal';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const {
        currentUserProfile,
        activeIdentity,
        identities,
        switchIdentity,
        setIsCreatePostModalOpen,
        isCreateChannelModalOpen,
        setIsCreateChannelModalOpen,
        unreadCount
    } = useUser();

    // Pages that show the left sidebar
    const showSidebar =
        pathname === '/community' ||
        pathname.startsWith('/channel/') ||
        pathname.startsWith('/profile/') ||
        pathname.startsWith('/messages');

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="community-wrapper">
            <main className="comm-container">
                <LeftSidebar
                    currentUserProfile={currentUserProfile}
                    activeIdentity={activeIdentity}
                    identities={identities}
                    onIdentityChange={(key) => {
                        const id = identities[key];
                        if (!id) return;
                        switchIdentity(key);
                        if (id.isChannel) router.push(`/channel/${id.username}`);
                        else router.push(`/profile/${id.username}`);
                    }}
                    onCreatePost={() => setIsCreatePostModalOpen(true)}
                    onCreateChannel={() => setIsCreateChannelModalOpen(true)}
                    unreadCount={unreadCount}
                />
                {children}
            </main>

            <CreateChannelModal
                isOpen={isCreateChannelModalOpen}
                onClose={() => setIsCreateChannelModalOpen(false)}
                currentUserProfile={currentUserProfile}
            />
        </div>
    );
}
