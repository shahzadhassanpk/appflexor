import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export default function RenderPDF({
    reportUrl,
    renderIframe,
    downloadExcelFile,
}) {
    const [containerEl, setContainerEl] = useState(null);
    const [canvasEl, setCanvasEl] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isRender, setIsRender] = useState(false);

    const renderPDF = async () => {
        if (!renderIframe || !reportUrl || !containerEl || !canvasEl) return;

        try {
            const pdf = await pdfjsLib.getDocument(reportUrl).promise;
            const page = await pdf.getPage(1);

            const context = canvasEl.getContext("2d");
            const containerHeight = containerEl.clientHeight || 600;
            const viewport = page.getViewport({ scale: 1 });
            const scale = containerHeight / viewport.height;
            const scaledViewport = page.getViewport({ scale });

            canvasEl.height = scaledViewport.height;
            canvasEl.width = scaledViewport.width;

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;
        } catch (err) {
            console.error("Error rendering PDF:", err);
        }
    };

    // Load/render on URL change or maximize toggle
    useEffect(() => {
        if (containerEl && canvasEl) renderPDF();
    }, [reportUrl, isMaximized, isRender]);

    // Re-render when container resizes
    useEffect(() => {
        if (!containerEl || !isRender) return;
        const observer = new ResizeObserver(() => renderPDF());
        observer.observe(containerEl);
        return () => observer.disconnect();
    }, [isRender, isMaximized]);

    const toggleMaximize = () => setIsMaximized((prev) => !prev);

    return (
        <>
            {renderIframe && (
                <div
                    ref={setContainerEl}
                    style={{
                        position: isMaximized ? "fixed" : "relative",
                        top: isMaximized ? 0 : "auto",
                        left: isMaximized ? 0 : "auto",
                        width: isMaximized ? "100vw" : "100%",
                        height: isMaximized ? "100vh" : "100%",
                        background: "#fff",
                        overflow: "auto",
                        border: "1px solid #ccc",
                        zIndex: isMaximized ? 9999 : "auto",
                        transition: "all 0.3s ease",
                    }}
                >
                    {/* Toolbar */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            background: "#f9f9f9",
                            padding: "4px 8px",
                            borderBottom: "1px solid #ddd",
                            marginRight: "20px",
                        }}
                    >
                        {downloadExcelFile && (
                            <>
                                <i className="bi-file-earmark-excel-fill text-success"></i>
                                <button
                                    onClick={() => downloadExcelFile()}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        color: "#333",
                                        marginRight: "8px",
                                    }}
                                    title="Download XLS"
                                >
                                    Download
                                </button>
                            </>
                        )}
                        <button
                            onClick={toggleMaximize}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                cursor: "pointer",
                                color: "#333",
                            }}
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            {isMaximized ? "🗗 Restore" : "🗖 Maximize"}
                        </button>
                    </div>

                    {/* PDF Canvas */}
                    <div
                        style={{
                            textAlign: "center",
                            padding: "8px",
                            width: "100%",
                            height: "calc(100% - 40px)",
                            overflow: "auto",
                        }}
                    >
                        <canvas
                            ref={setCanvasEl}
                            style={{
                                display: "block",
                                margin: "0 auto",
                                maxWidth: "100%",
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
