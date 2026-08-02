import React from "react";
import "./Loading/loading.css";

function GlobalLoader() {
    return (
        <div className="s2a-global-loader" role="status" aria-label="Loading application">
            <svg className="s2a-global-loader__svg" viewBox="0 0 50 50" aria-hidden="true">
                <circle className="s2a-global-loader__track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                <circle className="s2a-global-loader__arc"   cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
        </div>
    );
}

export default GlobalLoader;
