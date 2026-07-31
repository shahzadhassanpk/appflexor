import React from "react";
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
        width="100%",
    } = props;
    const multiSelect =
        isMulti === true || isMulti === "true" || isMulti === "YES";
    const hasEmptyOption = options.some(
        option =>
            option?.[fieldValue] === "" ||
            option?.[fieldValue] === null ||
            option?.[fieldValue] === undefined,
    );
    const emptyOption = {
        label: placeholder,
        value: "",
        [fieldLabel]: placeholder,
        [fieldValue]: "",
    };
    const optionsWithEmptyLabel = options.map(option =>
        option?.[fieldValue] === "" ||
        option?.[fieldValue] === null ||
        option?.[fieldValue] === undefined
            ? { ...option, label: placeholder, [fieldLabel]: placeholder }
            : option,
    );
    const selectOptions =
        !multiSelect && !hasEmptyOption
            ? [emptyOption, ...optionsWithEmptyLabel]
            : optionsWithEmptyLabel;

    const findCurrentOption = selected => {
        if (!selected || typeof selected !== "object") return null;

        const selectedValue = selected[fieldValue];
        if (selectedValue === undefined || selectedValue === null) return null;

        return (
            selectOptions.find(
                option =>
                    String(option?.[fieldValue]) === String(selectedValue),
            ) || selected
        );
    };

    const externalValue = multiSelect
        ? (Array.isArray(selectedOptions) ? selectedOptions : [])
              .map(findCurrentOption)
              .filter(Boolean)
        : findCurrentOption(selectedOption);
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
            zIndex: 9999,
        }),
        menuPortal: base => ({
            ...base,
            zIndex: 9999,
        }),
    };

    if (withIcons) {
        return (
            <Select
                placeholder={placeholder}
                onChange={handleChange}
                getOptionLabel={option => {
                    if (fieldLabel) return option[fieldLabel];
                    return option.label;
                }}
                getOptionValue={option => {
                    if (fieldValue) return option[fieldValue];
                    return option.value;
                }}
                value={externalValue}
                options={selectOptions}
                isMulti={multiSelect}
                isDisabled={disabled}
                styles={colourStyles}
                isSearchable={isSearchable}
                components={{ Option: IconOption }}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
            />
        );
    }

    return (
        <>
        <Select
            placeholder={placeholder}
            onChange={handleChange}
            getOptionLabel={option => {
                if (fieldLabel) return option[fieldLabel];
                return option.label;
            }}
            getOptionValue={option => {
                if (fieldValue) return option[fieldValue];
                return option.value;
            }}
            value={externalValue}
            options={selectOptions}
            isMulti={multiSelect}
            isDisabled={disabled}
            styles={colourStyles}
            isSearchable={isSearchable}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            menuShouldScrollIntoView={false}
        />
        </>
    );
}

export default ReactSelect;
