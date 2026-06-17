import React, { useState, useMemo, useEffect, useRef } from "react";

export default function RecordTable({ selectedRecords = [] }) {
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const dragCol = useRef(null);

  const columns = useMemo(
    () => (selectedRecords[0] ? Object.keys(selectedRecords[0]) : []),
    [selectedRecords]
  );

  useEffect(() => {
    if (columns.length > 0) setVisibleColumns(columns);
  }, [columns]);

  // Toggle column visibility (keeping order)
  const handleColumnToggle = (col) => {
    setVisibleColumns((prev) => {
      if (prev.includes(col)) return prev.filter((c) => c !== col);
      const newCols = [...prev];
      const insertIndex = columns.indexOf(col);
      newCols.splice(insertIndex, 0, col);
      return newCols;
    });
  };

  // Filter
  const filteredRecords = useMemo(() => {
    if (!filterText) return selectedRecords;
    const text = filterText.toLowerCase();
    return selectedRecords.filter((record) =>
      Object.values(record).some((val) =>
        String(val || "").toLowerCase().includes(text)
      )
    );
  }, [filterText, selectedRecords]);

  // Sorting
  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;
    const sorted = [...filteredRecords].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal === bVal) return 0;
      return sortConfig.direction === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    });
    return sorted;
  }, [filteredRecords, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // 🔁 Drag & Drop (shared between dropdown and header)
  const handleDragStart = (e, col) => {
    dragCol.current = col;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, col) => {
    e.preventDefault();
    const draggedCol = dragCol.current;
    if (!draggedCol || draggedCol === col) return;
    const newCols = [...visibleColumns];
    const fromIndex = newCols.indexOf(draggedCol);
    const toIndex = newCols.indexOf(col);
    newCols.splice(fromIndex, 1);
    newCols.splice(toIndex, 0, draggedCol);
    setVisibleColumns(newCols);
  };

  if (!selectedRecords.length) {
    return (
      <div className="text-muted text-center py-3">
        No records to display
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* 🔍 Filter + Column Controls */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Filter records..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ width: "60%" }}
        />

        {/* 🧩 Columns Dropdown with Reordering */}
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Columns
          </button>
          <ul
            className="dropdown-menu p-2"
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              minWidth: "200px",
            }}
          >
            {visibleColumns.map((col) => (
              <li
                key={col}
                className="form-check d-flex align-items-center justify-content-between"
                draggable
                onDragStart={(e) => handleDragStart(e, col)}
                onDragOver={(e) => handleDragOver(e, col)}
                onDrop={(e) => handleDrop(e, col)}
                style={{
                  cursor: "move",
                  userSelect: "none",
                }}
                title="Drag to reorder"
              >
                <div>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`col-${col}`}
                    checked={visibleColumns.includes(col)}
                    onChange={() => handleColumnToggle(col)}
                  />
                  <label
                    className="form-check-label ms-1"
                    htmlFor={`col-${col}`}
                  >
                    {col}
                  </label>
                </div>
                <span className="text-muted" style={{ fontSize: "10px" }}>
                  ↕
                </span>
              </li>
            ))}

            {/* Hidden columns (appear faded) */}
            {columns
              .filter((c) => !visibleColumns.includes(c))
              .map((col) => (
                <li
                  key={col}
                  className="form-check text-muted"
                  style={{ opacity: 0.6 }}
                >
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`col-${col}`}
                    checked={false}
                    onChange={() => handleColumnToggle(col)}
                  />
                  <label
                    className="form-check-label ms-1"
                    htmlFor={`col-${col}`}
                  >
                    {col}
                  </label>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* 🧾 Scrollable Table */}
      <div
        className="table-wrap table-responsive"
        // style={{
        //   maxHeight: "400px",
        //   overflowY: "auto",
        //   borderRadius: "6px",
        // }}
      >
        <table className="s2a-table table table-striped table-sm align-middle">
          <thead className="table-header sticky-top">
            <tr className="row-header">
              {visibleColumns.map((key) => (
                <th
                  key={key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragOver={(e) => handleDragOver(e, key)}
                  onDrop={(e) => handleDrop(e, key)}
                  onClick={() => handleSort(key)}
                  style={{
                    cursor: "move",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                  title="Drag to reorder | Click to sort"
                >
                  {key}
                  {sortConfig.key === key && (
                    <span className="ms-1">
                      {sortConfig.direction === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="s2a-table-body">
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record, i) => (
                <tr className="table-row" key={i}>
                    
                  {visibleColumns.map((key) => (
                    <td className="s2a-table-data" key={key}>{record[key]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="row-data text-center py-3">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
