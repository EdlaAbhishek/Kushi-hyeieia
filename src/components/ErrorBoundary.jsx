import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '60vh', padding: '2rem', textAlign: 'center'
                }}>
                    <AlertTriangle size={64} color="#F59E0B" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', maxWidth: '500px' }}>
                        This page encountered an unexpected error. This is usually caused by a missing database table or a network issue with Supabase.
                    </p>
                    <details style={{ marginBottom: '1.5rem', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
                        <summary style={{ cursor: 'pointer', color: 'var(--text-light)', fontSize: '0.85rem' }}>Error details</summary>
                        <pre style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                    </details>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            this.setState({ hasError: false, error: null })
                            window.location.reload()
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
