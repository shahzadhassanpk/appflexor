import React from "react";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";

export default function IndexForm(props) {
    const {
        indexClearFields,
        handleSaveIndex,
        handleInputIndex,
        index,
        dataSources,
        instanceItems,
        error,
        setSelectedDataSource,
    } = props;

    const saveIndex = async index => {
        const bool = await handleSaveIndex(index);
        if (bool) {
            const status =
                index.id == "" || index.id == "new" ? "Saved" : "Updated";
            toastEmitter(`Index ${status} Successfully`, true);
        }
    };

    return (
        <div className="s2a-index-form">
            <div className="form col-sm-12 form-background">
                <div className="row">
                    <div className="col-sm-6 mb-1 has-validation">
                        <div className="form-group">
                            <label
                                htmlFor="title"
                                className="col-form-label">
                                Title <span className="text-danger">*</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                className="form-control"
                                name="title"
                                value={index.title}
                                onChange={e => handleInputIndex(e)}
                                aria-describedby="title"
                                required
                            />
                            <span
                                className={`invalid-feedback ${
                                    error.indexOf("title") > -1 && "d-block"
                                }`}>
                                Title is Required.
                            </span>
                        </div>
                    </div>
                    <div className="col-sm-6 mb-1 has-validation">
                        <div className="form-group">
                            <label
                                htmlFor="table-name"
                                className="col-form-label">
                                Fact Table Name
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                id="table-name"
                                type="text"
                                className="form-control"
                                name="name"
                                value={
                                    index.name !== undefined
                                        ? index.name
                                              .replaceAll(" ", "_")
                                              .toLowerCase()
                                        : ""
                                }
                                onChange={e => handleInputIndex(e)}
                                required
                            />
                            <span
                                className={`invalid-feedback ${
                                    error.indexOf("name") > -1 && "d-block"
                                }`}>
                                name is Required.
                            </span>
                        </div>
                    </div>
                    <div className="col-sm-6 mb-1 has-validation">
                        <div className="form-group">
                            <label
                                htmlFor="data_source"
                                className="col-form-label">
                                Data Source{" "}
                                <span className="text-danger">*</span>
                            </label>
                            <div className="d-flex">
                                {dataSources.map((dataSource, index) => {
                                    return (
                                        <div
                                            key={index}
                                            className="form-check me-3"
                                            onClick={() =>
                                                setSelectedDataSource(
                                                    dataSource.name,
                                                )
                                            }>
                                            <input
                                                id={dataSource.name}
                                                className="form-check-input"
                                                type="radio"
                                                name="data_source"
                                                value={dataSource.name}
                                                checked={dataSource.selected}
                                                onChange={e =>
                                                    handleInputIndex(e)
                                                }
                                                required
                                            />
                                            <label
                                                htmlFor={dataSource.name}
                                                className="form-check-label">
                                                {dataSource.title}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <span
                                className={`invalid-feedback ${
                                    error.indexOf("data_source") > -1 &&
                                    "d-block"
                                }`}>
                                Data Source is Required.
                            </span>
                        </div>
                    </div>
                    {/* <div className="col-sm-6 mb-1 has-validation">
                                <div className="form-group">
                                    <label
                                        htmlFor="api-key"
                                        className="col-form-label">
                                        Api Key
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        id="api-key"
                                        type="text"
                                        className="form-control"
                                        name="api_key"
                                        value={
                                            index.api_key !== undefined
                                                ? index.api_key
                                                      .replaceAll(" ", ".")
                                                      .toLowerCase()
                                                : ""
                                        }
                                        onChange={e => handleInputIndex(e)}
                                        required
                                    />
                                    <span
                                        className={`invalid-feedback ${
                                            error.indexOf("api_key") > -1 &&
                                            "d-block"
                                        }`}>
                                        Api key is Required.
                                    </span>
                                </div>
                            </div> */}
                    {index && index.data_source === "POSTGRES" && (
                        <div className="mb-1 has-validation">
                            <label
                                htmlFor="data_source_name"
                                className="col-form-label">
                                Data Source Name
                                {/* <span className="text-danger">*</span> */}
                            </label>
                            <select
                                placeholder="Select Option"
                                className="form-select"
                                name="data_source_name"
                                value={index && index.data_source_name}
                                onChange={handleInputIndex}>
                                {/* <option
                                            key={0}
                                            defaultValue="">
                                            Select Option
                                        </option> */}
                                <option value="">Default</option>
                                {instanceItems &&
                                    instanceItems !== undefined &&
                                    instanceItems.map(instance => {
                                        return (
                                            <option
                                                key={instance.id}
                                                value={instance.code}>
                                                {instance.name}
                                            </option>
                                        );
                                    })}
                            </select>
                            {/* <span
                                        className={`invalid-feedback ${
                                            error.indexOf("data_source_name") >
                                                -1 && "d-block"
                                        }`}>
                                        Data Source Name is Required.
                                    </span> */}
                        </div>
                    )}
                </div>
            </div>
            <div className="float-end mt-2">
                {/* {index && index.data_source === "ELASTIC_SEARCH" && (
                    <button
                        type="button"
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={() => console.log("es recreate fired")}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Recreate Index
                    </button>
                )} */}
                <button
                    className="btn button-theme btn-sm me-2 m-0"
                    onClick={() => saveIndex(index)}>
                    <span className="fa-solid fa-floppy-disk pe-1"></span>
                    Save
                </button>
                <button
                    className="btn button-theme btn-sm me-2 m-0"
                    onClick={() => indexClearFields()}>
                    <i className="fa-solid fa-ban pe-1"></i>
                    Clear
                </button>
            </div>
        </div>
    );
}
