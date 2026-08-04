import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry,
        });
      }

      const isDark = this.props.isDarkMode;
      const t = this.props.lang === 'sw' ? {
        title: 'Hitilafu Imetokea',
        desc: 'Samahani, kuna hitilafu kwenye sehemu hii. Tafadhali jaribu tena.',
        retry: 'Jaribu Tena',
        reload: 'Pakia Upya Ukurasa',
      } : {
        title: 'Something Went Wrong',
        desc: 'Sorry, an error occurred in this section. Please try again.',
        retry: 'Try Again',
        reload: 'Reload Page',
      };

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '40px 20px', minHeight: '200px',
          textAlign: 'center', color: isDark ? '#e2e8f0' : '#334155',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', fontSize: '28px',
          }}>
            ⚠
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>{t.title}</h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', opacity: 0.7, maxWidth: '400px' }}>{t.desc}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleRetry}
              className="btn btn-primary"
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: '#6366f1', color: '#fff', fontWeight: 600,
                cursor: 'pointer', fontSize: '14px',
              }}
            >
              {t.retry}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
              style={{
                padding: '10px 24px', borderRadius: '10px',
                border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                background: 'transparent', color: isDark ? '#e2e8f0' : '#334155',
                fontWeight: 600, cursor: 'pointer', fontSize: '14px',
              }}
            >
              {t.reload}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
