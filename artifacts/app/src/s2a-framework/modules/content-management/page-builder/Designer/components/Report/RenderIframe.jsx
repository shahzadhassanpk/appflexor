import React, { useState } from "react";

export default function RenderIframe({ reportUrl, renderIframe }) {
    const [isMaximized, setIsMaximized] = useState(false);

    const toggleMaximize = () => setIsMaximized(prev => !prev);
    function Loader(params) {
        return (
            <div
                style={{
                    position: "relative",
                    inset: "50%",
                }}>
                <span
                    className="spinner-border text-light"
                    role="status"></span>
            </div>
        );
    }
    return (
        <>
            {renderIframe ? (
                <div
                    style={{
                        position: isMaximized ? "fixed" : "relative",
                        top: isMaximized ? 0 : "auto",
                        left: isMaximized ? 0 : "auto",
                        width: isMaximized ? "100vw" : "100%",
                        height: isMaximized ? "100vh" : "500px",
                        background: "#fff",
                        zIndex: isMaximized ? 9999 : "auto",
                        transition: "all 0.3s ease",
                        border: "1px solid #ccc",
                        overflow: "hidden",
                    }}>
                    {/* Toolbar */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            background: "#f9f9f9",
                            borderBottom: "1px solid #ddd",
                            padding: "4px 8px",
                            height: "36px",
                            marginRight: "20px",
                        }}>
                        <button
                            onClick={toggleMaximize}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                cursor: "pointer",
                                color: "#333",
                            }}
                            title={isMaximized ? "Restore" : "Maximize"}>
                            {isMaximized ? "🗗 Restore" : "🗖 Maximize"}
                        </button>
                    </div>

                    {/* Iframe */}
                    <iframe
                        src={reportUrl}
                        style={{
                            width: "100%",
                            height: "calc(100% - 36px)",
                            border: "none",
                            overflow: "auto",
                        }}
                        scrolling="auto"
                        title="Report Viewer"
                    />
                </div>
            ) : (
                <Loader />
            )}
        </>
    );
}
