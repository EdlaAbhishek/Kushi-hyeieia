import { useState, useRef, useEffect } from 'react'
import { Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * InfoTooltip — Lightweight explanation tooltip
 * 
 * @param {string} [text] - Simple explanation text
 * @param {object} [content] - Rich content object { title, description, usage } or initialized with i18n
 * @param {number} [size=16] - Icon size
 * @param {string} [position='bottom'] - Tooltip position: 'top' | 'bottom' | 'left' | 'right'
 */
export default function InfoTooltip({ text, content, size = 16, position = 'bottom' }) {
    const [isOpen, setIsOpen] = useState(false)
    const tooltipRef = useRef(null)
    const triggerRef = useRef(null)

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return
        const handleClick = (e) => {
            if (
                tooltipRef.current && !tooltipRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    const getPositionStyles = () => {
        switch (position) {
            case 'top':
                return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
            case 'left':
                return { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }
            case 'right':
                return { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }
            default: // bottom
                return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
        }
    }

    const getMotionProps = () => {
        switch (position) {
            case 'top':
                return { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 6 } }
            case 'left':
                return { initial: { opacity: 0, x: 6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 6 } }
            case 'right':
                return { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -6 } }
            default:
                return { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } }
        }
    }

    const parsedContent = content ? (content.en || content) : null;

    return (
        <span className="info-tooltip-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                ref={triggerRef}
                className="info-tooltip-trigger"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                type="button"
                aria-label="More information"
            >
                <Info size={size} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={tooltipRef}
                        className="info-tooltip-popup"
                        style={getPositionStyles()}
                        {...getMotionProps()}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onMouseEnter={() => setIsOpen(true)}
                        onMouseLeave={() => setIsOpen(false)}
                    >
                        <button
                            className="info-tooltip-close"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                            type="button"
                        >
                            <X size={12} />
                        </button>
                        
                        {parsedContent ? (
                            <div className="info-tooltip-body">
                                {parsedContent.title && <h4 className="info-tooltip-title">{parsedContent.title}</h4>}
                                {(parsedContent.description || parsedContent.helps) && (
                                    <p className="info-tooltip-desc">{parsedContent.description || parsedContent.helps}</p>
                                )}
                                {parsedContent.usage && (
                                    <div className="info-tooltip-usage">
                                        <strong>How to use:</strong>
                                        <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{parsedContent.usage}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="info-tooltip-text">{text}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    )
}
