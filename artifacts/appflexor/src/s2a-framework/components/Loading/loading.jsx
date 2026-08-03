import React from "react";
import "./loading.css";

const Loading = () => (
    <div className="d-flex align-items-center justify-content-center" role="status" aria-label="Loading">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    </div>
);

export default Loading;
