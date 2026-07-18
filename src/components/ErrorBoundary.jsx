import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("IGNITE Error:", error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 40, textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", fontFamily: "Rajdhani,sans-serif", marginBottom: 8 }}>Something went wrong</div>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, maxWidth: 300 }}>Don't worry — your data is safe. Try refreshing the page.</p>
                    <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 20, padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,.06)", maxWidth: 300, wordBreak: "break-all" }}>{this.state.error?.message || "Unknown error"}</div>
                    <button className="bp" onClick={() => { this.setState({ hasError: false, error: null }); }} style={{ padding: "12px 32px", marginBottom: 8 }}>Try Again</button>
                    <button className="bg" onClick={() => window.location.reload()} style={{ padding: "10px 24px", fontSize: 12 }}>Reload App</button>
                </div>
            );
        }
        return this.props.children;
    }
}