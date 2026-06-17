import { useDrag } from "react-dnd";
import { makeid } from "../../../../../utils/utils";

const SideBarItem = ({ sideBarItem }) => {
    // console.log(sideBarItem, "side");
    if (sideBarItem["id"] === undefined) {
        sideBarItem.id = `${makeid(8)}`;
    }

    if (sideBarItem["path"] === undefined) {
        sideBarItem.path = "";
    }

    if (sideBarItem["isValid"] === undefined) {
        sideBarItem.isValid = "";
    }

    if (sideBarItem.component["props"] === undefined) {
        sideBarItem.component.props = [];
    }

    if (sideBarItem.component["icon"] === undefined) {
        sideBarItem.component.icon = "fa-solid fa-code";
    }
    if (sideBarItem.component["title"] === undefined) {
        sideBarItem.component.title = "";
    }

    if (sideBarItem.component["data"] === undefined) {
        sideBarItem.component.data = {
            label: "",
            db_column: "",
            value: "",
        };
    }

    const [{ opacity }, dragRef] = useDrag({
        item: sideBarItem,
        type: sideBarItem.type,
        collect: monitor => {
            return {
                opacity: monitor.isDragging() ? 0.4 : 1,
            };
        },
    });

    return (
        <div
            className="sideBarItem s2a-border grab rounded p-2"
            ref={dragRef}
            style={{ opacity }}>
            {sideBarItem.component.icon && (
                <span className={sideBarItem.component.icon}></span>
            )}
            &nbsp;
            {sideBarItem.component.title}
        </div>
    );
};

export default SideBarItem;
