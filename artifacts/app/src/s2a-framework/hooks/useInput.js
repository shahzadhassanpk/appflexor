import { useState } from "react";

const useInput = ({ defaultValues, rules }) => {
    const [values, setValues] = useState(defaultValues || {});
    const [errors, setErrors] = useState({});

    const handleOnChange = (event, val) => {
        const { value, name } = event?.target;

        if (val) {
            setValues({ ...values, [name]: val });
        } else {
            setValues({ ...values, [name]: value });
        }
        if (rules) {
            const fn = rules[name];
            if (fn) {
                const error = fn(value ? value : val);
                setErrors({ ...errors, [name]: error });
            }
        }
    };

    const validateValues = () => {
        const _errors = {};
        let valid = true;
        for (let key in values) {
            const fn = rules[key];
            if (fn) {
                const errorMessage = fn(values[key]);
                _errors[key] = errorMessage;
                if (errorMessage) {
                    valid = false;
                }
            }
        }
        setErrors({ ...errors, ..._errors });
        return valid;
    };

    return {
        values,
        handleOnChange,
        setValues,
        errors,
        setErrors,
        validateValues,
    };
};

export default useInput;
