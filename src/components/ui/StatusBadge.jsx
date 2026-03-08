import React from 'react';

/**
 * Standardized Status Badge
 * Maps words (Healthy, Warning, Danger, etc.) to consistent system colors.
 */
export default function StatusBadge({ status, text, className = '' }) {
    // Determine color variant based on status string matching
    let colorClass = 'bg-success-light'; // default healthy

    const s = (status || '').toLowerCase();

    if (s.includes('warning') || s.includes('pending') || s.includes('medium')) {
        colorClass = 'bg-warning-light';
    } else if (s.includes('danger') || s.includes('high') || s.includes('emergency') || s.includes('critical') || s.includes('cancelled')) {
        colorClass = 'bg-danger-light';
    } else if (s.includes('info') || s.includes('scheduled')) {
        colorClass = 'bg-primary-light text-primary'; // assuming defined in CSS or inline
    } else {
        colorClass = 'bg-success-light';
    }

    // fallback mapping if primary-light isn't explicitly defined as an isolated utility class
    let customStyle = {};
    if (colorClass.includes('primary')) {
        customStyle = { backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' };
        colorClass = ''; // strip to use custom
    }

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass} ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.125rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                ...customStyle
            }}
        >
            {text || status}
        </span>
    );
}
