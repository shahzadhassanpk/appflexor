import { useEffect, useState } from "react";
import { filterArrayByTerms } from "../../utils/utils";

function SearchItem(props) {
    const {
        keysToSearch,
        items,
        setItems,
        placeholder,
        _items,
        searchInput: searchRef,
    } = props;
    const [input, setInput] = useState("");

    useEffect(() => {
        if (!input) {
            setItems(_items);
        }else{
            applySearch(input)
        }
    }, [_items]);

    function handleSearch(e) {
        const { value } = e.target;
        setInput(value || "");
        applySearch(value);        
    }

    function applySearch(value){
        const result = filterArrayByTerms(
            _items,
            value.toLowerCase(),
            keysToSearch,
        );
        value?.length > 0 ? setItems(result) : setItems(_items);
    }

    return (
        <div className="search-component mb-2 s2a-searching">
            {/* <i className="fa fa-eye search-icon"></i> */}
            <input
                ref={searchRef}
                type="text"
                className="form-control"
                value={input}
                onChange={handleSearch}
                placeholder={placeholder}
            />
        </div>
    );
}

export default SearchItem;
