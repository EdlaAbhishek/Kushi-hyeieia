import React from 'react';
import SectionContainer from './SectionContainer';

/**
 * Standardized Page Header
 * Ensures all pages start with the exact same visual hierarchy.
 */
export default function PageHeader({ title, description, action }) {
    return (
        <SectionContainer className="doctor-header" style={{ paddingBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {title}
                    </h1>
                    {description && (
                        <p className="text-base text-muted-foreground" style={{ margin: 0 }}>
                            {description}
                        </p>
                    )}
                </div>
                {action && (
                    <div>
                        {action}
                    </div>
                )}
            </div>
        </SectionContainer>
    );
}
