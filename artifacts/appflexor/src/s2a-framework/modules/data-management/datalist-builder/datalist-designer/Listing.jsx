import React from "react";
import TagListing from "../../../../components/Taglisting/TagListing";
import { dbTagConversion } from "../../../../utils/utils";

export default function Listing({
    items,
    selectedItem,
    handleSetSelectedDataList,
    deleteData,
    handleSelectedExport,
    cloneDatalist,
}) {
    return (
        <ul className="list-group list-group-flush datalist-listing s2a-datalistbuilder-listing">
            {items &&
                items.length > 0 &&
                items.map((data, index) => {
                    return (
                        <li
                            onClick={e => handleSetSelectedDataList(data, e)}
                            key={index}
                            className={`list-group-item datalist-item cursor-pointer ${
                                selectedItem &&
                                selectedItem["id"] === data["id"]
                                    ? "selected-cell"
                                    : ""
                            }`}>
                            <div className="d-flex">
                                <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={data.selected ? true : false}
                                    onChange={e =>
                                        handleSelectedExport(
                                            data,
                                            e.target.checked,
                                        )
                                    }
                                />
                                <div className="d-flex flex-column datalist-label">
                                    <div className="pointer">
                                        <div className="">{data.name}</div>
                                    </div>
                                    <TagListing
                                        items={dbTagConversion(data.tags)}
                                    />
                                </div>
                            </div>
                            <div className="datalist-list-btns">
                                <span
                                    className=""
                                    title="Duplicate"
                                    onClick={() => cloneDatalist(data)}>
                                    <i className="px-1 fa-regular fa-clone datalist-clone"></i>
                                </span>
                                <span
                                    className="table-del-font"
                                    title="Delete"
                                    onClick={() => deleteData(data)}>
                                    <i className="fa-regular fa-trash-can text-danger"></i>
                                </span>
                            </div>
                        </li>
                    );
                })}
        </ul>
    );
}
