import React, { useEffect, useState } from "react";

// item db_column formData setFormData required props

const DynamicRadio = props => {
    const {
        items,
        defaultValue,
        handleChange,
        selectedItem,
        disabled = false,
        required = false,
        mapLabel = "label",
        mapValue = "code",
        classes = {
            main: "",
            input: "",
            label: "",
        },
    } = props;

    const [selectedItems, setSelectedItems] = useState("");

    useEffect(() => {
        const item = makeSelectedItem(selectedItem, defaultValue);
        setSelectedItems(item);
    }, [selectedItem]);

    function makeSelectedItem(item, defaultValue = "") {
        let selectedItem = defaultValue;
        if (item) {
            selectedItem = item;
        }
        return selectedItem;
    }

    const onChange = e => {
        const { checked, value } = e.target;
        if (checked) {
            handleChange(value);
        }
    };

    const checked = item => {
        if (item[mapValue]) return selectedItems.includes(item[mapValue]);
    };

    return (
        <div className={`s2a-radiolist ${classes.main ?? ""}`}>
            {items.map((item, index) => (
                <div
                    className="form-check"
                    key={index}>
                    <input
                        disabled={disabled}
                        // className={`${classes.input ?? ""}`}
                        className={`form-check-input ${classes.input ?? ""}`}
                        type="radio"
                        name={item[mapValue]}
                        id={item[mapValue]}
                        value={item[mapValue]}
                        onChange={e => onChange(e)}
                        checked={checked(item)}
                    />
                    <label
                        className={`${classes.label ?? ""} ${
                            required ? "pointer text-danger" : "pointer"
                        }`}
                        htmlFor={item[mapValue]}>
                        {item[mapLabel]}
                    </label>
                </div>
            ))}
        </div>
    );
};

export default DynamicRadio;
