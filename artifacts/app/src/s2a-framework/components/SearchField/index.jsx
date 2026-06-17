const SearchField = props => {
    const {
        type = "text",
        label,
        name = "text",
        value,
        onChange,
        placeholder = `Enter your ${props.name}`,
        classes = { label: "", input: "", input_parent: "" },
    } = props;
    return (
        <div className="mb-3 search-field">
            {label && (
                <label
                    htmlFor={label}
                    className={`form-label search-label ${
                        classes?.label ?? ""
                    }`}>
                    {label}
                </label>
            )}
           
        </div>
    );
};

export default SearchField;
