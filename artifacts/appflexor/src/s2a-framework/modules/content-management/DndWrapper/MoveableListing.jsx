import axios from "axios";
import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { API_URL } from "../../../Config";
import { ItemTypes } from "./ItemsType";
import { getSelectedItem } from "../../../components/CrudApiCall";

export default function MoveableListing({
    item,
    selectedItemId,
    deleteData,
    editItem,
    mode,
    setSelectedItemId,
    id,
    moveCard,
    index,
    canDrag,
    items,
    setItems,
    setShowSiteModal,
    handleSelectedItems,
}) {
    const ref = useRef(null);

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
            console.log(dragIndex, hoverIndex, "indexes");
            if (dragIndex === hoverIndex) {
                return;
            }
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            moveCard(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        canDrag: canDrag,
        item: () => {
            return { id, index };
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
            if (monitor.didDrop()) {
                handleUpdatePostion();
            }
        },
    });

    function handleUpdatePostion() {
        let Items = structuredClone(items);
        Items.forEach((linkItem, linkIndex) => {
            linkItem.position = linkIndex;
        });
        let request = multiRequestMaker(Items);
        handleSave(request);
    }

    function multiRequestMaker(dragAndDropArray) {
        let accessForm = {};
        accessForm.data = [];
        dragAndDropArray.forEach(item => {
            let dragAndDropObject = {
                formId: mode === "menu" ? "app_menu" : "app_link",
                action: "update",
                formData: item,
                id: item.id,
                entity: mode === "menu" ? "app_menu" : "app_link",
            };
            accessForm.data.push(dragAndDropObject);
        });
        console.log(accessForm);
        return accessForm;
    }

    function handleSave(request) {
        let url = API_URL + "?service.key=update.formData";
        try {
            axios.post(url, request).then(response => {
                if (response.status === 200) {
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    const editFun = async () => {
        setShowSiteModal(true);
        editItem(item);
    };

    return (
        <>
            <li
                ref={ref}
                key={id}
                className={`${
                    item.id === selectedItemId
                        ? `list-group-item list-item-active mt-1`
                        : `list-group-item mt-1 list-item-hover`
                }`}>
                <div className="sites-list-item">
                    <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={item.selected ? true : false}
                        onChange={e =>
                            handleSelectedItems(item, items, e.target.checked)
                        }
                    />
                    <div
                        className="col channel-title"
                        onClick={() => setSelectedItemId(item.id)}>
                        <div className="col-sm-12">
                            {mode === "site" ? item.brand_title : item.name}
                        </div>
                        <div className="col-sm-12">
                            {mode === "site" ? (
                                <span>{`${item.domain}`}</span>
                            ) : mode === "menu" ? (
                                item.location +
                                " | " +
                                (item.access ? item.access : "PROTECTED")
                            ) : (
                                item.type
                            )}
                        </div>
                    </div>
                    <div className="col-sm-1">
                        <div className="setting-button dropdown">
                            <span
                                type="button"
                                className="fa-solid fa-ellipsis-vertical show show-hide-button p-2"
                                data-bs-toggle="dropdown"></span>
                            <ul className="dropdown-menu">
                                <li className="">
                                    {mode === "site" ? (
                                        <span
                                            className="dropdown-item without-border"
                                            title="Edit"
                                            onClick={() => editFun()}>
                                            <i className="fa fa-pen"></i>
                                            Edit
                                        </span>
                                    ) : (
                                        <span
                                            className="dropdown-item"
                                            title="Edit"
                                            onClick={() => editItem(item)}
                                            data-bs-toggle="modal"
                                            data-bs-target={`${
                                                mode === "menu"
                                                    ? `#moduleModal`
                                                    : `#feature`
                                            }`}>
                                            <i className="fa fa-pen"></i>
                                            Edit
                                        </span>
                                    )}
                                </li>
                                {mode !== "site" && (
                                    <li className="">
                                        <span
                                            className="dropdown-item dropdown-item-del"
                                            title="Delete"
                                            onClick={() => deleteData(item)}>
                                            <i className="fa-regular fa-trash-can"></i>
                                            Delete
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </li>
        </>
    );
}
