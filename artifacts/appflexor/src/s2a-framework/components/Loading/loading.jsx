import React from "react";
import "./loading.css";

const Loading = () => (
    <div className="s2a-loader" role="status" aria-label="Loading">
        <svg className="s2a-loader__svg" viewBox="0 0 50 50" aria-hidden="true">
            <circle className="s2a-loader__track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            <circle className="s2a-loader__arc"   cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
        </svg>
    </div>
);

export default Loading;
