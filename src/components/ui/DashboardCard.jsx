import React from 'react';

/**
 * Standardized Dashboard Card
 * Forces consistent rounding, shadows, padding, and titles for all information boxes.
 */
export default function DashboardCard({ title, icon: Icon, children, className = '', style = {}, action }) {
    return (
        <div
            className={`card ${className}`}
            style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: '#fff',
                border: '1px solid var(--border)',
                ...style
            }}
        >
            {(title || Icon || action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {Icon && <Icon size={20} style={{ color: 'var(--primary)' }} />}
                        {title && (
                            <h2 className="text-xl font-semibold" style={{ margin: 0, color: 'var(--text-dark)' }}>
                                {title}
                            </h2>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>
                {children}
            </div>
        </div>
    );
}
