"use client";

import React from 'react';

const getStarBgColor = (starValue: number) => {
    switch (starValue) {
        case 1: return "#FF3722";
        case 2: return "#FF8622";
        case 3: return "#FFCE00";
        case 4: return "#73CF11";
        case 5: return "#00a264";
        default: return "#dbdbe0";
    }
};

interface StarSelectorProps {
    value: number;
    onChange: (val: number) => void;
}

export const TrustpilotStarSelector: React.FC<StarSelectorProps> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = React.useState(0);
    const currentValue = hoverValue || value;

    const labels: Record<number, string> = {
        1: "Bad",
        2: "Poor",
        3: "Average",
        4: "Great",
        5: "Excellent"
    };

    return (
        <div className="tp-star-selection-wrapper">
            <div className="star-selector-group" onMouseLeave={() => setHoverValue(0)}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <React.Fragment key={s}>
                        <input
                            type="radio"
                            name="star-selector"
                            className="tp-radio-input"
                            aria-label={`${s} star${s > 1 ? 's' : ''}: ${labels[s]}`}
                            tabIndex={value === s || (value === 0 && s === 5) ? 0 : -1}
                            value={s}
                            checked={value === s}
                            onChange={() => onChange(s)}
                            onMouseEnter={() => setHoverValue(s)}
                        />
                        <div
                            className="tp-star-box"
                            style={{
                                backgroundColor: s <= currentValue ? getStarBgColor(currentValue) : '#dbdbe0'
                            }}
                            onClick={() => onChange(s)}
                            onMouseEnter={() => setHoverValue(s)}
                        >
                            <svg viewBox="0 0 24 24" className="tp-star-svg-cutout">
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                    fill="white"
                                    transform="translate(0, 0.5)"
                                />
                            </svg>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            <div className="tp-status-text">
                {currentValue > 0 && (
                    <span className="status-label" style={{ color: getStarBgColor(currentValue) }}>
                        {labels[currentValue]}
                    </span>
                )}
            </div>

            <style jsx>{`
                .tp-star-selection-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .star-selector-group {
                    display: flex;
                    gap: 3px;
                    position: relative;
                }
                .tp-radio-input {
                    position: absolute;
                    opacity: 0;
                    width: 44px;
                    height: 44px;
                    cursor: pointer;
                    z-index: 2;
                    margin: 0;
                }
                /* Offset inputs to cover their respective boxes */
                .tp-radio-input:nth-child(1) { left: 0px; }
                .tp-radio-input:nth-child(3) { left: 47px; }
                .tp-radio-input:nth-child(5) { left: 94px; }
                .tp-radio-input:nth-child(7) { left: 141px; }
                .tp-radio-input:nth-child(9) { left: 188px; }

                .tp-star-box {
                    width: 44px;
                    height: 44px;
                    display: grid;
                    place-items: center;
                    border-radius: 2px;
                    transition: background-color 0.15s ease;
                    cursor: pointer;
                    z-index: 1;
                }
                .tp-star-svg-cutout {
                    width: 68%;
                    height: 68%;
                    display: block;
                }
                .tp-status-text {
                    min-width: 100px;
                }
                .status-label {
                    font-size: 19px;
                    font-weight: 800;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-5px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};
