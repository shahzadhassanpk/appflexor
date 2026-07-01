import React from "react";

const OffCanvasBtn = props => {
    const { children, id } = props;
    return (
        <div
            className=""
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target={`#${id}`}
            aria-controls={`${id}`}>
            {children}
        </div>
    );
};

export default OffCanvasBtn;
