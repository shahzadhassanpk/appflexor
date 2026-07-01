export default function SelectComponent(props) {
    const {
        label,
        name,
        value,
        handleBlur = () => null,
        handleInputDimension = () => null,
        items,
        required,
        disabled,
    } = props;

    const handleInput = e => {
        handleInputDimension(e);
    };

    return (
        <>
            <label
                htmlFor={name}
                className="col-form-label s2a-analytic-modal">
                {label}
            </label>
            <select
                className={disabled ? "form-select opacity-50" : "form-select"}
                id={name}
                name={name}
                value={value}
                required={required ? required : false}
                title={disabled && "Enter sql first"}
                onBlur={handleBlur}
                disabled={disabled}
                onChange={handleInput}>
                <option value="">Default Option</option>
                {items &&
                    items?.map((item, index) => {
                        return (
                            <option
                                key={index}
                                value={item}>
                                {item.name}
                            </option>
                        );
                    })}
            </select>
        </>
    );
}
