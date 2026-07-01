import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function DndWrapper(props) {
    const { children } = props;
    return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

export default DndWrapper;
