import React from 'react'

/**
 * GradientWave Component for Kushi Hygieia Hero Section
 * Renders high-performance, GPU-accelerated multi-layered moving waves.
 * Distinct layers flow horizontally in opposing directions with organic vertical undulation,
 * creating a living, breathing aquatic/fluid aesthetic that reinforces Kushi Hygieia's
 * health & vitality brand identity while maintaining full text legibility.
 * Seamlessly loops and respects prefers-reduced-motion.
 */
export default function GradientWave({ className = '' }) {
    return (
        <div
            className={`gradient-wave-container ${className}`}
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0,
                background: 'transparent'
            }}
            aria-hidden="true"
        >
            {/* Luminous Ambient Medical Glows */}
            <div
                className="ambient-glow glow-1"
                style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90vw',
                    maxWidth: '1200px',
                    height: '60vh',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(219, 234, 254, 0.7) 0%, rgba(224, 242, 254, 0.45) 45%, rgba(240, 253, 250, 0) 75%)',
                    filter: 'blur(55px)',
                    opacity: 0.95
                }}
            />

            <div
                className="ambient-glow glow-2"
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '75vw',
                    maxWidth: '960px',
                    height: '45vh',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.6) 65%, rgba(255, 255, 255, 0) 100%)',
                    filter: 'blur(40px)',
                    zIndex: 1
                }}
            />

            {/* WAVE LAYER 1: Deep Sapphire / Teal Base Wave (Slow leftward roll) */}
            <div className="wave-wrapper wave-wrapper-1">
                <div className="wave-undulator wave-undulator-1">
                    <svg
                        className="wave-svg wave-track-left-1"
                        viewBox="0 0 2880 500"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1565C0" stopOpacity="0.14" />
                                <stop offset="35%" stopColor="#0D9488" stopOpacity="0.12" />
                                <stop offset="70%" stopColor="#0284C7" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#1565C0" stopOpacity="0.14" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 0,160 C 240,100 480,220 720,160 C 960,100 1200,220 1440,160 C 1680,100 1920,220 2160,160 C 2400,100 2640,220 2880,160 L 2880,500 L 0,500 Z"
                            fill="url(#waveGradient1)"
                        />
                        <path
                            d="M 0,160 C 240,100 480,220 720,160 C 960,100 1200,220 1440,160 C 1680,100 1920,220 2160,160 C 2400,100 2640,220 2880,160"
                            stroke="rgba(21, 101, 192, 0.25)"
                            strokeWidth="2"
                            fill="none"
                        />
                    </svg>
                </div>
            </div>

            {/* WAVE LAYER 2: Cyan & Emerald Mid Wave (Counter-flowing rightward roll) */}
            <div className="wave-wrapper wave-wrapper-2">
                <div className="wave-undulator wave-undulator-2">
                    <svg
                        className="wave-svg wave-track-right-2"
                        viewBox="0 0 2880 500"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="waveGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.16" />
                                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.16" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 0,160 C 120,230 240,90 360,160 C 480,230 600,90 720,160 C 840,230 960,90 1080,160 C 1200,230 1320,90 1440,160 C 1560,230 1680,90 1800,160 C 1920,230 2040,90 2160,160 C 2280,230 2400,90 2520,160 C 2640,230 2760,90 2880,160 L 2880,500 L 0,500 Z"
                            fill="url(#waveGradient2)"
                        />
                        <path
                            d="M 0,160 C 120,230 240,90 360,160 C 480,230 600,90 720,160 C 840,230 960,90 1080,160 C 1200,230 1320,90 1440,160 C 1560,230 1680,90 1800,160 C 1920,230 2040,90 2160,160 C 2280,230 2400,90 2520,160 C 2640,230 2760,90 2880,160"
                            stroke="rgba(20, 184, 166, 0.3)"
                            strokeWidth="1.75"
                            fill="none"
                        />
                    </svg>
                </div>
            </div>

            {/* WAVE LAYER 3: Radiant Sky Blue Surface Crest (Dynamic leftward roll) */}
            <div className="wave-wrapper wave-wrapper-3">
                <div className="wave-undulator wave-undulator-3">
                    <svg
                        className="wave-svg wave-track-left-3"
                        viewBox="0 0 2880 500"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="waveGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.12" />
                                <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.12" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 0,170 C 160,120 320,220 480,170 C 640,120 800,220 960,170 C 1120,120 1280,220 1440,170 C 1600,120 1760,220 1920,170 C 2080,120 2240,220 2400,170 C 2560,120 2720,220 2880,170 L 2880,500 L 0,500 Z"
                            fill="url(#waveGradient3)"
                        />
                        <path
                            d="M 0,170 C 160,120 320,220 480,170 C 640,120 800,220 960,170 C 1120,120 1280,220 1440,170 C 1600,120 1760,220 1920,170 C 2080,120 2240,220 2400,170 C 2560,120 2720,220 2880,170"
                            stroke="rgba(2, 132, 199, 0.35)"
                            strokeWidth="2.2"
                            fill="none"
                        />
                    </svg>
                </div>
            </div>

            {/* WAVE LAYER 4: Soft Translucent Base Foam / Wash (Gentle rightward roll) */}
            <div className="wave-wrapper wave-wrapper-4">
                <div className="wave-undulator wave-undulator-4">
                    <svg
                        className="wave-svg wave-track-right-4"
                        viewBox="0 0 2880 500"
                        preserveAspectRatio="none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="waveGradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                                <stop offset="40%" stopColor="#F0FDF4" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 0,170 C 240,130 480,210 720,170 C 960,130 1200,210 1440,170 C 1680,130 1920,210 2160,170 C 2400,130 2640,210 2880,170 L 2880,500 L 0,500 Z"
                            fill="url(#waveGradient4)"
                        />
                        <path
                            d="M 0,170 C 240,130 480,210 720,170 C 960,130 1200,210 1440,170 C 1680,130 1920,210 2160,170 C 2400,130 2640,210 2880,170"
                            stroke="rgba(255, 255, 255, 0.9)"
                            strokeWidth="1.5"
                            fill="none"
                        />
                    </svg>
                </div>
            </div>

            {/* High-performance CSS keyframe animations */}
            <style>{`
                /* Container positioning for each wave */
                .wave-wrapper {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    pointer-events: none;
                    overflow: hidden;
                    will-change: transform;
                }

                .wave-wrapper-1 {
                    height: 48vh;
                    min-height: 380px;
                    opacity: 0.9;
                    z-index: 1;
                }

                .wave-wrapper-2 {
                    height: 42vh;
                    min-height: 330px;
                    opacity: 0.85;
                    z-index: 2;
                }

                .wave-wrapper-3 {
                    height: 36vh;
                    min-height: 280px;
                    opacity: 0.92;
                    z-index: 3;
                }

                .wave-wrapper-4 {
                    height: 28vh;
                    min-height: 220px;
                    opacity: 0.95;
                    z-index: 4;
                }

                /* Each wave track SVG is 200% width, sliding seamlessly by 50% */
                .wave-svg {
                    display: block;
                    width: 200%;
                    min-width: 2880px;
                    height: 100%;
                    will-change: transform;
                }

                /* Horizontal Wave Motion */
                @keyframes kushiWaveSlideLeft {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                }

                @keyframes kushiWaveSlideRight {
                    0% { transform: translate3d(-50%, 0, 0); }
                    100% { transform: translate3d(0, 0, 0); }
                }

                .wave-track-left-1 {
                    animation: kushiWaveSlideLeft 22s linear infinite;
                }

                .wave-track-right-2 {
                    animation: kushiWaveSlideRight 17s linear infinite;
                }

                .wave-track-left-3 {
                    animation: kushiWaveSlideLeft 12s linear infinite;
                }

                .wave-track-right-4 {
                    animation: kushiWaveSlideRight 19s linear infinite;
                }

                /* Vertical Crest & Trough Undulation */
                @keyframes kushiWaveUndulate1 {
                    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
                    50% { transform: translate3d(0, -18px, 0) scaleY(1.04); }
                }

                @keyframes kushiWaveUndulate2 {
                    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
                    50% { transform: translate3d(0, 20px, 0) scaleY(0.96); }
                }

                @keyframes kushiWaveUndulate3 {
                    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
                    50% { transform: translate3d(0, -14px, 0) scaleY(1.03); }
                }

                @keyframes kushiWaveUndulate4 {
                    0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }
                    50% { transform: translate3d(0, 12px, 0) scaleY(0.98); }
                }

                .wave-undulator-1 {
                    height: 100%;
                    animation: kushiWaveUndulate1 7s ease-in-out infinite;
                }

                .wave-undulator-2 {
                    height: 100%;
                    animation: kushiWaveUndulate2 5.5s ease-in-out infinite;
                }

                .wave-undulator-3 {
                    height: 100%;
                    animation: kushiWaveUndulate3 4.8s ease-in-out infinite;
                }

                .wave-undulator-4 {
                    height: 100%;
                    animation: kushiWaveUndulate4 6.2s ease-in-out infinite;
                }

                /* Subtle Breathing Ambient Glows */
                @keyframes kushiGlowBreathe {
                    0%, 100% { opacity: 0.9; transform: translateX(-50%) scale(1); }
                    50% { opacity: 0.72; transform: translateX(-50%) scale(1.05); }
                }

                .glow-1 {
                    animation: kushiGlowBreathe 10s ease-in-out infinite;
                }

                .glow-2 {
                    animation: kushiGlowBreathe 14s ease-in-out infinite reverse;
                }

                /* Accessibility / Reduced Motion */
                @media (prefers-reduced-motion: reduce) {
                    .wave-track-left-1,
                    .wave-track-right-2,
                    .wave-track-left-3,
                    .wave-track-right-4,
                    .wave-undulator-1,
                    .wave-undulator-2,
                    .wave-undulator-3,
                    .wave-undulator-4,
                    .glow-1,
                    .glow-2 {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
