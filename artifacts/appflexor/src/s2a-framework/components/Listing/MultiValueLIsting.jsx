import React from "react";

const MultiValueListing = props => {
    const { items, keys } = props;
    return (
        <div>
            {items.map(item => (
                <div className="">
                    {keys.map(key => (
                        <div>{item[key]}</div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MultiValueListing;
