import React from "react";

const TextField = props => {
    const {
        type = "text",
        label,
        name = "text",
        value,
        onChange,
        placeholder = `Enter your ${props.name}`,
        classes = { label: "", input: "", input_parent: "" },
        errors,
        ...rest
    } = props;
    return (
        <div className="mb-2">
            {label && (
                <label
                    htmlFor={label}
                    className={`form-label ${classes?.label ?? ""}`}>
                    {label}
                </label>
            )}
            <div className={classes?.input_parent ?? ""}>
                <input
                    placeholder={placeholder}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`form-control form-control-sm ${
                        classes?.input ?? ""
                    }`}
                    {...rest}
                />
                <div className="text-danger">{errors?.label}</div>
            </div>
        </div>
    );
};

export default TextField;
