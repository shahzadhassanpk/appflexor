import React, { createRef, useEffect, useState } from "react";

const MIN_WIDTH = 250;
const MAX_WIDTH = 500;

const LeftPane = ({ children, leftWidth, setLeftWidth }) => {
    const leftRef = createRef();

    useEffect(() => {
        if (leftRef.current) {
            if (!leftWidth) {
                setLeftWidth(MIN_WIDTH);
                return;
            }

            leftRef.current.style.width = `${leftWidth}px`;
        }
    }, [leftRef, leftWidth, setLeftWidth]);

    return <div ref={leftRef}>{children}</div>;
};

export const SplitView = ({ left, right, className }) => {
    const [leftWidth, setLeftWidth] = useState(undefined);
    const [separatorXPosition, setSeparatorXPosition] = useState(undefined);
    const [dragging, setDragging] = useState(false);

    const splitPaneRef = createRef();

    const onMouseDown = e => {
        setSeparatorXPosition(e.clientX);
        setDragging(true);
    };

    const onTouchStart = e => {
        setSeparatorXPosition(e.touches[0].clientX);
        setDragging(true);
    };

    const onMove = clientX => {
        if (dragging && leftWidth && separatorXPosition) {
            const newLeftWidth = leftWidth + clientX - separatorXPosition;
            setSeparatorXPosition(clientX);

            if (newLeftWidth < MIN_WIDTH) {
                setLeftWidth(MIN_WIDTH);
                return;
            }

            if (newLeftWidth > MAX_WIDTH) {
                setLeftWidth(MAX_WIDTH);
                return;
            }

            if (splitPaneRef.current) {
                const splitPaneWidth = splitPaneRef.current.clientWidth;
                if (newLeftWidth > splitPaneWidth - MIN_WIDTH) {
                    setLeftWidth(splitPaneWidth - MIN_WIDTH);
                    return;
                }
            }

            setLeftWidth(newLeftWidth);
        }
    };

    const onMouseMove = e => {
        e.preventDefault();
        onMove(e.clientX);
    };

    const onTouchMove = e => {
        onMove(e.touches[0].clientX);
    };

    const onMouseUp = () => {
        setDragging(false);
    };

    React.useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    });

    return (
        <div
            className={`splitView ${className ?? ""}`}
            ref={splitPaneRef}>
            <div className="leftPane">
                <LeftPane
                    leftWidth={leftWidth}
                    setLeftWidth={setLeftWidth}>
                    {left}
                </LeftPane>
            </div>
            <div
                className="divider-hitbox"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchEnd={onMouseUp}>
                <div className="divider" />
            </div>
            <div className="rightPane d-flex">{right}</div>
        </div>
    );
};
