import React from "react";
import Scroll from "../Scroll/Scroll";

const OffCanvas = props => {
    const { header, id, children } = props;
    return (
        <>
            <div
                style={{
                    backgroundColor: "var(--primary-color)",
                    border: "1px solid var(--border-color)",
                }}
                className="offcanvas offcanvas-top"
                tabindex="-1"
                id={id}
                aria-labelledby={header}>
                <div className="offcanvas-header">
                    <h5
                        className="offcanvas-title"
                        id={header}>
                        {header}
                    </h5>
                    <span
                        type="button"
                        className=""
                        data-bs-dismiss="offcanvas"
                        aria-label="Close">
                        <span className="fas fa-close"></span>
                    </span>
                </div>
                <Scroll height="100%">
                    <div className="p-3">{children}</div>
                </Scroll>
            </div>
        </>
    );
};

export default OffCanvas;
