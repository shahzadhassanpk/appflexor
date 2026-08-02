import React from "react";
import "./loading.css";

const Loading = ({ message = "Loading content" }) => (
    <div className="s2a-loader" role="status" aria-live="polite">
        <div className="s2a-loader__ring" aria-hidden="true" />
        <div className="s2a-loader__text">
            <p className="s2a-loader__message">{message}</p>
            <p className="s2a-loader__sub">
                Please wait
                <span className="s2a-loader__dots" aria-hidden="true">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </p>
        </div>
    </div>
);

export default Loading;
