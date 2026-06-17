import React from "react";

export default function Scroll(props) {
    const { children, width, height } = props;
    return (
        <div className="s2a-sites s2a-border p-1 ps-0">
            <div className="sites-list enable-scroll scroll-y">{children}</div>
        </div>
    );
}
