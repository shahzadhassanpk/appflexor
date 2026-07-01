import { useDrag } from "react-dnd";

const SideBarItem = ({ data }) => {
    // console.log({ data });

    const [{ opacity }, dragRef] = useDrag({
        item: data,
        type: data.type,
        collect: monitor => {
            return {
                opacity: monitor.isDragging() ? 0.4 : 1,
            };
        },
    });

    return (
        <div
            className="sideBarItem s2a-border p-2 mb-2"
            ref={dragRef}
            style={{ opacity }}>
            {data.component.icon && (
                <span className={data.component.icon}></span>
            )}
            &nbsp;
            {data.component.title}
        </div>
    );
};

export default SideBarItem;
