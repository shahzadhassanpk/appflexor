import React, { useEffect, useState } from "react";

const DynamicCheckBoxs = props => {
    const {
        items,
        handleChange,
        selectedItem,
        classes = {
            main: "",
            input: "",
            label: "",
        },
        disabled = false,
        required = false,
        mapLabel = "label",
        mapValue = "code",
    } = props;

    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        let item = makeSelectedItem(selectedItem);
        if (!item) {
            setSelectedItems([]);
        } else {
            setSelectedItems(item.split(";"));
        }
    }, [selectedItem]);

    const onChange = e => {
        const { checked, id } = e.target;
        let items;

        if (checked) {
            items = [...selectedItems];
            items.push(id);
            setSelectedItems(items);
        } else {
            items = selectedItems.filter(item => item !== id);
            setSelectedItems(items);
        }
        handleChange(items.join(";"), e);
    };

    function makeSelectedItem(item) {
        let selectedItem = "";
        if (item) {
            selectedItem = item;
        }
        return selectedItem;
    }

    return (
        <div className={`s2a-checkboxelist ${classes.main ?? ""}`}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`form-check ${classes.input ?? ""}`}>
                    <input
                        disabled={disabled}
                        className={`form-check-input`}
                        type="checkbox"
                        name={item[mapValue]}
                        id={item[mapValue]}
                        value={item[mapValue]}
                        onChange={e => onChange(e)}
                        checked={selectedItems.includes(item[mapValue])}
                    />
                    <label
                        className={`${classes.label ?? ""} ${
                            required ? "pointer text-danger" : "pointer"
                        }`}
                        htmlFor={item[mapValue]}>
                        {item[mapLabel] || ""}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default DynamicCheckBoxs;
