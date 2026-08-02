import React from "react";
import "./Loading/loading.css";

function GlobalLoader() {
    return (
        <div className="s2a-global-loader" role="status" aria-label="Loading application">
            <div className="s2a-global-loader__ring" aria-hidden="true" />
        </div>
    );
}

export default GlobalLoader;
