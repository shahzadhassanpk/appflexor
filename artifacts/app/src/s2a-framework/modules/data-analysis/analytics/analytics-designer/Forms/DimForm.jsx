import React from "react";
import { useState } from "react";
import { useContext } from "react";
import { AppContext } from "../../../../../../AppContext";
import axios from "axios";
import { API_URL } from "../../../../../Config";
import { useEffect } from "react";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";

export default function DimForm(props) {
    const {
        error,
        handleInputDimension,
        dimension,
        handlePushDimension,
        handleUpdateDimension,
        hide,
        handleBlur,
        instanceItems,
    } = props;

    const [options, setOptions] = useState([]);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    useEffect(() => {
        dimension.serviceKey ? executeQuery() : setOptions();
    }, []);

    const executeQuery = () => {
        if (validation(dimension)) {
            let req = {
                datasource: dimension.data_source,
                tenant_id: tenantId,
                query: dimension.serviceKey,
            };
            axios
                .post(API_URL + "?service.key=bi.data&mode=lowerCase", req)
                // .post(API_URL + "?service.key=bi.data&mode=formData", req)
                .then(res => {
                    if (res.data.C_DATA) {
                        console.log(res);
                        const data = res.data.C_DATA[0];
                        const keys = Object.keys(data ? data : []);
                        if (keys) {
                            setOptions(keys);
                        }
                    } else {
                        setOptions([]);
                    }
                });
        }
    };

    const validation = dim => {
        let msg = "";
        let flag = true;
        // if (!dim.data_source) {
        //     msg = "Please Provide Datasource";
        //     flag = false;
        // } else
        if (dim.serviceKey === "") {
            msg = "Please Enter Sql";
            flag = false;
        }
        if (msg) {
            toastEmitter(msg, true, "warning");
        }
        return flag;
    };

    return (
        <div className="s2a-analytic-dim">
            <>
                <div className="form col-sm-12 form-background">
                    <div className="row">
                        <div className="col-sm-6 mb-1">
                            <div className="form-group">
                                <label
                                    className="col-form-label"
                                    htmlFor="label">
                                    Label <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="label"
                                    placeholder="Enter label"
                                    className="form-control"
                                    name="label"
                                    value={dimension.label}
                                    onChange={e => handleInputDimension(e)}
                                    required
                                />
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("label") > -1 && "d-block"
                                    }`}>
                                    Label Is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-6 mb-1">
                            <div className="form-group">
                                <label
                                    className="col-form-label"
                                    htmlFor="data_source">
                                    Data Source
                                    <span className="text-danger">*</span>
                                </label>
                                <select
                                    id="data_source"
                                    placeholder="Select data source"
                                    className="form-select"
                                    name="data_source"
                                    value={dimension["data_source"]}
                                    onChange={e => handleInputDimension(e)}
                                    required>
                                    <option value="">Default datasource</option>
                                    {instanceItems.map((datasource, index) => (
                                        <option
                                            key={index}
                                            value={datasource.code}>
                                            {datasource.name}
                                        </option>
                                    ))}
                                </select>
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("where_column") > -1 &&
                                        "d-block"
                                    }`}>
                                    Where Column Is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-12 mb-1">
                            <div className="form-group">
                                <label
                                    htmlFor="serviceKey"
                                    className="col-form-label d-flex justify-content-between">
                                    <span>
                                        Sql
                                        <span className="text-danger">*</span>
                                    </span>
                                    <span
                                        className="pointer"
                                        title="Fetch"
                                        onClick={executeQuery}>
                                        <i className="fa-solid fa-rotate"></i>
                                    </span>
                                </label>
                                <textarea
                                    id="serviceKey"
                                    placeholder="Enter Sql"
                                    className="form-control"
                                    name="serviceKey"
                                    value={dimension.serviceKey}
                                    onChange={e => handleInputDimension(e)}
                                    rows={3}
                                    required
                                />
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("serviceKey") > -1 &&
                                        "d-block"
                                    }`}>
                                    SQL is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-6 mb-1">
                            <div className="form-group">
                                <SelectComponent
                                    label="Select Column"
                                    name="key"
                                    value={dimension.key}
                                    handleInputDimension={handleInputDimension}
                                    handleBlur={handleBlur}
                                    items={options}
                                    disabled={
                                        options && options.length > 0
                                            ? false
                                            : true
                                    }
                                    required={true}
                                />
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("key") > -1 && "d-block"
                                    }`}>
                                    Select Column Is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-6 mb-1">
                            <div className="form-group">
                                <SelectComponent
                                    label="Where Column"
                                    name="where_column"
                                    value={
                                        dimension["where_column"] !== undefined
                                            ? dimension["where_column"]
                                                  .replaceAll(" ", "_")
                                                  .toLowerCase()
                                            : ""
                                    }
                                    handleInputDimension={handleInputDimension}
                                    items={options}
                                    disabled={
                                        options && options.length > 0
                                            ? false
                                            : true
                                    }
                                    required={true}
                                />
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("where_column") > -1 &&
                                        "d-block"
                                    }`}>
                                    Where Column Is Required.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
            <div className="float-end mt-2">
                {hide ? (
                    <button
                        type="button"
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={() => handlePushDimension()}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn button-theme btn-sm me-2 m-0"
                        onClick={() => handleUpdateDimension(dimension)}>
                        <i
                            className="fa-solid fa-floppy-disk pe-1"
                            data-bs-dismiss="modal"></i>
                        Update
                    </button>
                )}
            </div>
        </div>
    );
}

function SelectComponent(props) {
    const {
        label,
        name,
        value,
        handleBlur,
        handleInputDimension,
        items,
        required,
        disabled,
    } = props;

    const handleInput = e => {
        handleInputDimension(e);
    };

    return (
        <div className="s2a-analytic-select">
            <label
                htmlFor={name}
                className="col-form-label">
                {label}
            </label>
            <select
                className={disabled ? "form-select opacity-50" : "form-select"}
                id={name}
                name={name}
                value={value}
                required={false}
                title={disabled && "Enter sql first"}
                onBlur={handleBlur}
                disabled={disabled}
                onChange={handleInput}>
                <option value="">Default Option</option>
                {items &&
                    items?.map((item, index) => {
                        return (
                            <option
                                key={index}
                                value={item}>
                                {item}
                            </option>
                        );
                    })}
            </select>
        </div>
    );
}
