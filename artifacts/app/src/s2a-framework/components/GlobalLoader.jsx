import React from "react";

function GlobalLoader() {
    return (
        <div
            style={{
                position: "fixed",
                inset: "50%",
            }}>
            <span
                className="spinner-border text-light"
                role="status"></span>
        </div>
    );
}

export default GlobalLoader;
