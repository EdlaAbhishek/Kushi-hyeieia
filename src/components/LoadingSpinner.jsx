import React from 'react';

export default function LoadingSpinner({ text = 'Processing...', size = 'default' }) {
    const sizeMap = {
        small: { width: '16px', height: '16px', borderWidth: '2px' },
        default: { width: '24px', height: '24px', borderWidth: '3px' },
        large: { width: '40px', height: '40px', borderWidth: '4px' }
    };

    const styles = sizeMap[size] || sizeMap.default;

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <div
                style={{
                    ...styles,
                    borderRadius: '50%',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'currentColor',
                    animation: 'spin 1s linear infinite'
                }}
            />
            {/* Adding inline style block for keyframes if not present in main CSS */}
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
            {text && <span style={{ opacity: 0.9 }}>{text}</span>}
        </div>
    );
}
