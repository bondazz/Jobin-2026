"use client";

import React, { useEffect, useRef } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

export const LottieIcon = ({ src, size = 38 }: { src: string, size?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let dotLottie: any = null;
        if (canvasRef.current) {
            dotLottie = new DotLottie({
                canvas: canvasRef.current,
                src: src,
                autoplay: true,
                loop: true,
            });
        }
        return () => {
            if (dotLottie) dotLottie.destroy();
        };
    }, [src]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: `${size}px`, height: `${size}px`, cursor: 'pointer' }}
        />
    );
};
