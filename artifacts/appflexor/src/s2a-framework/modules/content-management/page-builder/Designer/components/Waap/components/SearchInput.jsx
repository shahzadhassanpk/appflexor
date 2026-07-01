import iconMap from "./DropDown/icons";

const SearchInput = (props) => {
  const { name, value, onChange } = props;

  return (
    <div className="input-group mb-3">
      <span className="input-group-text" id="basic-addon1">
        {iconMap.search}
      </span>
      <input
        type="text"
        className="form-control"
        placeholder="search..."
        aria-label="search"
        aria-describedby="basic-addon1"
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchInput;
