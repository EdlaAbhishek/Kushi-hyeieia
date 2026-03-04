import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumbs({ items }) {
    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                    <Link to="/" className="breadcrumb-link">
                        <Home size={14} />
                        <span>Home</span>
                    </Link>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    return (
                        <li key={index} className="breadcrumb-item">
                            <ChevronRight size={16} className="breadcrumb-separator" />
                            {isLast ? (
                                <span className="breadcrumb-current">
                                    {item.label}
                                </span>
                            ) : (
                                <Link to={item.href} className="breadcrumb-link">
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
