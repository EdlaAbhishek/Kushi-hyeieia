import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Standardized Action Button
 * Forces consistent primary (blue) or secondary (outline) styling.
 */
export default function ActionButton({
    children,
    variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
    onClick,
    to,
    className = '', ...props
}) {
    // Map variants to existing CSS classes
    let btnClass = 'btn';
    if (variant === 'primary') btnClass += ' btn-primary';
    else if (variant === 'secondary' || variant === 'outline') btnClass += ' btn-outline';
    else if (variant === 'danger') btnClass += ' btn-danger'; // Requires CSS update if not explicitly defined

    const combinedClass = `${btnClass} ${className}`.trim();

    if (to) {
        return (
            <Link to={to} className={combinedClass} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={combinedClass} onClick={onClick} {...props}>
            {children}
        </button>
    );
}
