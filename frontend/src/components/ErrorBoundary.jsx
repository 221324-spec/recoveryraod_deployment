import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep this minimal; details already show in browser devtools.
    console.error('UI crashed:', error);
    console.error('Component stack:', info?.componentStack || info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      const message = String(error?.message || error);
      return (
        <div style={{ padding: '2rem', maxWidth: 840, margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted, #64748b)' }}>
            The app hit an unexpected UI error. Check the browser console for details.
          </p>
          <div style={{ background: 'rgba(100,116,139,0.12)', borderRadius: 12, padding: '0.75rem 1rem' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message}</pre>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', borderRadius: 10, border: '1px solid rgba(100,116,139,0.35)' }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
