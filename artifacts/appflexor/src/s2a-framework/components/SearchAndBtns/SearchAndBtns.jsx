import React from "react";

export default function SearchAndBtns(props) {
    const {
        title,
        inputRef,
        handleSearch,
        addNewItem,
        handleImport,
        handleExport,
        SearchPlaceHolder,
        searchValue,
        showTags,
        refresh,
        handleFormScroll,
        selectedTags = [],
    } = props;

    return (
        <>
            <div className="listing-header">
                <label className="fw-bold">{title}</label>
                <div className="d-flex">
                {handleImport && (
                        <div
                            title="Import"
                            className="pe-2 pointer"
                            onClick={() => handleImport()}>
                            <i className="fa-solid fa-file-import"></i>
                        </div>
                    )}
                    {handleExport && (
                        <div
                            title="Export"
                            className="pointer"
                            onClick={() => handleExport()}>
                            <i className="fa-solid fa-file-export pe-1"></i>
                        </div>
                    )}

                    <div
                        title="Add New"
                        className="pe-2 pointer"
                        onClick={() => {
                            addNewItem(), handleFormScroll();
                        }}>
                        <i className="fa-solid fa-plus"></i>
                    </div>
                    {refresh && (
                        <div
                            title="Refresh"
                            className="pe-2 pointer"
                            onClick={() => refresh()}>
                            <i className="fa-solid fa-rotate pe-1"></i>
                        </div>
                    )}
                    {showTags && (
                        <div
                            className={`pe-2 pointer ${
                                selectedTags.length > 0
                                    ? "tag-filtered"
                                    : "tag-filter"
                            }`}
                            title="Filter"
                            onClick={() => showTags()}>
                            <i className="fa-solid fa-filter"></i>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-2 input-group">
                <input
                    ref={inputRef}
                    value={searchValue}
                    type="text"
                    className="form-control"
                    placeholder={SearchPlaceHolder}
                    onChange={handleSearch}
                />
            </div>
        </>
    );
}
