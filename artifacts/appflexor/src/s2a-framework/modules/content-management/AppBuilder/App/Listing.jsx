import React from "react";
import { useContext } from "react";
import AppBuilderContext from "./AppBuilderContext";
import { getData, handleDelete } from "./helpers";
import { API_URL } from "../../../../Config";
import ModalBox from "../../../../components/Modal/Modal";

export default function Listing(props) {
    const {
        items,
        handleEdit,
        selectedId,
        setSelectedId,
        show,
        setShow,
        deleteItem,
        showButton,
        property,
        selectedClassName,
    } = props;

    const handleSelected = item => {
        setSelectedId(item.id);
    };

    if (items && items.length > 0 && typeof items === "object")
        return (
            <div>
                {show && (
                    <ModalBox
                        header={show?.item?.title}
                        message={`Are you show to delete this ${show?.item?.title}?`}
                        state={show}
                        setState={setShow}
                        operation={deleteItem}
                        modalType="app_builder"
                    />
                )}
                <ul className="list-group app__listing">
                    {items?.map((item, index) => {
                        return (
                            <li
                                key={index}
                                onClick={() => handleSelected(item)}
                                className={`list-group-item d-flex justify-content-between ${
                                    item.id === selectedId
                                        ? selectedClassName
                                        : ""
                                }`}>
                                <span>{item[property]}</span>
                                {showButton && (
                                    <span>
                                        <i
                                            className="fa-regular fa-pen-to-square me-2 cursor-pointer"
                                            onClick={() =>
                                                handleEdit(item)
                                            }></i>
                                        <i
                                            className="fa-regular fa-trash-can table-del-font"
                                            onClick={() =>
                                                deleteItem(item)
                                            }></i>
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
}
