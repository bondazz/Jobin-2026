"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: any;
    onSuccess?: () => void;
}

export default function CreateChannelModal({ isOpen, onClose, currentUserProfile, onSuccess }: CreateChannelModalProps) {
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelUsername, setNewChannelUsername] = useState('');
    const [submittingChannel, setSubmittingChannel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !newChannelUsername.trim() || !currentUserProfile) return;
        setSubmittingChannel(true);
        setError(null);
        try {
            const { error: insertError } = await supabase
                .from('channels')
                .insert([{
                    owner_id: currentUserProfile.id,
                    name: newChannelName,
                    username: newChannelUsername.toLowerCase().replace(/\s+/g, '_'),
                    followers_count: 0,
                    following_count: 0,
                    posts_count: 0
                }]);

            if (insertError) {
                setError(insertError.message);
            } else {
                setNewChannelName('');
                setNewChannelUsername('');
                if (onSuccess) onSuccess();
                onClose();
                // Refresh to show new channel in sidebar
                window.location.reload();
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setSubmittingChannel(false);
        }
    };

    return (
        <div className="modal-overlay-v3" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content-v3" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header-v3">
                    <h2>Create New Channel</h2>
                    <button className="btn-close-modal" onClick={onClose}>×</button>
                </div>
                <div className="modal-body-v3">
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                        Build a professional presence for your company or brand.
                    </p>

                    {error && (
                        <div style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>Channel Name</label>
                    <input
                        className="post-title-input"
                        placeholder="e.g. Jobin Engineering"
                        value={newChannelName}
                        onChange={e => setNewChannelName(e.target.value)}
                        style={{ marginBottom: '16px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />

                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '6px' }}>Username</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>@</span>
                        <input
                            className="post-title-input"
                            placeholder="jobin_eng"
                            value={newChannelUsername}
                            onChange={e => setNewChannelUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                            style={{ paddingLeft: '28px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                </div>
                <div className="modal-footer-v3">
                    <button className="btn-cancel-post" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-submit-post"
                        onClick={handleCreateChannel}
                        disabled={submittingChannel || !newChannelName || !newChannelUsername}
                    >
                        {submittingChannel ? 'Creating...' : 'Create Channel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
