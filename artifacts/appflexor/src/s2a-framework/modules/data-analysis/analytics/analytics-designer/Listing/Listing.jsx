import React from "react";
import "../styles.css";

export default function Listing(props) {
    const {
        items,
        handleSelectedItemId,
        handleEdit,
        handleDelete,
        duplicate,
        flag,
        className,
        index = "",
        selectForExport,
        ids = {},
    } = props;
    return (
        <ul className="s2a-analytic-list analytics-list list-group list-group-flush s2a-border enable-scroll">
            {items &&
                items.length > 0 &&
                items.map(item => {
                    return (
                        <li
                            key={item.id}
                            className={
                                item["id"] === index["id"]
                                    ? `list-group-item list-item-active mt-1`
                                    : `list-group-item mt-1 list-item-hover`
                            }
                            onClick={e => handleSelectedItemId(item, e)}>
                            <div className="index analytics-list-item">
                                <div className="col text-truncate index-title align-items-center">
                                    {flag == "index" && (
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-2"
                                            checked={
                                                ids[item?.id] ? true : false
                                            }
                                            onClick={e =>
                                                selectForExport(
                                                    item,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    )}
                                    <i className={className}></i>
                                    {flag === "index" && item.title}
                                    {flag === "dim" &&
                                        `${item.key} as ${item.label}`}
                                    {flag === "measure" &&
                                        `${item.key} as ${item.label}`}
                                </div>
                                <div className="col-sm-1 index-settings dropdown">
                                    <div
                                        type="button"
                                        className="fa-solid fa-ellipsis-vertical padding-for-setting px-2"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"></div>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <span
                                                className="dropdown-item"
                                                title="Edit"
                                                onClick={() =>
                                                    handleEdit(item)
                                                }>
                                                <i className="fa fa-pen"></i>
                                                Edit
                                            </span>
                                        </li>
                                        {flag === "index" && (
                                            <li>
                                                <span
                                                    className="dropdown-item"
                                                    title="Duplicate"
                                                    onClick={() =>
                                                        duplicate(item)
                                                    }>
                                                    <i className="fa-regular fa-clone"></i>
                                                    Duplicate
                                                </span>
                                            </li>
                                        )}
                                        <li>
                                            <span
                                                className="dropdown-item dropdown-item-del"
                                                title="Delete"
                                                onClick={() =>
                                                    handleDelete(item)
                                                }>
                                                <i className="fa-regular fa-trash-can"></i>
                                                Delete
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </li>
                    );
                })}
        </ul>
    );
}
