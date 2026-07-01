import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../../../../../AppContext";
import { API_URL } from "../../../../../Config";
import { getData } from "../../../../../components/CrudApiCall";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";
import { DndCard } from "../../../../../components/drag-and-drop-listing/Card";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid, tryParseJSONObject } from "../../../../../utils/utils";
import { moveChecker } from "./utils";
import DndWrapper from "../../../../../components/drag-and-drop-listing";

export default function MultiValuePropsEditor({
    handleOnChange,
    values,
    setValues,
}) {
    const [options, setOptions] = useState(parseOptionsFromProps(values?.options));
    const [dataSources, setDataSources] = useState([]);
    const [moveCard, setMoveCard] = useState(true);
    const collapseAccordionRef = useRef(null);
    const [inputField, setInputField] = useState(values);
    const [invalidFields, setInvalidFields] = useState({});
    const appContext = useContext(AppContext);

    useEffect(() => {
        getDataSources();        
    }, []);   
    
    useEffect(() => {
        if(options){
            handleRadioOptions(options, "options"); 
        }
               
    }, [options]);   

    useEffect(() => {
        setValues(inputField);        
        console.log("************* inputField > " + JSON.stringify(inputField));
    }, [inputField]);

    async function getDataSources() {
        try {
            let dataKeys = [
                {
                    serviceParams: "",
                    dataKey: "instance",
                    serviceKey: "sys.instance",
                    mode: "formData",
                },
            ];

            const res = await getData({
                keys: dataKeys,
                tenant_id: appContext?.tenantSubscription?.datasource,
                datasource: "",
                url: API_URL + "?service.key=masterKey.tenantData",
            });
            const list = res.data.C_DATA.instance;
            list.unshift({ name: "Default", code: "" });
            setDataSources(list);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        let invalid = { ...invalidFields };        

        if (inputField["use_static"] === "YES") {
            if (invalid["serviceKey"]) {
                delete invalid.serviceKey;
            }
            if (invalid["mapValue"]) {
                delete invalid.mapValue;
            }
            if (invalid["mapLabel"]) {
                delete invalid.mapLabel;
            }
            if (invalid["filter_by"]) {
                delete invalid.mapLabel;
            }
        } else {
            if (inputField["serviceKey"] === "") {
                invalid["serviceKey"] = true;
            } else delete invalid.serviceKey;

            if (inputField["mapLabel"] === "") {
                invalid["mapLabel"] = true;
            } else delete invalid.mapLabel;

            if (inputField["mapValue"] === "") {
                invalid["mapValue"] = true;
            } else delete invalid.mapValue;

            if (inputField["filter_by"] === "") {
                invalid["filter_by"] = true;
            } else delete invalid.mapValue;
        }

        setInvalidFields(invalid);
    }, [inputField]);


    function parseOptionsFromProps(array) {
        let options = [];
        if(array){
            try {
                options = tryParseJSONObject(array, array);
            } catch (error) {
                console.log();
            }
        }        
        return options;
    }

    const handleInputField = event => {
        let key = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }

        let _inputField = { ...inputField, [key]: value };
        setInputField(_inputField);
    };

    function addRadioOption() {
        let currentState = [...options];
        let newOption = {
            option_id: makeid(4),
            label: `Value ${currentState.length + 1}`,
            value: `value${currentState.length + 1}`,
        };
        currentState.push(newOption);

        setOptions(currentState);
        let fieldId = "options";

        // let str = JSON.stringify(currentState);
        handleRadioOptions(currentState, fieldId);
    }

    function handleRadioOptions(radioList, fieldId) {
        let _radioList = [];
        let arr = [...radioList];
        inputField[fieldId] = arr;
        // setInputField       
    }

    function handleOptionsChange(e, fieldId) {
        let id = e.target.getAttribute("data-id");
        let value = e.target.value;
        let name = e.target.name;

        let _updatedArr = [];

        options &&
            options.map(opt => {
                if (opt.option_id === id) {
                    let obj = opt;
                    obj[name] = value;

                    _updatedArr.push(obj);
                } else {
                    _updatedArr.push(opt);
                }
            });
        setOptions(_updatedArr);
        handleRadioOptions(_updatedArr, fieldId);
    }

    function handleRadioOptDelete(option, fieldId) {
        let _updatedArr = [];

        _updatedArr = options.filter(opt => opt.option_id !== option.option_id);

        setOptions(_updatedArr);
        handleRadioOptions(_updatedArr, fieldId);
    }

    function checkValidations() {
        let invalid = { ...invalidFields };

        if (inputField["label"] === "") {
            invalid["label"] = true;
        } else delete invalid.label;


        if (inputField["serviceParams"] !== "" && !inputField?.filter_by) {
            invalid["filter_by"] = true;
        } else delete invalid.filter_by;

        if (inputField["use_static"] === "YES") {
            if (invalid["serviceKey"]) {
                delete invalid.serviceKey;
            }
            if (invalid["mapValue"]) {
                delete invalid.mapValue;
            }
            if (invalid["mapLabel"]) {
                delete invalid.mapLabel;
            }
            if (invalid["filter_by"]) {
                delete invalid.filter_by;
            }
        } else {
            if (inputField["serviceKey"] === "") {
                invalid["serviceKey"] = true;
            } else delete invalid.serviceKey;

            if (inputField["mapLabel"] === "") {
                invalid["mapLabel"] = true;
            } else delete invalid.mapLabel;

            if (inputField["mapValue"] === "") {
                invalid["mapValue"] = true;
            } else delete invalid.mapValue;

            if (inputField["filter_by"] === "") {
                invalid["filter_by"] = true;
            } else delete invalid.filter_by;
        }

        setInvalidFields(invalid);

        if (isEmpty(invalid)) {
            
            setShow(false);
        }
    }

    const handleChangeDataSource = item => {
        setInputField({ ...inputField, datasource: item.code });
    };

    return (
        <ErrorBoundary>
            <form>
                {/* <cod>{JSON.stringify(inputField)}</cod> */}
                <div className="row">
                    <div className="col-auto mb-3">
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="checkbox"
                                name="use_static"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                checked={
                                    inputField?.use_static === "YES"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2"> Use Static Options</span>
                        </label>
                    </div>
                </div>

                <div className="row">
                    {inputField?.use_static !== "YES" && (
                        <div className="col mb-3">
                            <label className="form-label">Service Key</label>
                            <input
                                type="text"
                                name="serviceKey"
                                className={`form-control form-control-sm ${
                                    invalidFields["serviceKey"] !== undefined
                                        ? "form-control-danger"
                                        : ""
                                }`}
                                onChange={e => handleInputField(e)}
                                value={inputField?.serviceKey}
                            />
                        </div>
                    )}
                    <div className="col-sm-6 mb-3">
                        <label className="form-label">
                            Form Field Group Filter
                        </label>
                        <input
                            type="text"
                            name="serviceParams"
                            className={`form-control form-control-sm `}
                            onChange={e => handleInputField(e)}
                            value={inputField?.serviceParams}
                        />
                    </div>
                    {inputField?.use_static !== "YES" && (
                        <div className="col mb-3">
                            <label className="form-label">Filter By</label>
                            <input
                                type="text"
                                name="filter_by"
                                value={inputField?.filter_by}
                                className={`form-control form-control-sm ${
                                    invalidFields["filter_by"] !== undefined
                                        ? "form-control-danger"
                                        : ""
                                }`}
                                onChange={e => handleInputField(e)}
                            />
                        </div>
                    )}
                </div>
                {inputField?.use_static === "YES" && (
                    <div className="row">
                        <div className="col-sm-6">
                            <div>
                                <label className="form-label">
                                    Static Values
                                    <span className="text-danger">&nbsp;*</span>
                                </label>
                                <span className="float-end">
                                    <span className="me-1 px-2 rounded-circle">
                                        {options.length}
                                    </span>
                                    <span
                                        className="float-end pointer"
                                        data-bs-toggle="tooltip"
                                        data-bs-title="Create new list item"
                                        onClick={addRadioOption}>
                                        <i className="fs-5 fa-solid fa-plus"></i>
                                    </span>
                                </span>
                            </div>
                            <DndWrapper>
                                <div
                                    id={`array-selection`}
                                    className="form-accordion accordion accordion-flush">
                                    {options &&
                                        options.map((option, index) => {
                                            const accordionId =
                                                "accord" + option?.id;
                                            return (
                                                <DndCard
                                                    id={option.id}
                                                    index={index}
                                                    setItems={setOptions}
                                                    move={moveCard}>
                                                    <div key={option.id}>
                                                        <div className="accordion-item">
                                                            <h2 className="accordion-header">
                                                                <button
                                                                    id={
                                                                        accordionId
                                                                    }
                                                                    ref={
                                                                        collapseAccordionRef
                                                                    }
                                                                    className="accordion-button p-2 collapsed"
                                                                    type="button"
                                                                    onClick={() =>
                                                                        moveChecker(
                                                                            accordionId,
                                                                            setMoveCard,
                                                                        )
                                                                    }
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target={`#a${index}`}>
                                                                    {
                                                                        option.label
                                                                    }
                                                                </button>
                                                            </h2>
                                                            <div
                                                                id={`a${index}`}
                                                                className="accordion-collapse collapse"
                                                                data-bs-parent={`#array-selection`}>
                                                                <div className="accordion-body py-1 px-2 d-flex gap-2">
                                                                    <div className="">
                                                                        <label className="mb-0 form-label">
                                                                            Label
                                                                        </label>
                                                                        <input
                                                                            className="form-control form-control-sm "
                                                                            type="text"
                                                                            data-id={
                                                                                option.option_id
                                                                            }
                                                                            name="label"
                                                                            value={
                                                                                option.label
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    "array",
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="">
                                                                        <label className="mb-0 form-label">
                                                                            Value
                                                                        </label>
                                                                        <input
                                                                            className="form-control form-control-sm"
                                                                            type="text"
                                                                            name="value"
                                                                            data-id={
                                                                                option.option_id
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    "array",
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="">
                                                                        <label className="mb-0 form-label">
                                                                            Group
                                                                        </label>
                                                                        <input
                                                                            className="form-control form-control-sm"
                                                                            type="text"
                                                                            name="group"
                                                                            data-id={
                                                                                option.option_id
                                                                            }
                                                                            value={
                                                                                option.group
                                                                            }
                                                                            onChange={e =>
                                                                                handleOptionsChange(
                                                                                    e,
                                                                                    "array",
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div
                                                                        onClick={() =>
                                                                            handleRadioOptDelete(
                                                                                option,
                                                                                "array",
                                                                            )
                                                                        }
                                                                        className="pointer mt-4">
                                                                        <i className=" fa-solid fa-trash text-danger ps-2"></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DndCard>
                                            );
                                        })}
                                </div>
                            </DndWrapper>
                        </div>
                    </div>
                )}
                <div className="row">
                    {(inputField?.use_static === undefined ||
                        inputField?.use_static === "" ||
                        inputField?.use_static === "NO") && (
                        <>
                            <div className="col-sm-4 mb-3">
                                <label className="form-label">Map Label</label>
                                <input
                                    type="text"
                                    name="mapLabel"
                                    className={`form-control form-control-sm ${
                                        invalidFields["mapLabel"] !== undefined
                                            ? "form-control-danger"
                                            : ""
                                    }`}
                                    onChange={e => handleInputField(e)}
                                    value={inputField?.mapLabel}
                                />
                            </div>
                            <div className="col-sm-4 mb-3">
                                <label className="form-label">Map Value</label>
                                <input
                                    type="text"
                                    name="mapValue"
                                    className={`form-control form-control-sm ${
                                        invalidFields["mapValue"] !== undefined
                                            ? "form-control-danger"
                                            : ""
                                    }`}
                                    onChange={e => handleInputField(e)}
                                    value={inputField?.mapValue}
                                />
                            </div>

                            {inputField?.mapValue && (
                                <div className="col-sm-4 mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="datasource">
                                        Datasource
                                    </label>
                                    <ReactSelect
                                        options={dataSources}
                                        fieldLabel="name"
                                        fieldValue="code"
                                        handleChange={handleChangeDataSource}
                                        selectedOption={dataSources.find(
                                            item =>
                                                item.code ===
                                                inputField?.datasource,
                                        )}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </form>
        </ErrorBoundary>
    );
}
