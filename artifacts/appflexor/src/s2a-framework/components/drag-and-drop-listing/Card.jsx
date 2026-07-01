import { useCallback, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "./ItemTypes";

const style = {
    cursor: "move",
};

export const DndCard = props => {
    const { id, index, setItems, children, move = true } = props;
    const ref = useRef(null);

    const moveCard = useCallback(
        (dragIndex, hoverIndex, setCards) => {
            setCards(prevCards => {
                const newCards = [...prevCards];
                const [draggedCard] = newCards.splice(dragIndex, 1);
                newCards.splice(hoverIndex, 0, draggedCard);
                return newCards;
            });
        },
        [setItems],
    );

    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            if (move) moveCard(dragIndex, hoverIndex, setItems);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return { id, index };
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: move,
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return (
        <div
            key={index}
            className="s2a-drag-drop-card"
            ref={ref}
            style={move ? { ...style, opacity } : {}}
            data-handler-id={handlerId}>
            {children}
        </div>
    );
};
