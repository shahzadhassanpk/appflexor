import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../../Config";
import { componentList } from "../../Designer/ComponentRegistry";
import RenderFormFields from "./RenderFormFields";
import { actions, modeType } from "./constants";
import { getProcessVariablesFromDataMap } from "../../../../camunda/helperFunctions";
import {
    checkMultiPageValidation,
    checkMultiPageValidationExp,
    checkValidationExp,
    checkValidation,
    formatDateForDataBase,
    formatDateTimeForDataBase,
    formatTimeForDataBase,
    getObjectSchemeForValidation,
    getObjectSchemeForValidation8,
    getSchemeForValidationMultiPageForm,
    isEmpty,
    tryEval,
    tryParseJSONObject,
} from "./utils";
import { AppContext } from "../../../../../../AppContext";
import _default from "react-select";
import useGlobalData from "../../../../../components/useGlobal";
// import { useNavigation } from "react-router-dom";

const ProcessFormViewer = ({
    formKey,
    businessKey = "new",
    submitLabel,
    processVariables = {},
    formVars = {},
    processConfig = {
        showActions: false,
        allowComplete: false,
        hideFormTilte: false,
        showDraftButton: false,
    },
    mode = modeType.render,
    handleActions,
    external,
    onClose,
}) => {
    // Form Data
    const [form, setForm] = useState({});
    const [formData, setFormData] = useState({ id: "new" });
    const [defaultFormData, setDefaultFormData] = useState({});
    const [formDetails, setFormDetails] = useState({});
    const [isFormSaved, setIsFormSaved] = useState(false);
    const [dataKeys, setDataKeys] = useState({});
    // Form Files
    const [filesContent, setFilesContent] = useState([]);
    const [fileNameMapping, setFileNameMapping] = useState({});
    const [fileDataParsed, setFileDataParsed] = useState({});
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [processVar, setProcessVar] = useState({});
    const [isValid, setIsValid] = useState(true);
    // Layout
    const [layout, setLayout] = useState([]);
    const [layoutLoaded, setLayoutLoaded] = useState(false);
    const [images, setImages] = useState({});
    const [htmlCollection, setHtmlCollection] = useState({});
    const [components, setComponents] = useState({});
    const [columns, setColumns] = useState({});
    // Multi Layout Design
    const [multipageDesign, setMultipageDesign] = useState([]);

    const [infoMsg, setInfoMsg] = useState("");
    const expressionProps = useGlobalData();
    // 1: Load form design
    useEffect(() => {
        if (formKey && formKey !== "") {
            // console.log("******************** formKey :"+formKey);
            getForm(formKey);
            // lastFormKey.current = formKey;
        }
    }, [formKey]);

    // 2: parse form design and set layout
    useEffect(() => {
        if (!isEmpty(form)) {
            let _formDetails = {
                formKey: form.form_key,
                name: form.name,
                table: form.table,
                datasource: form.datasource,
                useprefix: form.useprefix,
                enableMultipage: form.enable_multipage,
                tabsPosition: form.tabs_position,
            };

            if (form.enable_multipage && form.enable_multipage === "YES") {
                try {
                    let parsedDesign = tryParseJSONObject(
                        form.multipage_design,
                        [],
                    );
                    let _layout = [];
                    setMultipageDesign(parsedDesign);
                    // add by haider
                    const components = {};
                    for (let item of parsedDesign) {
                        const design = item.design;
                        _layout.push(design.layout[0]);
                        const comps = design.components;
                        for (let key in comps) {
                            const comp = comps[key];
                            components[key] = comp;
                        }
                    }
                    setComponents(components);
                    setLayout(_layout);
                    extractColumns(components);
                    // add by haider
                } catch (error) {
                    console.error(error);
                }
            } else {
                try {
                    let parsedDesign = tryParseJSONObject(form.design, {
                        layout: [],
                        components: {},
                        images: {},
                        htmlCollection: {},
                    });

                    setLayout(parsedDesign.layout);
                    setComponents(parsedDesign.components);
                    setImages(parsedDesign.images);
                    setHtmlCollection(parsedDesign.htmlCollection);
                    extractColumns(parsedDesign.components);
                } catch (error) {
                    console.error(error);
                }
            }
            setFormDetails(_formDetails);
            setLayoutLoaded(true);
        }
    }, [form]);

    // 3: set form defatults
    useEffect(() => {
        if (
            formDetails?.enableMultipage &&
            formDetails?.enableMultipage === "YES"
        ) {
            if (
                (mode === modeType.preview || mode === modeType.render) &&
                multipageDesign.length !== 0
            ) {
                if (businessKey === "new" || businessKey === "") {
                    let _default =
                        getSchemeForValidationMultiPageForm(multipageDesign);
                    _default.id = "new";
                    if (!isEmpty(_default)) setDefaultFormData(_default);
                }
            }
        } else {
            if (
                (mode === modeType.preview || mode === modeType.render) &&
                !isEmpty(components) &&
                layout.length !== 0
            ) {
                if (businessKey === "new" || businessKey === "") {
                    let validationSchema = getObjectSchemeForValidation8(
                        layout,
                        components,
                        {},
                        formVars,
                    );
                    let _default = validationSchema.formData;
                    _default.id = "new";
                    if (!isEmpty(_default)) setDefaultFormData(_default);
                }
            }
        }
        // }, [layoutLoaded, businessKey, processVariables]);
    }, [layoutLoaded, businessKey]); // SH removed processVar

    useEffect(() => {
        if (
            //Shahzad commented as not need to check mode to set defaults
            // (mode === modeType.preview || mode === modeType.render) &&
            !isEmpty(components) &&
            layout.length > 0
        ) {
            if (processVariables && !isEmpty(processVariables)) {
                const validationSchema = getObjectSchemeForValidation8(
                    layout,
                    components,
                    processVariables,
                    formVars,
                );
                setDefaultFormData(validationSchema.formData);
                setProcessVar(validationSchema.processVar);
            }
        }
    }, [layoutLoaded, components, businessKey]);

    // useEffect(() => {
    //     if (layoutLoaded && formData) {
    //         validateFormData();
    //     }
    // }, [layoutLoaded, formData]);

    useEffect(() => {
        if (
            layoutLoaded &&
            // businessKey === "new" &&
            !isEmpty(defaultFormData) &&
            !isEmpty(processVariables)
        ) {
            let merged = copyProcessData(defaultFormData, processVariables);
            // console.log("******************* merged" + JSON.stringify(merged));
            setFormData(merged);
            // console.log("***************** setFormData > 3");
        } else if (defaultFormData) {
            setFormData(defaultFormData);
        }
        // console.log(
        //     "******************* processVar" + JSON.stringify(processVariables),
        // );
    }, [layoutLoaded, defaultFormData, businessKey]);

    useEffect(() => {
        let bk = formVars.business_key || businessKey;
        if (layoutLoaded && bk !== "new") {
            getFormData(bk, formKey);
        }
    }, [layoutLoaded, formVars.business_key || businessKey]);

    useEffect(() => {
        if (defaultFormData && !isEmpty(defaultFormData)) {
            // console.log("************** ProcessFormViewer  defaultFormData >"+JSON.stringify(defaultFormData))
        }
    }, [defaultFormData]);

    useEffect(() => {
        if (processVariables && !isEmpty(processVariables)) {
            // console.log("************** ProcessFormViewer  processVariables >"+JSON.stringify(processVariables))
        }
    }, [processVariables]);

    // useEffect(() => {
    //     if (handleChange) {
    //         if (!isEmpty(formData) && !isEmpty(formDetails)) {
    //             handleChange(formData, formDetails, filesContent);
    //         }
    //     }
    // }, [formData, formDetails, filesContent]);

    const handleClose = () => {
        onClose();
    };

    const handleInputFields = (
        key = "",
        value = "",
        isValid = false,
        type = "text",
        fileData = "",
        state = {},
        formDetails = {},
    ) => {
        switch (type) {
            case "daterange": {
                let obj = tryParseJSONObject(value, {});
                if (!isEmpty(obj))
                    setFormData(prev => ({
                        ...prev,
                        ...obj,
                    }));

                break;
            }
            case "file": {
                const data = tryParseJSONObject(value, []);

                // const deletedFiles = data.filter(
                //     (file) => file.status === "DELETED"
                // );
                // console.log(deletedFiles);
                // setFilesToDelete(deletedFiles);
                const _fileDataParsed = data.filter(file => {
                    return (
                        file.status !== "DELETED" || file.status === undefined
                    );
                });

                // setFileDataParsed(_fileDataParsed);
                const encodedFileDataParsed = tryParseJSONObject(fileData, []);

                let obj = { ...fileNameMapping };

                encodedFileDataParsed.forEach(element => {
                    if (obj[element.column]) {
                        let val1 = obj[element.column];
                        let val2 = element.fileName + ";";
                        if (!val1.includes(val2)) {
                            obj[element.column] =
                                obj[element.column] + element.fileName + ";";
                        }
                    } else {
                        obj[element.column] = element.fileName + ";";
                    }
                });

                setFileNameMapping(obj);

                // let newArr = encodedFileDataParsed.map((item) => {
                //     delete item.column;
                //     return item;
                // });
                // console.log(newArr);

                setFilesContent(prev => [...prev, ...encodedFileDataParsed]);

                let newValue = "";

                _fileDataParsed.forEach(file => {
                    newValue += file.name + ";";
                });
                // if (!isEmpty(newValue))
                setFormData(prev => ({
                    ...prev,
                    [key]: newValue,
                }));
                break;
            }
            default: {
                // if (!isEmpty(value))
                setFormData(prev => ({
                    ...prev,
                    [key]: value,
                }));
                break;
            }
        }

        // setIsValidForm(prev => ({
        //     ...prev,
        //     [key]: isValid,
        // }));
    };

    function getForm(formKey) {
        var dataRequest = {};

        dataRequest = {
            dataKeys: [
                {
                    serviceParams: formKey,
                    dataKey: "formList",
                    serviceKey: "sys.get.form",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                // if (response.data === "") {
                //     getForm(formKey);
                // }
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.formList) {
                        let list = response.data.C_DATA.formList;
                        let form = list[0];

                        if (form) {
                            setForm(form);
                        }
                        // try {
                        //     let parsedDesign = tryParseJSONObject(form.design, {
                        //         layout: [],
                        //         components: {},
                        //         images: {},
                        //         htmlCollection: {},
                        //     });
                        //     let layout = parsedDesign.layout;
                        //     let components = parsedDesign.components;
                        //     let images = parsedDesign.images;
                        //     let htmlCollection = parsedDesign.htmlCollection;

                        //     let obj = {
                        //         formKey: form.form_key,
                        //         name: form.name,
                        //         table: form.table,
                        //         datasource: form.datasource,
                        //         useprefix: form.useprefix,
                        //     };

                        //     setFormDetails(obj);
                        //     setLayout(layout);
                        //     setComponents(components);
                        //     setImages(images);
                        //     setHtmlCollection(htmlCollection);
                        // } catch (error) {
                        //     console.error(error);
                        // }
                    } else {
                        console.log(
                            `Either list.all.forms does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getFormData(_businessKey, _formKey, _defaultFormData) {
        var dataRequest = {
            datasource: formDetails.datasource,
            usePrefix: formDetails.useprefix,
            dataKeys: [
                {
                    businessKey: _businessKey,
                    dataKey: "formData",
                    getFormBy: "key",
                    formKey: _formKey,
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=get.formData", dataRequest)
            .then(response => {
                if (response.data === "") {
                    getFormData(_businessKey, _formKey, _defaultFormData);
                }
                if (response.data.C_DATA) {
                    let formDataTemp = response.data.C_DATA.formData[0];
                    let merged = copyProcessData(
                        formDataTemp,
                        processVariables,
                    );
                    setFormData(merged);
                    // console.log("***************** setFormData > 5");
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function copyProcessData(formData, processData) {
        const variableMap = getProcessVariablesFromDataMap(
            formData,
            components,
        );
        const formKeys = Object.keys(variableMap);
        formKeys.map(formKey => {
            let value = processData.hasOwnProperty(formKey)
                ? processData[formKey]
                : undefined;
            let db_column = variableMap[formKey];
            formData[db_column] = value;
        });
        return formData;
    }

    function validateFormData() {
        let validations = {};
        if (
            formDetails.enableMultipage &&
            formDetails.enableMultipage === "YES"
        ) {
            validations = checkMultiPageValidationExp(
                formData,
                multipageDesign,
                expressionProps,
            );
        } else {
            validations = checkValidationExp(
                formData,
                layout,
                components,
                expressionProps,
            );
        }

        return validations;
    }

    async function handleMainSave(actionType) {
        let validations = validateFormData();

        if (validations.isValid) {
            let result = await saveMainForm();

            if (result) {
                window.scrollTo(0, 0);
                setLayoutLoaded(false);
                let { mainId, resObj, reqPayload } = result;
                if (!isEmpty(resObj)) setFormData(resObj);
                // console.log("***************** processVar > "+JSON.stringify(processVar));
                // setFilesToDelete([]);
                if (handleActions) {
                    handleActions(
                        actionType,
                        resObj,
                        formDetails,
                        components,
                        reqPayload,
                        external,
                        processVar,
                    );
                }
            }
            setIsFormSaved(true);
            // await handleSaveData(actionType);
        } else if (!validations.isValid) {
            let invalidLabels = validations.invalidLabels;
            invalidLabels = [...new Set(invalidLabels)];

            let msg =
                "Invalid or missing data in field(s) " +
                `${invalidLabels.join(", ")}`;

            setInfoMsg(msg);
            setTimeout(() => {
                setInfoMsg("");
            }, 3000);
            return null;
        }
    }

    function onlyFormFields(fieldData) {
        for (let key in fieldData) {
            if (key !== "business_key" && !columns[key]) {
                delete fieldData[key];
            }
        }
    }
    function extractColumns(components) {
        try {
            const columns = { id: "id" };
            for (let key in components) {
                const component = components[key];
                const db_column = component.data.db_column;
                const type = component.type;
                if (
                    (db_column && type === "autoincrement") ||
                    type === "datalist"
                ) {
                } else if (db_column && type !== "daterange") {
                    columns[db_column] = db_column;
                } else if (type === "daterange") {
                    columns[component.data.start_db_column] =
                        component.data.start_db_column;
                    columns[component.data.end_db_column] =
                        component.data.end_db_column;
                }
            }
            setColumns(columns);
        } catch (error) {
            console.log(error);
        }
    }
    async function saveMainForm() {
        let fieldsData = {};

        fieldsData = { ...formData };

        for (let key in fieldsData) {
            if (key === "" && fieldsData[key] === "") {
                delete fieldsData[key];
            }
        }

        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";
        entityForm.idGeneration = formDetails?.id_generation;
        entityForm.fileData = [];
        // let obj = { ...fileNameMapping };

        filesContent.forEach(element => {
            if (entityForm[element.column]) {
                entityForm[element.column] =
                    entityForm[element.column] + element.fileName + ";";
            } else {
                entityForm[element.column] = element.fileName + ";";
            }

            let obj = {
                fileName: element.fileName,
                content: element.content,
            };
            entityForm.fileData.push(obj);
        });

        // entityForm.assignment = filesContent;

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
            fieldsData.id = "new";
        }
        onlyFormFields(fieldsData);
        entityForm.formData = fieldsData;

        request.data.push(entityForm);

        return new Promise((resolve, reject) => {
            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS == "SUCCESS") {
                        let resObj = response.data.C_DATA[0].formData;
                        let parsedReq = tryParseJSONObject(
                            response.config.data,
                            {},
                        );
                        let reqPayload =
                            parsedReq.data !== undefined
                                ? parsedReq.data[0]
                                : {};
                        let mainId = resObj.id;
                        let obj = { mainId, resObj, reqPayload };
                        resolve(obj);
                    } else {
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    return (
        <>
            {!layoutLoaded && formData?.id ? (
                <div className="col-sm-9 task-view-panel">
                    <div className="no-task-border">
                        <div className="no-task-wrap">
                            <span
                                className="spinner-border spinner-border-sm label me-2"
                                role="status"></span>{" "}
                            Updating task...
                        </div>
                    </div>
                </div>
            ) : (
                <div className="s2a-form-viewer">
                    {/* {JSON.stringify(processVariables)} */}
                    {/* {
                        (processConfig?.hideFormTilte==false) && <div className="row">
                            <div className="s2a-form-title">{form.name} </div>
                        </div>
                    } */}
                    <RenderFormFields
                        multipageDesign={multipageDesign}
                        layout={layout}
                        components={components}
                        mode={mode}
                        images={images}
                        htmlCollection={htmlCollection}
                        formData={formData}
                        isFormSaved={isFormSaved}
                        formDetails={formDetails}
                        fileNameMapping={fileNameMapping}
                        handleInputFields={handleInputFields}
                        dataKeys={dataKeys}
                        setDataKeys={setDataKeys}
                    />
                    {mode !== modeType.design && (
                        <>
                            <div className="row">
                                <div className="col-sm-12">
                                    <span className="text-danger">
                                        {infoMsg}
                                    </span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-12">
                                    {processConfig.showActions ? (
                                        <div className="d-flex float-end mt-2">
                                            {processConfig?.showDraftButton && processConfig.showDraftButton &&
                                                mode !== modeType.readonly && (
                                                    <button
                                                        id="save-as-draft"
                                                        type="button"
                                                        className="mx-2 btn button-theme btn-sm"
                                                        onClick={() =>
                                                            handleMainSave(
                                                                actions.draft,
                                                            )
                                                        }
                                                        disabled={
                                                            !processConfig.allowComplete ||
                                                            !isValid
                                                                ? true
                                                                : false
                                                        }>
                                                        <span>
                                                            Save as Draft
                                                        </span>
                                                    </button>
                                                )}
                                            <button
                                                id="task-complete"
                                                type="button"
                                                className="mx-2 btn button-theme btn-sm"
                                                onClick={() =>
                                                    handleMainSave(
                                                        actions.complete,
                                                    )
                                                }
                                                disabled={
                                                    !processConfig.allowComplete ||
                                                    !isValid
                                                        ? true
                                                        : false
                                                }>
                                                {submitLabel ? (
                                                    <span>{submitLabel}</span>
                                                ) : (
                                                    <span>Submit</span>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="d-flex float-end mt-2">
                                                {processConfig.showDraftButton && (
                                                    <button
                                                        id="save-as-draft"
                                                        type="button"
                                                        className="mx-2 btn button-theme btn-sm"
                                                        onClick={() =>
                                                            handleMainSave(
                                                                actions.draft,
                                                            )
                                                        }>
                                                        <span>
                                                            Save as Draft
                                                        </span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMainSave(
                                                            actions.complete,
                                                        )
                                                    }
                                                    className="mx-2 btn button-theme  btn-sm">
                                                    {submitLabel ? (
                                                        <span>
                                                            {submitLabel}
                                                        </span>
                                                    ) : (
                                                        <span>Save</span>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ProcessFormViewer;
