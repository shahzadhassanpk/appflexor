import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL } from "../../../../../Config";
import { componentList } from "../../Designer/ComponentRegistry";
import RenderFormFields from "./RenderFormFields";
import { actions, modeType } from "./constants";
import {
    checkValidation,
    formatDateForDataBase,
    formatDateTimeForDataBase,
    formatTimeForDataBase,
    getObjectSchemeForValidation,
    isEmpty,
    tryEval,
    tryParseJSONObject,
} from "./utils";
import { AppContext } from "../../../../../../../AppContext";

const ProcessFormViewer = ({
    formKey,
    businessKey = "new",
    submitLabel,
    processVariables,
    formVars = {},
    processConfig = {
        showActions: false,
        showDraftButton: false,
        allowComplete: false,
    },
    mode = modeType.render,
    handleActions,
    external,
}) => {
    // Form Data
    const [formData, setFormData] = useState({});
    const [formDetails, setFormDetails] = useState({});

    // Form Files
    const [filesContent, setFilesContent] = useState([]);
    const [fileNameMapping, setFileNameMapping] = useState({});
    const [fileDataParsed, setFileDataParsed] = useState({});
    const [filesToDelete, setFilesToDelete] = useState([]);

    // Layout
    const [layout, setLayout] = useState([]);
    const [layoutLoaded, setLayoutLoaded] = useState(false);
    const [images, setImages] = useState({});
    const [htmlCollection, setHtmlCollection] = useState({});
    const [components, setComponents] = useState({});

    const [infoMsg, setInfoMsg] = useState("");
    const [columns, setColumns] = useState({});
    const appContext = useContext(AppContext);
    const tenantId = appContext?.tenantSubscription?.tenant_id || "default";

    // const lastBusinessKey = useRef(null);

    useEffect(() => {
        if (layout.length > 0) {
            setLayoutLoaded(true);
        }

        if (
            (mode === modeType.preview || mode === modeType.render) &&
            !isEmpty(components) &&
            layout.length !== 0
        ) {
            if (businessKey === "new") {
                const defalutFormData = getObjectSchemeForValidation(
                    layout,
                    components,
                    processVariables,
                    formVars,
                );
                setFormData(defalutFormData);
            }
            setLayoutLoaded(true);
        }
    }, [layout, components, businessKey]);

    useEffect(() => {
        // if (lastFormKey.current === null || lastFormKey.current !== formKey) {
        if (formKey && formKey !== "") {
            getForm(formKey);
            // lastFormKey.current = formKey;
        }
        // }
    }, [formKey]);

    useEffect(() => {
        // if (
        //     lastBusinessKey.current === null ||
        //     lastBusinessKey.current !== businessKey
        // ) {
        if (layoutLoaded && businessKey !== "new") {
            getFormData(businessKey, formKey);
            // lastBusinessKey.current = businessKey;
        }
        // }
    }, [businessKey, layoutLoaded]);

    // useEffect(() => {
    //     if (handleChange) {
    //         if (!isEmpty(formData) && !isEmpty(formDetails)) {
    //             handleChange(formData, formDetails, filesContent);
    //         }
    //     }
    // }, [formData, formDetails, filesContent]);

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
                setFormData(prev => ({
                    ...prev,
                    [key]: newValue,
                }));
                break;
            }
            default: {
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

    function applyFormSettings(form) {
        try {
            let parsedDesign = tryParseJSONObject(form.design, {
                layout: [],
                components: {},
                images: {},
                htmlCollection: {},
            });
            let layout = parsedDesign.layout;
            let components = parsedDesign.components;
            let images = parsedDesign.images;
            let htmlCollection = parsedDesign.htmlCollection;

            let obj = {
                formKey: form.form_key,
                name: form.name,
                table: form.table,
                datasource: form.datasource,
                useprefix: form.useprefix,
            };

            setFormDetails(obj);
            setLayout(layout);
            setComponents(components);
            extractColumns(components);
            setImages(images);
            setHtmlCollection(htmlCollection);
        } catch (error) {
            console.error(error);
        }
    }

    function getForm(formKey) {
        // debugger;
        // let cachedForm = localStorage.getItem(`${tenantId}:${formKey}`);
        // if(cachedForm){
        //     let form = JSON.parse(cachedForm);
        //     applyFormSettings(form);
        //     return;
        // }
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
                        // localStorage.setItem(`${tenantId}:${formKey}`, JSON.stringify(form));
                        applyFormSettings(form);
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

    function getFormData(_businessKey, _formKey) {
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
                    getFormData(_businessKey, _formKey);
                }
                if (response.data.C_DATA) {
                    let formDataTemp = response.data.C_DATA.formData;
                    setFormData(formDataTemp[0]);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function handleMainSave(actionType) {
        let validations = checkValidation(formData, layout, components);

        if (validations.isValid) {
            let result = await saveMainForm();
            if (result) {
                let { mainId, resObj, reqPayload } = result;

                setFormData(resObj);
                // setFilesToDelete([]);

                if (handleActions) {
                    handleActions(
                        actionType,
                        resObj,
                        formDetails,
                        components,
                        reqPayload,
                        external,
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
            }, 3000);
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
        <span>
            {!layoutLoaded ? (
                <span>Loading...</span>
            ) : (
                <div className="container-fluid">
                    <RenderFormFields
                        layout={layout}
                        components={components}
                        mode={mode}
                        images={images}
                        htmlCollection={htmlCollection}
                        formData={formData}
                        formDetails={formDetails}
                        fileNameMapping={fileNameMapping}
                        handleInputFields={handleInputFields}
                    />

                    {mode !== modeType.design && mode !== modeType.readonly && (
                        <>
                            {processConfig.showActions ? (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center my-1">
                                        <span></span>
                                        <span className="text-danger">
                                            {infoMsg}
                                        </span>
                                        <span></span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center my-1">
                                        <span></span>
                                        <span></span>
                                        <span>
                                            {processConfig.showDraftButton && (
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
                                                        !processConfig.allowComplete
                                                            ? true
                                                            : false
                                                    }>
                                                    <span>Save as Draft</span>
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
                                                    !processConfig.allowComplete
                                                        ? true
                                                        : false
                                                }>
                                                {submitLabel ? (
                                                    <span>{submitLabel}</span>
                                                ) : (
                                                    <span>Submit</span>
                                                )}
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="d-flex justify-content-between align-items-center my-1">
                                    <span></span>
                                    <span className="text-danger">
                                        {infoMsg}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleMainSave(actions.complete)
                                        }
                                        className="mx-2 btn button-theme  btn-sm">
                                        {submitLabel ? (
                                            <span>{submitLabel}</span>
                                        ) : (
                                            <span>Save</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </span>
    );
};

export default ProcessFormViewer;
