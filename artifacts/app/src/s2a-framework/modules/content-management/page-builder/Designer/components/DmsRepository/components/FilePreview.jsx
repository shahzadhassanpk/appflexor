import React, { useState, useEffect } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import Papa from "papaparse";
import DataTable from "react-data-table-component";

export default function FilePreview({ previewFile, setPreviewFile }) {
    const [zoom, setZoom] = useState(1);
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({
        width: window.innerWidth * 0.25,
        height: window.innerHeight * 0.8,
    });

    const [position, setPosition] = useState({
        x: window.innerWidth * 0.7,
        y: window.innerHeight * 0.5,
    });

    const [csvData, setCsvData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [defaultSortField, setDefaultSortField] = useState(null);

    if (!previewFile) return null;

    const ext = previewFile.name.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
    const isPdf = ext === "pdf";
    const isCsv = ext === "csv";

    const [prevState, setPrevState] = useState({ size: {}, position: {} });

    // 🧭 Toggle Maximize/Restore
    const toggleMaximize = () => {
        if (!isMaximized) {
            // Save current size and position before maximizing
            setPrevState({ size, position });

            // Target size (80% of viewport)
            const maxWidth = Math.min(
                window.innerWidth * 0.8,
                window.innerWidth - 60,
            );
            const maxHeight = Math.min(
                window.innerHeight * 0.8,
                window.innerHeight - 60,
            );

            // Ensure always visible — at least 60px from top
            const safeMarginTop = 200;

            // Center horizontally and vertically within visible area
            const centerX = (window.innerWidth - maxWidth) / 2;
            const centerY = Math.max(
                (window.innerHeight - maxHeight) / 2,
                safeMarginTop,
            );

            // Apply new size and position
            setSize({ width: maxWidth, height: maxHeight });
            setPosition({ x: centerX, y: centerY });
            setIsMaximized(true);
        } else {
            // Restore previous size and position
            setSize(prevState.size);
            setPosition(prevState.position);
            setIsMaximized(false);
        }
    };

    const getPreviewUrl = () =>
        `/file/service/${previewFile.table}/${previewFile.id}/${previewFile.name}?disposition=inline`;

    const isDate = val =>
        /\b(\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?|[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})\b/.test(
            val,
        );
    const isNumber = val => {
        if (val === null || val === undefined) return false;
        const num = parseFloat(String(val).replace(/,/g, ""));
        return !isNaN(num) && isFinite(num);
    };

    useEffect(() => {
        if (isCsv && previewFile) {
            const fetchCsvText = async () => {
                try {
                    const res = await fetch(getPreviewUrl());
                    const text = await res.text();
                    const parsed = Papa.parse(text, {
                        header: false,
                        skipEmptyLines: true,
                    });

                    const rows = parsed.data;
                    if (!rows.length) return;

                    // 🔹 Detect header row (max non-empty cells)
                    let maxCols = 0,
                        headerIndex = 0;
                    rows.forEach((row, i) => {
                        const nonEmpty = row.filter(
                            c => c && c.trim() !== "",
                        ).length;
                        if (nonEmpty > maxCols) {
                            maxCols = nonEmpty;
                            headerIndex = i;
                        }
                    });

                    const headers = rows[headerIndex].map(
                        (h, i) => h.trim() || `Column${i + 1}`,
                    );
                    const dataRows = rows.slice(headerIndex + 1);

                    const clean = val =>
                        typeof val === "string" ? val.trim() : val ?? "";
                    const data = dataRows.map(row => {
                        let obj = {};
                        headers.forEach((h, i) => {
                            obj[h] = clean(row[i]);
                        });
                        return obj;
                    });

                    // 🔹 Smart type detection (date/number)
                    const isDateValue = val => {
                        if (!val) return false;
                        return (
                            /\b(\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?)\b/.test(
                                val,
                            ) ||
                            /\b([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{2,4})\b/.test(
                                val,
                            )
                        );
                    };

                    const isNumberValue = val => {
                        if (!val) return false;
                        const num = parseFloat(String(val).replace(/,/g, ""));
                        return !isNaN(num) && isFinite(num);
                    };

                    // 🔹 Robust date parser for dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, etc.
                    const parseDate = val => {
                        if (!val) return null;
                        let d;
                        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(val)) {
                            const parts = val.split(/[\/\-]/);
                            const [a, b, c] = parts.map(Number);
                            // Detect dd/mm/yyyy vs mm/dd/yyyy
                            if (a > 12)
                                d = new Date(c < 100 ? 2000 + c : c, b - 1, a);
                            else if (b > 12)
                                d = new Date(c < 100 ? 2000 + c : c, a - 1, b);
                            else d = new Date(c < 100 ? 2000 + c : c, a - 1, b); // assume dd/mm/yyyy
                        } else {
                            d = new Date(val);
                        }
                        return isNaN(d.getTime()) ? null : d;
                    };

                    const typeMap = {};
                    headers.forEach(h => {
                        const sampleValues = data.slice(0, 15).map(d => d[h]);
                        const dateCount =
                            sampleValues.filter(isDateValue).length;
                        const numCount =
                            sampleValues.filter(isNumberValue).length;
                        if (dateCount > numCount && dateCount > 3)
                            typeMap[h] = "date";
                        else if (numCount > 3) typeMap[h] = "number";
                        else typeMap[h] = "text";
                    });

                    // 🔹 Build columns with correct sort functions
                    const cols = headers.map(h => ({
                        name: h,
                        selector: row => row[h],
                        sortable: true,
                        wrap: true,
                        right: typeMap[h] === "number",
                        sortFunction:
                            typeMap[h] === "date"
                                ? (a, b) => {
                                      const da = parseDate(a[h]);
                                      const db = parseDate(b[h]);
                                      if (!da && !db) return 0;
                                      if (!da) return 1;
                                      if (!db) return -1;
                                      return da - db;
                                  }
                                : typeMap[h] === "number"
                                ? (a, b) =>
                                      parseFloat(
                                          String(a[h]).replace(/,/g, ""),
                                      ) -
                                      parseFloat(String(b[h]).replace(/,/g, ""))
                                : undefined,
                    }));

                    const firstDateCol = headers.find(
                        h => typeMap[h] === "date",
                    );
                    const firstNumCol = headers.find(
                        h => typeMap[h] === "number",
                    );
                    const sortField = firstDateCol || firstNumCol || headers[0];

                    setColumns(cols);
                    setCsvData(data);
                    setFilteredData(data);
                    setDefaultSortField(sortField);
                } catch (err) {
                    console.error("CSV parse error:", err);
                }
            };
            fetchCsvText();
        }
    }, [isCsv, previewFile]);

    // 🔍 Filter data when search changes
    useEffect(() => {
        if (!searchText.trim()) {
            setFilteredData(csvData);
        } else {
            const lower = searchText.toLowerCase();
            const filtered = csvData.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(lower),
                ),
            );
            setFilteredData(filtered);
        }
    }, [searchText, csvData]);

    return (
        <Draggable
            handle=".drag-handle"
            // disabled={isMaximized}
            bounds="window"
            position={position}
            onStop={(_, data) => setPosition({ x: data.x, y: data.y })}>
            <Resizable
                size={size}
                onResizeStop={(e, direction, ref, d) => {
                    if (isMaximized) return;
                    const newSize = {
                        width: size.width + d.width,
                        height: size.height + d.height,
                    };
                    const newPos = { ...position };
                    if (direction.includes("left")) newPos.x -= d.width;
                    setSize(newSize);
                    setPosition(newPos);
                }}
                enable={{
                    top: false,
                    right: true,
                    bottom: true,
                    left: true,
                    bottomRight: true,
                    bottomLeft: true,
                }}
                minWidth={300}
                minHeight={200}
                maxWidth="90vw"
                maxHeight="95vh"
                style={{
                    position: "fixed",
                    bottom: 275,
                    left: 48,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                    zIndex: 1050,
                    display: "flex",
                    flexDirection: "column",
                }}>
                <style>
                    {`
                    .drag-handle, .drag-handle * {
                        user-select: none !important;
                        -webkit-user-select: none !important;
                        -moz-user-select: none !important;
                        -ms-user-select: none !important;
                    }
                `}
                </style>
                {/* Header */}
                <div
                    className="drag-handle"
                    style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #ddd",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "move",
                        background: "#f0f0f0",
                        borderTopLeftRadius: "8px",
                        borderTopRightRadius: "8px",
                    }}>
                    <span style={{ fontWeight: "bold", color: "#333" }}>
                        {previewFile.name}
                    </span>
                    <div className="d-flex">
                        <button
                            onClick={toggleMaximize}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "18px",
                                cursor: "pointer",
                                marginRight: "8px",
                            }}>
                            {isMaximized ? "🗗" : "🗖"}
                        </button>
                        <button
                            onClick={() => setPreviewFile(null)}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: "18px",
                                cursor: "pointer",
                            }}>
                            ✖
                        </button>
                    </div>
                </div>

                {/* 🔍 Search bar */}
                {isCsv && (
                    <div
                        style={{
                            padding: "8px 12px",
                            borderBottom: "1px solid #eee",
                            background: "#fafafa",
                        }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                fontSize: "14px",
                            }}
                        />
                    </div>
                )}

                {/* CSV Table */}
                {isCsv && filteredData.length > 0 && (
                    <div style={{ flex: 1, overflow: "auto", padding: "10px" }}>
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            defaultSortFieldId={defaultSortField}
                            pagination
                            highlightOnHover
                            dense
                            striped
                            responsive
                        />
                    </div>
                )}

                {/* PDF Viewer */}
                {isPdf && (
                    <iframe
                        src={getPreviewUrl()}
                        style={{
                            flex: 1,
                            border: "none",
                            width: "100%",
                            height: "100%",
                        }}
                        title="PDF Preview"
                    />
                )}

                {/* Image Viewer */}
                {isImage && (
                    <div
                        style={{
                            flex: 1,
                            overflow: "auto",
                            textAlign: "center",
                        }}>
                        <img
                            src={getPreviewUrl()}
                            alt="Preview"
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: "top left",
                                width: "100%",
                                height: "auto",
                                display: "block",
                                margin: "0 auto",
                            }}
                        />
                    </div>
                )}
            </Resizable>
        </Draggable>
    );
}
