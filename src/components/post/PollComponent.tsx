"use client";

import React, { useState } from 'react';

export const PollComponent = ({ poll }: { poll: any }) => {
    const [voted, setVoted] = useState<number | null>(null);
    const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);

    return (
        <div className="poll-container">
            <h4 className="poll-question">{poll.question}</h4>
            <div className="poll-options">
                {poll.options.map((opt: any, idx: number) => {
                    const percentage = Math.round((opt.votes / totalVotes) * 100);
                    return (
                        <button
                            key={idx}
                            className={`poll-opt ${voted === idx ? 'selected' : ''}`}
                            onClick={() => setVoted(idx)}
                        >
                            <span className="opt-label">{opt.label}</span>
                            {voted !== null && (
                                <div className="opt-result">
                                    <div className="opt-bar" style={{ width: `${percentage}%` }}></div>
                                    <span className="opt-percent">{percentage}%</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="poll-footer">{totalVotes} votes • 2 days left</p>
        </div>
    );
};
