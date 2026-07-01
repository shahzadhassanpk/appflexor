import React, { useEffect } from "react";
import Select, { components } from "react-select";

/**
 * Each object in array must have a label and value field if not then provide fieldLabel and fieldValue
 * Selected option must have same data structure as list array
 *
 * @param { placeholder, options, selectedOption, handleChange, fieldLabel, fieldValue }
 * @returns { selectedOption }
 */
const { Option } = components;

const IconOption = props => (
    <Option {...props} >
        <i
            className={props.data.icon}
            style={{ minWidth: 20 }}
            alt={props.data.label}
        />
        {props.data.label}
    </Option>
);

function ReactSelect(props) {
    const {
        placeholder = "Select Item",
        options = [],
        selectedOption = {},
        selectedOptions = [],
        handleChange,
        fieldLabel = "label",
        fieldValue = "value",
        isMulti = false,
        disabled = false,
        withIcons = false,
        isSearchable = true,
        width = "100%",
    } = props;
    const colourStyles = {
        container: provider => ({
            ...provider,
            width: width,
        }),
        option: (styles, props) => {
            const { data, isFocused, isDisabled, isSelected } = props;
            if (isDisabled) {
                return {
                    ...styles,
                    backgroundColor: "var(--secondary-color)",
                    color: "gray",
                    width: "100%",
                };
            }

            return {
                ...styles,
                minWidth: "100%", // Ensure options take full width
                backgroundColor: isFocused ? "var(--secondary-color)" : null,
                color: data?.mandatory === "true" ? "red" : "var(--font-color)",
                whiteSpace: "nowrap", // Prevent text from wrapping in options
                ":hover": { textDecoration: "underline" },
            };
        },
        input: base => ({
            ...base,
            color: "var(--font-color)",
        }),
        menuList: base => ({
            ...base,
            "::-webkit-scrollbar": {
                width: "6px",
                height: "0px",
            },
            "::-webkit-scrollbar-track": {
                background: "none",
            },
            "::-webkit-scrollbar-thumb": {
                background: "var(--primary-color)",
                borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
                background: "var(--secondary-color)",
                borderRadius: "4px",
            },
            background: "var(--primary-color)",
            boxShadow: "0 0 10px 2px #ffffff26, 0 0 0 1px var(--shadow-color)",
        }),
        menu: provided => ({
            ...provided,
            whiteSpace: 'nowrap',
            position: "absolute", // Absolute positioning
            width: "100%", // Automatically adjust width based on content
            left: "0", // Position to the left edge of the select box
            right: "auto", // Prevent it from overflowing the container
            transform: "translateX(0)", // Ensures it’s aligned with the select box
        }),
    };

    if (withIcons) {
        return (
            <Select
                placeholder={placeholder}
                onChange={(newValue, action) => handleChange(newValue, action)}
                getOptionLabel={option => {
                    if (fieldLabel) return option[fieldLabel];
                    return option.label;
                }}
                getOptionValue={option => {
                    if (fieldValue) return option[fieldValue];
                    return option.value;
                }}
                value={isMulti ? selectedOptions : selectedOption}
                options={options}
                isDisabled={disabled}
                styles={colourStyles}
                isSearchable={isSearchable}
                components={{ Option: IconOption }}
            />
        );
    }

    return (
        <>
            <Select
                placeholder={placeholder}
                onChange={(newValue, action) => handleChange(newValue, action)}
                getOptionLabel={option => {
                    if (fieldLabel) return option[fieldLabel];
                    return option.label;
                }}
                getOptionValue={option => {
                    if (fieldValue) return option[fieldValue];
                    return option.value;
                }}
                value={isMulti ? selectedOptions : selectedOption}
                options={options}
                isMulti={isMulti}
                isDisabled={disabled}
                styles={colourStyles}
                isSearchable={isSearchable}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={{
                    ...colourStyles,
                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                    }),
                    menu: (base) => ({
                        ...base,
                        zIndex: 9999,
                    }),
                }}
            />
        </>
    );
}

export default ReactSelect;
