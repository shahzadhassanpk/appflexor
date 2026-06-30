import classNames from "classnames";
import { useState } from "react";
import { useDrop } from "react-dnd";
import { COLUMN, COMPONENT, ROW, SIDEBAR_ITEM } from "./ComponentRegistry";



const DropZone = ({ data, onDrop, isLast, className }) => {
    const ACCEPTS = [SIDEBAR_ITEM, COLUMN, ROW, COMPONENT];
    const [{ isOver, canDrop }, dropRef] = useDrop({
        accept: ACCEPTS,
        collect: (monitor) => {
            return {
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            };
        },
        drop: (item, monitor) => {
            onDrop(data, item);
        },
        canDrop: (item, monitor) => {
            const dropZonePath = data.path;
            const splitDropZonePath = dropZonePath.split("-");
            const itemPath = item.path;

            // sidebar items can always be dropped anywhere
            if (!itemPath) {
                // if (data.childrenCount >= 3) {
                //  return false;
                // }
                return true;
            }

            const splitItemPath = itemPath.split("-");

            // limit columns when dragging from one row to another row
            const dropZonePathRowIndex = splitDropZonePath[0];
            const itemPathRowIndex = splitItemPath[0];
            const diffRow = dropZonePathRowIndex !== itemPathRowIndex;
            if (
                diffRow &&
                splitDropZonePath.length === 2 &&
                data.childrenCount >= 3
            ) {
                return false;
            }

            // Invalid (Can't drop a parent element (row) into a child (column))
            const parentDropInChild =
                splitItemPath.length < splitDropZonePath.length;
            if (parentDropInChild) return false;

            // Current item can't possible move to it's own location
            if (itemPath === dropZonePath) return false;

            // Current area
            if (splitItemPath.length === splitDropZonePath.length) {
                const pathToItem = splitItemPath.slice(0, -1).join("-");
                const currentItemIndex = Number(splitItemPath.slice(-1)[0]);

                const pathToDropZone = splitDropZonePath.slice(0, -1).join("-");
                const currentDropZoneIndex = Number(
                    splitDropZonePath.slice(-1)[0]
                );

                if (pathToItem === pathToDropZone) {
                    const nextDropZoneIndex = currentItemIndex + 1;
                    if (nextDropZoneIndex === currentDropZoneIndex)
                        return false;
                }
            }

            return true;
        },
    });

    const isActive = isOver && canDrop;

    return (
        <div
            ref={dropRef}
            className={classNames(
                "drop-zone-2 text-center",
                { active: isActive, isLast },
                className
            )}
        ></div>
    );
};

export default DropZone;
