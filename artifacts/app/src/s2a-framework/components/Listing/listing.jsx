import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Listing = props => {
    const {
        items,
        keys,
        setSelectedItem,
        selectedItemValue,
        getSelectedItems,
        handleDelete,
        handleEdit,
        handleCopy,
        handleItemConfig,
        ulClass,
        type,
    } = props;

    const [selectedItems, setSelectedItems] = useState([]);

    const handleSelect = (e, item) => {
        if (
            !e.target.closest(".fa-regular") &&
            !e.target.closest(".form-check-input")
        ) {
            setSelectedItem(item);
        }
    };

    const handleChange = e => {
        const { value } = e.target;
        const index = selectedItems.findIndex(item => item === value);
        if (index === -1) {
            const items = [...selectedItems, value];
            setSelectedItems(items);
            getSelectedItems(items);
        } else {
            const items = selectedItems.filter(item => item !== value);
            setSelectedItems(items);
            getSelectedItems(items);
        }
    };

    if (items && JSON.stringify(items) !== "[]" && items.length)
        return (
            <ul
                className={`s2a-listing ${
                    ulClass ? ulClass : "list-group items-listing"
                }`}>
                {items.map((item, itemIndex) => {
                    return keys.map((key, index) => {
                        const { label, code } = key;
                        return (
                            <li
                                onClick={
                                    setSelectedItem
                                        ? e => handleSelect(e, item)
                                        : null
                                }
                                key={index}
                                title={item[label]}
                                className={`flex-between list-group-item ${
                                    selectedItemValue === item[code]
                                        ? "selected-item"
                                        : ""
                                }`}
                                aria-current="true">
                                <div className="list-item">
                                    {getSelectedItems && (
                                        <span className="me-1">
                                            <input
                                                className="form-check-input"
                                                type={"checkbox"}
                                                value={item[code]}
                                                name={item[label]}
                                                checked={selectedItems.includes(
                                                    item[code],
                                                )}
                                                onChange={handleChange}
                                            />
                                        </span>
                                    )}
                                    <span className="list-item-label">
                                        {item[label]}
                                    </span>
                                </div>
                                {(handleDelete || handleCopy || handleEdit) && (
                                    <div className="dropdown">
                                        <i
                                            className="fa-solid fa-ellipsis-vertical show-hide-button p-2"
                                            type="button"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"></i>
                                        <ul className="dropdown-menu">
                                            {handleEdit && (
                                                <li>
                                                    <span
                                                        className="py-1 dropdown-item"
                                                        title="Edit"
                                                        onClick={e =>
                                                            handleEdit(item)
                                                        }>
                                                        <i className="table-edit-font fa-regular fa-edit"></i>
                                                    </span>
                                                </li>
                                            )}
                                            {handleItemConfig && (
                                                <li
                                                    className="dropdown-item"
                                                    onClick={() =>
                                                        handleItemConfig(item)
                                                    }>
                                                    <span className="fa-solid fa-eye me-2 py-1 default-fontsize"></span>
                                                    <span className="default-fontsize">
                                                        View Constraint
                                                    </span>
                                                </li>
                                            )}
                                            {handleCopy && (
                                                <CopyToClipboard
                                                    text={item.code}
                                                    onCopy={() =>
                                                        handleCopy(item)
                                                    }>
                                                    <li className="dropdown-item">
                                                        <span className="fas fa-copy me-2 py-1 default-fontsize"></span>
                                                        <span className="default-fontsize">
                                                            Copy Name {item[label]}
                                                        </span>
                                                    </li>
                                                </CopyToClipboard>
                                            )}
                                            {handleDelete && (
                                                <li>
                                                    {item.delDisabled ? (
                                                        <div
                                                            className="opacity-50 py-1 dropdown-item"
                                                            title="Reserved, delete not allowed">
                                                            <i className="table-del-font fa-regular fa-trash-can default-fontsize"></i>
                                                            <span className="default-fontsize">
                                                                Drop{" "}
                                                                {item[label]}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="py-1 dropdown-item"
                                                            title="Drop"
                                                            onClick={e =>
                                                                handleDelete(
                                                                    item,
                                                                )
                                                            }>
                                                            <i className="table-del-font fa-regular fa-trash-can default-fontsize"></i>
                                                            <span className="default-fontsize">
                                                                Drop{" "}
                                                                {item[label]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        );
                    });
                })}
            </ul>
        );
};

export default Listing;
