import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger" // danger, warning, primary
}) {
    if (!isOpen) return null

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} color="#EF4444" />;
            case 'warning': return <AlertTriangle size={24} color="#F59E0B" />;
            default: return <AlertTriangle size={24} color="var(--primary)" />;
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                <button className="modal-close" onClick={onCancel}>
                    <X size={18} />
                </button>

                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: type === 'danger' ? '#FEF2F2' : '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getIcon()}
                    </div>
                </div>

                <h3 className="modal-title" style={{ marginBottom: '0.75rem' }}>{title}</h3>
                <p className="modal-subtitle" style={{ marginBottom: '2rem', lineHeight: '1.6' }}>{message}</p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-outline"
                        onClick={onCancel}
                        style={{ flex: 1 }}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="btn"
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            background: type === 'danger' ? '#EF4444' : 'var(--primary)',
                            color: '#fff',
                            border: 'none'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
