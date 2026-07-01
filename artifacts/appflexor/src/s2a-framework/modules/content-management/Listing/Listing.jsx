import update from "immutability-helper";
import React, { useCallback } from "react";
import MoveableListing from "../DndWrapper/MoveableListing";

export default function Listing({
    items,
    editItem,
    deleteData,
    setSelectedItemId,
    selectedItemId,
    mode,
    domain,
    setItems,
    setShowSiteModal,
    canDrag,
    handleSelectedItems,
}) {
    let dragItem = {};
    let hoverItem = {};
    const moveCard = useCallback(
        (dragIndex, hoverIndex) => {
            setItems(prevState => {
                dragItem = prevState[dragIndex];
                hoverItem = prevState[hoverIndex];

                return update(prevState, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, prevState[dragIndex]],
                    ],
                });
            });
        },
        [items, setItems],
    );

    const renderMoveableListing = useCallback(
        (
            item,
            index,
            selectedItemId,
            deleteData,
            editItem,
            mode,
            setSelectedItemId,
            items,
            canDrag,
            setItems,
        ) => {
            return (
                <MoveableListing
                    key={item.id}
                    index={index}
                    id={item.id}
                    item={item}
                    domain={domain}
                    moveCard={moveCard}
                    selectedItemId={selectedItemId}
                    deleteData={deleteData}
                    editItem={editItem}
                    setShowSiteModal={setShowSiteModal}
                    mode={mode}
                    setSelectedItemId={setSelectedItemId}
                    dragItem={dragItem}
                    hoverItem={hoverItem}
                    canDrag={canDrag}
                    items={items}
                    setItems={setItems}
                    handleSelectedItems={handleSelectedItems}
                />
            );
        },
        [],
    );

    return (
        <div className="s2a-border p-1 ps-0">
            <ul className="sites-list list-group list-group-flush enable-scroll scroll-y">
                {items.map((item, i) =>
                    renderMoveableListing(
                        item,
                        i,
                        selectedItemId,
                        deleteData,
                        editItem,
                        mode,
                        setSelectedItemId,
                        items,
                        canDrag,
                        setItems,
                        handleSelectedItems,
                    ),
                )}
            </ul>
        </div>
    );
}
