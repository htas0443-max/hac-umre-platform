import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{
                        color: 'var(--primary-teal)',
                        marginBottom: '1rem',
                        fontSize: '1.5rem'
                    }}>
                        Bir Hata Oluştu
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                        maxWidth: '400px'
                    }}>
                        Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={this.handleRetry}
                            className="btn btn-primary"
                            style={{ cursor: 'pointer' }}
                        >
                            🔄 Tekrar Dene
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn btn-secondary"
                            style={{ cursor: 'pointer' }}
                        >
                            🏠 Anasayfaya Dön
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginTop: '2rem',
                            textAlign: 'left',
                            background: '#fee2e2',
                            padding: '1rem',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
                                Hata Detayları (Geliştirici)
                            </summary>
                            <pre style={{
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {this.state.error.message}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
