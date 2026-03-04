import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 24, className = '', text = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <Loader2 size={size} className="animate-spin text-blue-600 mb-2" />
            {text && <span className="text-sm text-gray-600">{text}</span>}
        </div>
    )
}
