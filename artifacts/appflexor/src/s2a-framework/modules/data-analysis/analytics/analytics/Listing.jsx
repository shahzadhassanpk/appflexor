import React from "react";
import { useContext } from "react";
import AnalyticContext from "./AnalyticsContext";

export default function Listing() {
    const anayticContext = useContext(AnalyticContext);

    if (anayticContext) {
        const {
            userSettingList,
            handleEdit,
            deleteData,
            saveSetting,
            selectedIndexId,
            inputReference,
            handleSearch,
            showDimsAddNew,
        } = anayticContext;

        return (
            <div className="analytic-save-list s2a-analytic-listing">
                {selectedIndexId && (
                    <>
                        <div className="list-header">
                            <label className="">
                                <i className="fa-solid fa-magnifying-glass-chart"></i>{" "}
                                Queries
                            </label>
                            <span
                                className="add-query"
                                title={`Design Query`}
                                disabled={
                                    (selectedIndexId && selectedIndexId) === ""
                                        ? true
                                        : false
                                }
                                onClick={() => showDimsAddNew()}>
                                <i className="fa-solid fa-plus"></i>
                            </span>
                        </div>
                        <FilterAnalytics
                            inputReference={inputReference}
                            handleSearch={handleSearch}
                        />
                        <ul className="list-group userlistscroll">
                            {userSettingList.map((item, index) => (
                                <li
                                    key={index}
                                    className={
                                        item["id"] === saveSetting["id"]
                                            ? "list-group-item active-item"
                                            : "list-group-item"
                                    }>
                                    <div className="row">
                                        <div
                                            className="col-sm-10"
                                            onClick={() => handleEdit(item)}>
                                            {item.title}
                                        </div>
                                        <div
                                            id="myBtn"
                                            className="col-sm-2 delete-align"
                                            onClick={() => deleteData(item)}>
                                            <i className="fa-regular fa-trash-can text-danger"></i>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        );
    }
}

function FilterAnalytics(props) {
    const { handleSearch, inputReference } = props;
    return (
        <div className="row mx-0 mb-1">
            <div className="col-sm-12 p-0">
                <div className="search-field">
                    <input
                        ref={inputReference}
                        type="text"
                        className="form-control form-control-sm"
                        onChange={handleSearch}
                        placeholder="Search..."
                    />
                </div>
            </div>
        </div>
    );
}
