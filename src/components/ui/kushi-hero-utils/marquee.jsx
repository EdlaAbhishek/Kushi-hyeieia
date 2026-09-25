import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/**
 * Marquee Component for Kushi Hygieia Hero Section
 * Provides an infinite horizontal scroll of clickable capability cards.
 * Clicking any card navigates to its relevant healthcare feature.
 * Includes pause-on-hover, seamless duplicate track, and touch scroll support.
 * Respects prefers-reduced-motion.
 */
export default function Marquee({
    items = [],
    speed = 35,
    pauseOnHover = true,
    className = ''
}) {
    const [isPaused, setIsPaused] = useState(false)

    return (
        <div
            className={`kushi-marquee-wrapper ${className}`}
            style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                padding: '1.25rem 0',
                maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            <div
                className="kushi-marquee-track"
                style={{
                    display: 'flex',
                    width: 'max-content',
                    gap: '1.25rem',
                    animationPlayState: isPaused ? 'paused' : 'running',
                    animationDuration: `${speed}s`
                }}
            >
                {/* Primary set of cards */}
                {items.map((item, index) => (
                    <MarqueeCard key={`primary-${index}`} item={item} />
                ))}

                {/* Duplicate set for seamless continuous loop */}
                {items.map((item, index) => (
                    <MarqueeCard key={`duplicate-${index}`} item={item} ariaHidden={true} />
                ))}
            </div>

            <style>{`
                @keyframes kushiMarqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .kushi-marquee-track {
                    animation: kushiMarqueeScroll linear infinite;
                    will-change: transform;
                }

                .kushi-marquee-card {
                    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                }

                .kushi-marquee-card:hover {
                    transform: translateY(-4px) !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 12px 22px -4px rgba(21, 101, 192, 0.14), 0 4px 6px -2px rgba(0, 0, 0, 0.04) !important;
                }

                .kushi-marquee-card:hover .marquee-card-arrow {
                    transform: translate(2px, -2px) !important;
                    color: var(--primary) !important;
                }

                @media (prefers-reduced-motion: reduce) {
                    .kushi-marquee-track {
                        animation: none !important;
                        overflow-x: auto;
                        scrollbar-width: none;
                    }
                    .kushi-marquee-track::-webkit-scrollbar {
                        display: none;
                    }
                }

                @media (max-width: 640px) {
                    .kushi-marquee-card {
                        width: 260px !important;
                        padding: 0.9rem 1rem !important;
                    }
                    .kushi-marquee-card h4 {
                        font-size: 0.9rem !important;
                    }
                    .kushi-marquee-card p {
                        font-size: 0.78rem !important;
                    }
                }
            `}</style>
        </div>
    )
}

function MarqueeCard({ item, ariaHidden }) {
    const Icon = item.icon
    const target = item.to || '#'

    const cardContent = (
        <div>
            {/* Header: Icon + Small Designation + Navigation Affordance Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {Icon && <Icon size={18} strokeWidth={2.2} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--accent)',
                        background: 'var(--accent-light)',
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-pill)'
                    }}>
                        {item.designation}
                    </span>
                    <ArrowUpRight
                        size={15}
                        className="marquee-card-arrow"
                        style={{
                            color: 'var(--text-muted)',
                            transition: 'transform 0.2s ease, color 0.2s ease'
                        }}
                    />
                </div>
            </div>

            {/* Capability Name */}
            <h4 style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-dark)',
                letterSpacing: '-0.01em'
            }}>
                {item.name}
            </h4>

            {/* Description */}
            <p style={{
                margin: 0,
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45
            }}>
                {item.description}
            </p>
        </div>
    )

    return (
        <Link
            to={target}
            className="kushi-marquee-card"
            style={{
                width: '320px',
                flexShrink: 0,
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.15rem 1.25rem',
                boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer'
            }}
            tabIndex={ariaHidden ? -1 : 0}
            aria-hidden={ariaHidden}
            title={`Open ${item.name}`}
        >
            {cardContent}
        </Link>
    )
}
