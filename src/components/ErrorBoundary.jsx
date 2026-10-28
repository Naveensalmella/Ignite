"use client";
import { Component } from 'react';
import { TriangleAlert, RotateCcw, RefreshCw } from "lucide-react";
import { IconBadge } from "@/components/ui/kit";

export default class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("IGNITE Error:", error, info); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center px-4 py-10" style={{ minHeight: "60vh" }}>
                    <div className="card w-full text-center" style={{ maxWidth: 380, padding: 24 }} role="alert">
                        <div className="flex justify-center mb-3"><IconBadge icon={TriangleAlert} tone="rose" size={52} /></div>
                        <div className="text-[19px] font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>Something went wrong</div>
                        <p className="text-[13.5px] mb-4" style={{ color: "var(--text-secondary)" }}>Don&apos;t worry — your data is safe. Try again or reload the app.</p>
                        <div className="text-[12px] mb-5 px-3 py-2 rounded-xl text-left break-all"
                            style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
                            {this.state.error?.message || "Unknown error"}
                        </div>
                        <div className="flex flex-col gap-2">
                            <button type="button" className="bp w-full" onClick={() => { this.setState({ hasError: false, error: null }); }}>
                                <RotateCcw size={16} /> Try again
                            </button>
                            <button type="button" className="bg w-full" onClick={() => window.location.reload()}>
                                <RefreshCw size={16} /> Reload app
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
