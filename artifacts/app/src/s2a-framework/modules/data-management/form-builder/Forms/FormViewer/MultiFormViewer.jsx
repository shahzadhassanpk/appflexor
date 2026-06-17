import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../../Config";
import { componentList } from "../../Designer/ComponentRegistry";
import RenderFormFields from "./RenderFormFields";
import { actions, modeType } from "./constants";
import {
    checkMultiPageValidation,
    checkValidation,
    formatDateForDataBase,
    formatDateTimeForDataBase,
    formatTimeForDataBase,
    getObjectSchemeForValidation,
    getSchemeForValidationMultiPageForm,
    isEmpty,
    tryEval,
    tryParseJSONObject,
} from "./utils";
import { makeShortId } from "../../../../../utils/utils";
const uniqueFormId = makeShortId(4);

const MultiFormViewer = ({
    form,
    businessKey,
    mode = modeType.render,
    handleActions,
    formData: datalistFormData,
    submitLabel,
    formVars = {},
}) => {
    // Form Data
    const [formData, setFormData] = useState(formVars);
    const [formDetails, setFormDetails] = useState({});
    const [formId, setFormId] = useState({});
    const [isFormSaved, setIsFormSaved] = useState(false);
    // Form Files
    const [filesContent, setFilesContent] = useState([]);
    const [fileNameMapping, setFileNameMapping] = useState({});

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

    // const lastBusinessKey = useRef(null);

    useEffect(() => {
        if (form) {
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
                    setMultipageDesign(parsedDesign);

                    const components = {};
                    for (let item of parsedDesign) {
                        const design = item.design;
                        const comps = design.components;
                        for (let key in comps) {
                            const comp = comps[key];
                            components[key] = comp;
                        }
                    }
                    extractColumns(components);
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
                    setFormId(form.id);
                } catch (error) {
                    console.error(error);
                }
            }
            setFormDetails(_formDetails);
        }
    }, [form]);

    useEffect(() => {
        if (
            formDetails.enableMultipage &&
            formDetails.enableMultipage === "YES"
        ) {
            if (
                (mode === modeType.preview || mode === modeType.render) &&
                multipageDesign.length !== 0
            ) {
                if (businessKey === "new" || businessKey === "") {
                    const defalutFormData =
                        getSchemeForValidationMultiPageForm(multipageDesign);
                    defalutFormData.id = "new";
                    setFormData(defalutFormData);
                }
                setLayoutLoaded(true);
            }
        } else {
            if (
                (mode === modeType.preview || mode === modeType.render) &&
                !isEmpty(components) &&
                layout.length !== 0
            ) {
                if (businessKey === "new" || businessKey === "") {
                    const defalutFormData = getObjectSchemeForValidation(
                        layout,
                        components,
                        {},
                    );
                    defalutFormData.id = "new";
                    if (!isEmpty(defalutFormData)) setFormData(defalutFormData);
                }
                setLayoutLoaded(true);
            }
        }
    }, [formDetails, layout, components, multipageDesign, businessKey]);

    useEffect(() => {
        if (datalistFormData) setFormData(datalistFormData);
    }, [datalistFormData]);

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
                // if (!isEmpty(value)) {
                setFormData(prev => ({
                    ...prev,
                    [key]: value,
                }));
                // }
                break;
            }
        }

        // setIsValidForm(prev => ({
        //     ...prev,
        //     [key]: isValid,
        // }));
    };

    async function handleMainSave(actionType) {
        let validations = {};
        setIsFormSaved(true);
        if (
            formDetails.enableMultipage &&
            formDetails.enableMultipage === "YES"
        ) {
            validations = checkMultiPageValidation(formData, multipageDesign);
        } else {
            validations = checkValidation(formData, layout, components);
        }

        if (validations.isValid) {
            let result = await saveMainForm();
            if (result) {
                let { mainId, resObj, reqPayload } = result;
                if (!isEmpty(resObj)) setFormData(resObj);
                // setFilesToDelete([]);

                if (handleActions) {
                    handleActions(
                        actionType,
                        resObj,
                        formDetails,
                        components,
                        reqPayload,
                    );
                }
            }

            // await handleSaveData(actionType);
        } else if (!validations.isValid) {
            let invalidLabels = validations.invalidLabels;
            invalidLabels = [...new Set(invalidLabels)];

            let msg = "Invalid fields : " + `${invalidLabels.join(", ")}.`;

            setInfoMsg(msg);
            setTimeout(() => {
                setInfoMsg("");
            }, 8000);
            return null;
        }
    }
    function extractColumns(components) {
        try {
            const columns = { id: "id" };
            for (let key in components) {
                const component = components[key];
                const db_column = component.data.db_column;
                const type = component.type;
                if (db_column && type === "autoincrement") {
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

    function onlyFormFields(fieldData) {
        for (let key in fieldData) {
            if (key !== "business_key" && !columns[key]) {
                delete fieldData[key];
            }
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

        onlyFormFields(fieldsData);

        let datasource = "";

        if (formDetails.datasource) {
            datasource = formDetails.datasource;
        }

        let request = {
            datasource: datasource,
            usePrefix: formDetails.useprefix,
        };
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";
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
        <div className="s2a-form-viewer">
            
            {!layoutLoaded ? (
                <center>Loading Form...</center>
            ) : (
                <div className="py-2 container-fluid s2a-page-layout multiform-viewer">
                    <div className="row"><div className="s2a-form-title">{form?.name}</div></div>
                    <RenderFormFields
                        multipageDesign={multipageDesign}
                        uniqueFormId={uniqueFormId}
                        layout={layout}
                        components={components}
                        images={images}
                        htmlCollection={htmlCollection}
                        mode={mode}
                        formData={formData}
                        formId={formId}
                        isFormSaved={isFormSaved}
                        formDetails={formDetails}
                        fileNameMapping={fileNameMapping}
                        handleInputFields={handleInputFields}
                    />

                    {mode !== modeType.design && (
                        <div className="d-flex justify-content-between align-items-center">
                            <span></span>
                            <span className="text-danger">{infoMsg}</span>

                            <button
                                type="button"
                                onClick={() => handleMainSave(actions.complete)}
                                className="ms-2 btn button-theme btn-sm">
                                {submitLabel ? (
                                    <span>{submitLabel}</span>
                                ) : (
                                    <span>Save</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiFormViewer;
