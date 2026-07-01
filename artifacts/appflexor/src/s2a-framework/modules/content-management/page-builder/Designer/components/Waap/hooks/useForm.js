import { useState } from "react";

const useForm = (initialValues = {}, validateFn = () => ({})) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field on change (optional)
    const newErrors = validateFn({ ...values, [name]: value });
    setErrors(newErrors);
  };

  const handleSubmit = (callback) => (e) => {
    e?.preventDefault();
    const validationErrors = validateFn(values);
    setErrors(validationErrors);

    for (let key in validationErrors) {
      if (validationErrors[key]?.length > 0) {
        return;
      }
    }

    callback(values);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset,
    setValues,
  };
};

export default useForm;
