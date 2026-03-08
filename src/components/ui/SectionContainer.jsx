import React from 'react';

/**
 * Standardized Section Container
 * Forces consistent padding and max-widths across all pages.
 */
export default function SectionContainer({ children, className = '', style = {} }) {
    return (
        <section className={`py-10 ${className}`} style={style}>
            <div className="max-w-7xl mx-auto px-6">
                {children}
            </div>
        </section>
    );
}
