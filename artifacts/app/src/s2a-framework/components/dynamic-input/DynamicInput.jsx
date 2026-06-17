import React, { useEffect, useState } from "react";

const DynamicInput = props => {
    const {
        type,
        label,
        db_column,
        formData,
        setFormData,
        customInputHandler,
        required = false,
    } = props;

    const [validity, setValidity] = useState(false);

    useEffect(() => {
        if (required && formData[db_column].length === 0) {
            setValidity(true);
        }
    }, []);

    useEffect(() => {
        if (required && formData[db_column].length === 0) {
            setValidity(true);
        }
    }, [required]);

    const handleInput = e => {
        const { value, name } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (value.length === 1) {
            setValidity(false);
        } else if (value.length < 1) {
            setValidity(true);
        }
    };

    return (
        <div className="input s2a-input">
            <label
                htmlFor={label}
                className={
                    validity && !db_column === "icon"
                        ? "mb-1 text-capitalize fw-bold flex-between text-danger"
                        : "mb-1 text-capitalize fw-bold"
                }>
                <span>{label}</span>
                {validity && !db_column === "icon" && (
                    <span>{label} is required</span>
                )}
            </label>
            <input
                type={type ? type : "text"}
                className={
                    validity && !db_column === "icon"
                        ? "form-control invalid-input"
                        : "form-control"
                }
                name={db_column}
                value={formData[db_column]}
                onChange={setFormData ? handleInput : customInputHandler}
            />
        </div>
    );
};

export default DynamicInput;
