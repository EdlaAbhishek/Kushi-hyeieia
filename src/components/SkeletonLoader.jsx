import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 3 }) {
    const skeletons = Array(count).fill(0);

    if (type === 'card') {
        return (
            <div className="skeleton-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
                {skeletons.map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', height: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="skeleton-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E2E8F0', animation: 'pulse 1.5s infinite' }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ height: '16px', width: '60%', background: '#E2E8F0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                                <div style={{ height: '12px', width: '40%', background: '#F1F5F9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                            </div>
                        </div>
                        <div style={{ height: '12px', width: '80%', background: '#F1F5F9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ height: '12px', width: '70%', background: '#F1F5F9', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ marginTop: 'auto', height: '36px', width: '100%', background: '#E2E8F0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className="skeleton-table" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: '40px', background: '#E2E8F0', borderRadius: '6px', width: '100%', animation: 'pulse 1.5s infinite' }}></div>
                {skeletons.map((_, i) => (
                    <div key={i} style={{ height: '50px', background: '#F8FAFC', borderRadius: '6px', width: '100%', border: '1px solid #E2E8F0', animation: 'pulse 1.5s infinite' }}></div>
                ))}
            </div>
        )
    }

    return (
        <div style={{ padding: '1rem', color: '#64748B', textAlign: 'center' }}>
            Loading...
        </div>
    );
}
