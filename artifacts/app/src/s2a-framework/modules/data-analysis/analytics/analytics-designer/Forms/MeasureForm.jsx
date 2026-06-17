import React from "react";
import { useState } from "react";
import { AppContext } from "../../../../../../AppContext";
import axios from "axios";
import { useEffect } from "react";
import { API_URL } from "../../../../../Config";
import { useContext } from "react";
import { toastEmitter } from "../../../../../components/Toastify/Toastify";

export default function MeasureForm(props) {
    const {
        measure,
        handleInputMeasure,
        error,
        handlePushFactAndMeasure,
        handleUpdateMeasure,
        measureClearFields,
        closeModal,
        hide,
        index,
    } = props;

    const [options, setOptions] = useState([]);
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    useEffect(() => {
        executeQuery();
    }, []);

    const handleClose = () => {
        closeModal();
        measureClearFields("close");
    };

    const executeQuery = () => {
        // if (index && index.name && index.data_source_name) {
        if (index && index.name) {
            let req = {
                datasource: index.data_source_name,
                tenant_id: tenantId,
                query: `select * from ${index.name} limit 1`,
            };
            axios
                .post(API_URL + "?service.key=bi.data&mode=lowerCase", req)
                .then(res => {
                    if (res.data.C_DATA) {
                        const data = res.data.C_DATA[0];
                        const keys = Object.keys(data ? data : []);
                        if (keys) {
                            setOptions(keys);
                        }
                    } else {
                        setOptions([]);
                    }
                });
        } else {
            toastEmitter("Please provide index first");
        }
    };

    return (
        <div className="s2a-measure-form">
            <>
                <div className="form col-sm-12 form-background">
                    <div className="row">
                        <div className="col-sm-12 mb-1">
                            <div className="form-group">
                                <SelectComponent
                                    label="Fact Column"
                                    name="key"
                                    value={measure.key}
                                    handleInputDimension={handleInputMeasure}
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
                                    Fact Column is Required.
                                </span>
                            </div>
                        </div>
                        <div className="col-sm-12 mb-1">
                            <div className="form-group">
                                <label
                                    className="col-form-label"
                                    htmlFor="label">
                                    Measure Label &nbsp;
                                    <span className="text-danger">*</span>
                                </label>
                                <input
                                    id="label"
                                    className="form-control"
                                    placeholder="Measure Label"
                                    name="label"
                                    value={
                                        measure.label !== undefined
                                            ? measure.label.replaceAll(" ", "_")
                                            : ""
                                    }
                                    onChange={e => handleInputMeasure(e)}
                                    required
                                />
                                <span
                                    className={`invalid-feedback ${
                                        error.indexOf("label") > -1 && "d-block"
                                    }`}>
                                    Measure Label is Required.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
            <>
                <div className="float-end  mt-2">
                    {hide ? (
                        <button
                            type="button"
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => handlePushFactAndMeasure()}>
                            <i className="fa-solid fa-floppy-disk pe-1"></i>
                            Save
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn button-theme btn-sm me-2 m-0"
                            onClick={() => handleUpdateMeasure(measure)}>
                            <i
                                className="fa-solid fa-floppy-disk pe-1"
                                data-bs-dismiss="modal"></i>
                            Update
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn button-theme btn-sm m-0"
                        data-bs-dismiss="modal"
                        onClick={() => handleClose()}>
                        <i className="fa-solid fa-xmark pe-1"></i>
                        Close
                    </button>
                </div>
            </>
        </div>
    );
}

function SelectComponent(props) {
    const {
        label,
        name,
        value,
        handleBlur = () => null,
        handleInputDimension = () => null,
        items,
        required,
        disabled,
    } = props;

    const handleInput = e => {
        handleInputDimension(e);
    };

    return (
        <>
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
                required={required ? required : false}
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
        </>
    );
}
