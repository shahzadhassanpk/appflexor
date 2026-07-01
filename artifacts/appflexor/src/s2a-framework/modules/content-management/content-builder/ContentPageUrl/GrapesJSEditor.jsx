import React, { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "font-awesome/css/font-awesome.min.css";

import gjsBasicBlocks from "grapesjs-blocks-basic";
import gjsForms from "grapesjs-plugin-forms";
import gjsWebsite from "grapesjs-preset-webpage";

const GrapesJSEditor = () => {
  const editorRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState("blocks");

  useEffect(() => {
    if (editorRef.current) return;

    editorRef.current = grapesjs.init({
      container: "#grape-js",
      height: "100%",
      width: "auto",
      allowScripts: 1,
      fromElement: false,
      storageManager: false,

      panels: {
        defaults: [],
      },
      blockManager: {
        appendTo: ".panel__blocks",
      },
      styleManager: {
        appendTo: ".panel__style",
      },
      layerManager: {
        appendTo: ".panel__layers",
      },
      plugins: [gjsBasicBlocks, gjsForms, gjsWebsite],
    });

    editorRef.current.Commands.run("open-blocks");
  }, []);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const renderPanel = () => {
    if (collapsed) return null;
    switch (activePanel) {
      case "blocks":
        return <div className="panel__blocks" style={styles.panelContent} />;
      case "style":
        return <div className="panel__style" style={styles.panelContent} />;
      case "layers":
        return <div className="panel__layers" style={styles.panelContent} />;
      default:
        return null;
    }
  };

  const buttons = [
    { id: "blocks", icon: "th-large", tooltip: "Blocks" },
    { id: "style", icon: "paint-brush", tooltip: "Style Manager" },
    { id: "layers", icon: "layer-group", tooltip: "Layers" },
  ];

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      {/* Left Sidebar */}
      <div
        style={{
          width: collapsed ? "60px" : "320px",
          display: "flex",
          flexDirection: "column",
          background: "#f9f9f9",
          borderRight: "1px solid #ddd",
          transition: "width 0.3s",
        }}
      >
        {/* Toggle button */}
        <div style={styles.toggleWrapper}>
          <button onClick={toggleSidebar} style={styles.toggleButton} title="Toggle Sidebar">
            <i className={`fa fa-${collapsed ? "chevron-right" : "chevron-left"}`} />
          </button>
        </div>

        {/* Icons with tooltips */}
        <div style={styles.iconPanel}>
          {buttons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setActivePanel(btn.id)}
              title={collapsed ? btn.tooltip : ""}
              style={{
                ...styles.iconButton,
                backgroundColor: activePanel === btn.id ? "#eaeaea" : "transparent",
              }}
            >
              <i className={`fa fa-${btn.icon}`} />
              {!collapsed && <span style={styles.iconLabel}>{btn.tooltip}</span>}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        {renderPanel()}
      </div>

      {/* GrapesJS Main Canvas */}
      <div style={{ flex: 1 }}>
        <div id="grape-js" style={{ height: "100%" }} />
      </div>
    </div>
  );
};

const styles = {
  toggleWrapper: {
    padding: "8px",
    textAlign: "center",
    borderBottom: "1px solid #ccc",
  },
  toggleButton: {
    border: "none",
    background: "#eaeaea",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  iconPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderBottom: "1px solid #ccc",
  },
  iconButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    margin: "10px 0",
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: "10px",
    transition: "all 0.3s",
  },
  iconLabel: {
    fontSize: "12px",
    marginTop: "4px",
    color: "#333",
  },
  panelContent: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
};

export default GrapesJSEditor;
