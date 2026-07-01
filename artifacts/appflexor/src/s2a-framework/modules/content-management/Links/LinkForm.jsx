import React, { useState, useEffect, useRef, useContext } from "react";
import { SiteContext } from "../Wrapper/SiteContext";

const LinkForm = props => {
    const {
        clearFeature,
        selectedModuleFeature,
        saveFeature,
        saveIsDisabled,
        inputFeature,
        pages,
        handleClose,
        featureType,
        refetch,
    } = props;
    const siteContext = useContext(SiteContext);
    const visible = item => {
        const featureType = !item.type ? "PROTECTED" : item.type;
        const siteFeatureAccess = !siteContext.moduleItem.access
            ? "PROTECTED"
            : siteContext.moduleItem.access;

        return featureType === siteFeatureAccess;
    };

    return (
        <div>
            {" "}
            <div className="form col-sm-12">
                <div className="row form-background mx-0 pb-1">
                    <div className="col-sm-12 p-0">
                        <div className="row">
                            <div className="col-sm-6 ">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Name&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        value={selectedModuleFeature.name}
                                        onChange={inputFeature}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Link Type&nbsp;
                                        <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        name="type"
                                        value={selectedModuleFeature.type}
                                        onChange={inputFeature}>
                                        <option value="">
                                            Select Link Type
                                        </option>
                                        {featureType.map((item, index) => (
                                            <option
                                                key={index}
                                                value={item.value}
                                                disabled={!item.active}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-sm-6">
                                {selectedModuleFeature.type === "PAGE" && (
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold d-flex justify-content-between">
                                            <span>
                                                Pages&nbsp;
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            </span>
                                            <i
                                                onClick={refetch}
                                                className="fa-solid fa-arrows-rotate"></i>
                                        </label>
                                        <select
                                            name="feature_key"
                                            className="form-select"
                                            value={
                                                selectedModuleFeature.feature_key
                                            }
                                            onChange={inputFeature}>
                                            <option
                                                value=""
                                                disabled>
                                                Select page
                                            </option>
                                            {pages &&
                                                pages.length > 0 &&
                                                pages.map(
                                                    (item, index) =>
                                                        visible(item) && (
                                                            <option
                                                                key={index}
                                                                value={item.id}>
                                                                {item.name}
                                                                {/* ({!item.type?"PROTECTED":item.type}) */}
                                                            </option>
                                                        ),
                                                )}
                                        </select>
                                    </div>
                                )}
                                {selectedModuleFeature.type ===
                                    "HYPER_LINK" && (
                                    <div className="form-group">
                                        <label className="mt-1 fw-bold">
                                            Target URL
                                            <span className="text-danger">
                                                &nbsp;*
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="target_id"
                                            value={
                                                selectedModuleFeature.target_id
                                            }
                                            onChange={inputFeature}
                                        />
                                    </div>
                                )}

                                {selectedModuleFeature.type !== "PAGE" &&
                                    selectedModuleFeature.type !==
                                        "HYPER_LINK" && (
                                        <div className="form-group">
                                            <label className="mt-1 fw-bold">
                                                {selectedModuleFeature.type ===
                                                "IFRAME"
                                                    ? "URL"
                                                    : // : "Feature Key"
                                                      "URL"}
                                                <span className="text-danger">
                                                    &nbsp;*
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="feature_key"
                                                value={
                                                    selectedModuleFeature.feature_key
                                                }
                                                onChange={inputFeature}
                                            />
                                        </div>
                                    )}
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Icon&nbsp;
                                        <span className="text-danger"></span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="icon"
                                        value={selectedModuleFeature.icon}
                                        onChange={inputFeature}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Slug&nbsp;
                                        <span className="text-danger"></span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="slug"
                                        value={selectedModuleFeature.slug}
                                        onChange={inputFeature}
                                    />
                                </div>
                            </div>
                            <div className="col-sm-6">
                                <div className="form-group">
                                    <label className="mt-1 fw-bold">
                                        Access&nbsp;
                                        <span className="text-danger"></span>
                                    </label>
                                    <select
                                        disabled
                                        name="feature_access"
                                        className="form-select"
                                        value={siteContext.moduleItem.access}
                                        // onChange={inputFeature}
                                    >
                                        <option value="PROTECTED">
                                            Protected
                                        </option>
                                        <option value="PUBLIC">Public</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-2">
                {selectedModuleFeature.id === "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2 ms-0"
                        data-bs-dismiss="modal"
                        onClick={() => saveFeature()}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                )}
                {selectedModuleFeature.id !== "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2 ms-0"
                        data-bs-dismiss="modal"
                        onClick={() => saveFeature()}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Update
                    </button>
                )}
                {selectedModuleFeature.id === "" && (
                    <button
                        className="btn button-theme btn-sm pull-left me-2"
                        onClick={() => clearFeature()}>
                        <i className="fa-solid fa-ban pe-1"></i>
                        Clear
                    </button>
                )}
                <button
                    type="button"
                    className="btn button-theme btn-sm"
                    onClick={handleClose}
                    aria-label="Close">
                    <i className="fa-solid fa-xmark pe-1"></i>
                    Close
                </button>
            </div>
        </div>
    );
};

export default LinkForm;
