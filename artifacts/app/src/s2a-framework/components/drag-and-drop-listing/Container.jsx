import React, { useCallback } from "react";

export const Container = props => {
    const { children } = props;
    const renderCard = useCallback(children => {
        return { children };
    }, []);

    return (
        <div className="s2a-drag-drop-container">{renderCard(children)}</div>
    );
};
