import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    sectionName: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[${this.props.sectionName}] Error:`, error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '300px',
                        padding: '2rem',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                        }}
                    >
                        ⚠️
                    </div>
                    <h3
                        style={{
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem',
                            fontSize: '1.25rem',
                        }}
                    >
                        {this.props.sectionName} bölümünde bir hata oluştu
                    </h3>
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            maxWidth: '400px',
                        }}
                    >
                        Bu bölüm geçici olarak kullanılamıyor. Lütfen tekrar deneyin.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="btn btn-primary"
                        style={{ minWidth: '160px' }}
                    >
                        Tekrar Dene
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
