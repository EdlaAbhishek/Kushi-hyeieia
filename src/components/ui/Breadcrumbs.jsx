import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumbs({ items }) {
    return (
        <nav className="flex px-5 py-3 text-gray-700 border border-gray-200 rounded-lg bg-gray-50 mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Link>
                </li>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    return (
                        <li key={index}>
                            <div className="flex items-center">
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                {isLast ? (
                                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link to={item.href} className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
