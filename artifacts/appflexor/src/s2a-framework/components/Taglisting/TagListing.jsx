import React from "react";

const TagListing = props => {
    const { items, selectedTags, handleSelection, searchInput, removeTag } =
        props;
    const selectedIcon = item => {
        if (
            selectedTags &&
            selectedTags.length &&
            selectedTags.some(tag => item.id === tag.id)
        ) {
            return <span className="fa-regular fa-circle-check ms-1"></span>;
        }
    };
    if (items && items.length === 0 && searchInput.length > 0)
        return <>No Match Found</>;
    else if (items && items.length > 0)
        return (
            <div className="s2a-taglisting">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="badge my-1 me-2"
                        onClick={() => handleSelection(item)}>
                        {item?.id}
                        {selectedIcon(item)}
                        {removeTag && (
                            <span
                                className="fas fa-close ms-2"
                                onClick={() => handleSelection(item)}></span>
                        )}
                    </div>
                ))}
            </div>
        );
};

export default TagListing;
