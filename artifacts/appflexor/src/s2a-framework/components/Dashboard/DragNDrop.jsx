import { DndProvider, createDndContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import React, { useRef } from "react";
import Container from "../../modules/page/Page";
import "./style.css";

function DragNDrop() {
    const RNDContext = createDndContext(HTML5Backend);
    const manager = useRef(RNDContext);

    return (
        <div className="app-dashboard">
            <DndProvider manager={manager.current.dragDropManager}>
                <Container />
            </DndProvider>
        </div>
    );
}
export default DragNDrop;
