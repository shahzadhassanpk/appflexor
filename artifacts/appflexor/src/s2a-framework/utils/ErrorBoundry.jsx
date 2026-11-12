import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null };
    }

    componentDidCatch(error, errorInfo) {
        // Catch errors in any components below and re-render with error message
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });
        // You can also log error messages to an error reporting service here
    }

    render() {
        if (this.state.errorInfo) {
            return (
                <div
                    role="alert"
                    aria-live="assertive"
                    style={{
                        minHeight: "220px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2rem 1rem",
                        background: "var(--background-color, var(--bg-surface, #f8fafc))",
                        color: "var(--font-color, var(--text-primary, #0f172a))",
                    }}>
                    <section
                        style={{
                            width: "min(100%, 560px)",
                            padding: "2rem",
                            textAlign: "center",
                            background: "var(--bg-surface-alt, var(--card-background, #ffffff))",
                            border: "1px solid var(--border-default, var(--border-color, #e2e8f0))",
                            borderRadius: "1rem",
                            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                        }}>
                        <div
                            aria-hidden="true"
                            style={{
                                width: "3rem",
                                height: "3rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "1rem",
                                borderRadius: "50%",
                                background: "var(--danger-soft, rgba(220, 38, 38, 0.1))",
                                color: "var(--danger, #b91c1c)",
                                fontSize: "1.25rem",
                            }}>
                            <i className="fa-solid fa-triangle-exclamation" />
                        </div>
                        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
                            Something went wrong
                        </h2>
                        <p
                            style={{
                                maxWidth: "30rem",
                                margin: "0 auto 1.25rem",
                                color: "var(--text-secondary, var(--text-muted, #64748b))",
                                fontSize: "0.925rem",
                                lineHeight: 1.6,
                            }}>
                            This section could not be loaded. Refresh the page and try again.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                minHeight: "2.5rem",
                                padding: "0.625rem 1rem",
                                border: "1px solid var(--primary, #2563eb)",
                                borderRadius: "0.625rem",
                                background: "var(--primary, #2563eb)",
                                color: "var(--primary-foreground, #ffffff)",
                                cursor: "pointer",
                                font: "inherit",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                            }}>
                            <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                            Refresh page
                        </button>
                    </section>
                </div>
            );
        }
        // Normally, just render children
        return this.props.children;
    }
}
export { ErrorBoundary };
