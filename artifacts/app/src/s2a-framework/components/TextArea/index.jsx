import React from "react";

const TextArea = props => {
    const {
        label,
        name = "text",
        value,
        onChange,
        rows = 3,
        placeholder = `Enter your ${props.name}`,
        classes = { label: "", input: "", input_parent: "" },
        errors,
        ...rest
    } = props;
    return (
        <div className="mb-3">
            {label && (
                <label
                    htmlFor={label}
                    className={`form-label ${classes?.label ?? ""}`}>
                    {label}
                </label>
            )}
            <div className={classes?.input_parent ?? ""}>
                <textarea
                    rows={rows}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`form-control ${classes?.input ?? ""}`}
                    {...rest}
                />
                <div className="text-danger">{errors?.label}</div>
            </div>
        </div>
    );
};

export default TextArea;
