import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { API_URL } from "../../../../../Config";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import RenderFormFields from "./RenderFormFields";
import { actions, modeType } from "./constants";
import { AppContext } from "../../../../../../AppContext";
import {
    checkMultiPageValidationExp,
    checkMultiPageValidation,
    checkValidationExp,
    checkValidation,
    getObjectSchemeForValidation,
    getSchemeForValidationMultiPageForm,
    isEmpty,
    tryParseJSONObject,
} from "./utils";
import useGlobalData from "../../../../../components/useGlobal";
import { makeShortId } from "../../../../../utils/utils";
import Loading from "../../../../../components/Loading/loading";
const uniqueFormId = makeShortId(4);

const DataListFormViewer = ({
    formKey,
    businessKey = "new",
    mode = modeType.render,
    handleActions,
    fkColumn = "",
    fkValue = "",
    nextElementId = "",
    external,
    parentFormData,
    handleClose,
    showTitle = false,
    tenantIdMain = "",
    confirmationMessage = "",
    formVars = {},
}) => {
    // Form Data
    const [tenantId, setTenantId] = useState(tenantIdMain);
    const [form, setForm] = useState({});
    const [formData, setFormData] = useState({});
    const [formDetails, setFormDetails] = useState({});
    const [isFormSaved, setIsFormSaved] = useState(true);
    const [dataKeys, setDataKeys] = useState({});
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

    // Multi Layout Design
    const [multipageDesign, setMultipageDesign] = useState([]);

    const [infoMsg, setInfoMsg] = useState("");
    const [columns, setColumns] = useState({});
    const expressionProps = useGlobalData();
    const appContext = useContext(AppContext);
    // const lastBusinessKey = useRef(null);

    useEffect(() => {
        if (!formVars && !isEmpty(formVars)) {
            console.log("******** formVars: " + formVars);
        }
    }, [formVars]);
    useEffect(() => {
        if (!tenantIdMain || tenantIdMain === "") {
            setTenantId(appContext?.tenantSubscription?.datasource);
        }
    }, [tenantIdMain]);
    useEffect(() => {
        console.log("************* fkColumn > " + fkColumn);
        console.log("************* fkValue > " + fkValue);
    }, [fkColumn, fkValue]);
    useEffect(() => {
        // if (lastFormKey.current === null || lastFormKey.current !== formKey) {
        if (formKey && formKey !== "") {
            getForm(formKey);
            // lastFormKey.current = formKey;
        }
        // }
    }, [formKey]);
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

                    setMultipageDesign(parsedDesign);
                    // add by haider
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
        }
    }, [form]);

    useEffect(() => {
        if (
            formDetails.enableMultipage &&
            formDetails.enableMultipage === "YES"
        ) {
            if (
                (mode === modeType.preview ||
                    mode === modeType.render ||
                    mode === modeType.readonly) &&
                multipageDesign.length !== 0
            ) {
                if (businessKey === "new" || businessKey === "") {
                    const defalutFormData =
                        getSchemeForValidationMultiPageForm(multipageDesign);
                    defalutFormData.id = "new";
                    if (!isEmpty(defalutFormData)) setFormData(defalutFormData);
                }
                setLayoutLoaded(true);
            }
        } else {
            if (
                (mode === modeType.preview ||
                    mode === modeType.render ||
                    mode === modeType.readonly) &&
                !isEmpty(components) &&
                layout.length !== 0
            ) {
                // Setting defaults for form data
                const defalutFormData = getObjectSchemeForValidation(
                    layout,
                    components,
                    {},
                    formVars,
                    expressionProps,
                );
                if (fkColumn) defalutFormData[fkColumn] = fkValue;
                defalutFormData.id = "new";
                if (!isEmpty(defalutFormData)) setFormData(defalutFormData);
                //Commented below as for datalist bussiness key will never be empty
                // if (businessKey === "new" || businessKey === "") {
                //     const defalutFormData = getObjectSchemeForValidation(
                //         layout,
                //         components,
                //         {},
                //         formVars,
                //     );
                //     if (fkColumn) defalutFormData[fkColumn] = fkValue;
                //     defalutFormData.id = "new";
                //     if (!isEmpty(defalutFormData)) setFormData(defalutFormData);
                // }
                setLayoutLoaded(true);
            }
        }
    }, [formDetails, layout, components, multipageDesign, businessKey]);

    useEffect(() => {
        // if (
        //     lastBusinessKey.current === null ||
        //     lastBusinessKey.current !== businessKey
        // ) {

        if (layoutLoaded && businessKey !== "new" && nextElementId === "") {
            getFormData(businessKey, formKey);
            // lastBusinessKey.current = businessKey;
        } else if (nextElementId) {
            getFormData(nextElementId, formKey);
        }
        // }
    }, [businessKey, layoutLoaded, nextElementId]);

    useEffect(() => {
        if (parentFormData && !isEmpty(parentFormData)) {
            setFormData(parentFormData);
        }
    }, [parentFormData]);

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
            tenant_id: tenantId,
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
                // debugger
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

    function getFormData(_businessKey, _formKey) {
        var dataRequest = {
            businessKey: _businessKey,
            datasource: formDetails.datasource,
            tenant_id: tenantId,
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
                    if (!isEmpty(formDataTemp)) setFormData(formDataTemp[0]);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    async function handleMainSave(actionType) {
        let validations = {};

        setIsFormSaved(true);
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

        if (validations.isValid) {
            if (confirmationMessage && confirmationMessage !== "") {
                if (!confirm(confirmationMessage)) {
                    return;
                }
            }
            let result = await saveMainForm();
            setIsFormSaved(true);
            if (result) {
                let { mainId, resObj, reqPayload } = result;
                if (!isEmpty(resObj)) setFormData(resObj);
                // setFilesToDelete([]);
                debugger;
                if (handleActions) {
                    const formStatus =
                        formData.id === "new" || !formData.id ? "add" : "edit";
                    handleActions(
                        actionType,
                        resObj,
                        formDetails,
                        components,
                        reqPayload,
                        external,
                        handleClose,
                        formStatus,
                        setFormData,
                        form,
                    );
                    if (nextElementId) getFormData(nextElementId, formKey);
                }
            }

            // await handleSaveData(actionType);
        } else if (!validations.isValid) {
            let invalidLabels = validations.invalidLabels;
            invalidLabels = [...new Set(invalidLabels)];

            let msg = "Invalid data : " + `${invalidLabels.join(", ")}.`;

            setInfoMsg(msg);
            setTimeout(() => {
                setInfoMsg("");
            }, 3000);
            return null;
        }
    }

    async function saveMainForm() {
        setIsFormSaved(false);
        let fieldsData = {};
        if (fkValue && fkColumn) {
            fieldsData = { ...formData, [fkColumn]: fkValue };
        } else {
            fieldsData = { ...formData };
        }
        onlyFormFields(fieldsData);

        // when datalist is used inside form the parent form will provide fkValue and fkColumn
        if (fkValue !== "" && fkColumn !== "") {
            fieldsData = { ...fieldsData, [fkColumn]: fkValue };
        }
        let datasource = "";
        if (formDetails.datasource) {
            datasource = formDetails.datasource;
        }

        let request = {
            tenant_id: tenantId,
            datasource: datasource,
            usePrefix: formDetails.useprefix,
        };
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
                    setIsFormSaved(true);
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    function onlyFormFields(fieldData) {
        for (let key in fieldData) {
            if (key !== "business_key" && !columns[key]) {
                delete fieldData[key];
            }
        }
    }

    function setBtnHorizontalPosition() {
        let className = "p-0 d-flex";
        const horizontalMap = {
            Left: "flex-row",
            Right: "flex-row-reverse",
            undefined: "flex-row",
        };
        const horizontalPosition = form?.btn_horizontal_position;

        if (horizontalPosition) {
            className += ` ${horizontalMap[horizontalPosition]}`;
        }

        return className;
    }

    function checkTopPosition() {
        if (form?.btn_vertical_position) {
            const position = form.btn_vertical_position.split(";");
            const showTopBtn = position.includes("Top");
            return showTopBtn;
        }
    }

    function checkBottomPosition() {
        let show;
        if (form?.btn_vertical_position) {
            const position = form.btn_vertical_position.split(";");
            const showBottomBtn = position.includes("Bottom");
            show = showBottomBtn;
        }
        return show;
    }

    return (
        <ErrorBoundary>
            <div className="datalist__formviewer s2a-datalist-formviewer">
                {/* <code>{JSON.stringify(formVars)}</code> */}

                {!layoutLoaded ? (
                    <Loading message="Loading Form" />
                ) : (
                    <div className="s2a-form">
                        <div className="row">
                            {mode !== modeType.design && checkTopPosition() && (
                                <div className={setBtnHorizontalPosition()}>
                                    <span className="action-row-top text-end d-inline-flex">
                                        {!form.close_on_save && (
                                            <button
                                                type="button"
                                                onClick={() => handleClose()}
                                                className="ms-1 btn button-theme btn-sm">
                                                Close
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleMainSave(actions.complete)
                                            }
                                            className={
                                                !form?.close_on_save
                                                    ? "ms-2 btn button-theme btn-sm"
                                                    : "ms-1 btn button-theme btn-sm"
                                            }>
                                            Save
                                        </button>
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="container">
                            {/* <code>{JSON.stringify(formDetails)}</code> */}
                            {showTitle && (
                                <div className="row">
                                    <div className="col title-text s2a-form-title p-2">
                                        <span>{formDetails.name}</span>
                                    </div>
                                </div>
                            )}
                            {layoutLoaded && formData.id && (
                            <RenderFormFields
                                multipageDesign={multipageDesign}
                                uniqueFormId={uniqueFormId}
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
                                fkColumn={fkColumn}
                                fkValue={fkValue}
                                dataKeys={dataKeys}
                                setDataKeys={setDataKeys}
                            />
                            )}
                        </div>
                        <div className="row action-row-bottom">
                            {mode !== modeType.design &&
                                checkBottomPosition() && (
                                    <div className={setBtnHorizontalPosition()}>
                                        <span className="text-end d-inline-flex">
                                            {form.close_on_save && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleClose()
                                                    }
                                                    className="ms-1 btn button-theme btn-sm">
                                                    Close
                                                </button>
                                            )}
                                            {}
                                            {mode !== modeType.readonly && (
                                                <button
                                                    type="button"
                                                    disabled={mode === modeType.readonly || !isFormSaved}
                                                    onClick={() =>
                                                        handleMainSave(
                                                            actions.complete,
                                                        )
                                                    }
                                                    className={
                                                        !form?.close_on_save
                                                            ? "ms-2 btn button-theme btn-sm"
                                                            : "ms-1 btn button-theme btn-sm"
                                                    }>
                                                    {isFormSaved?'Save':"Saving.."}
                                                </button>
                                            )}
                                        </span>
                                    </div>
                                )}
                        </div>
                        <div className="row mt-2 text-center">
                            <span className="text-danger">{infoMsg}</span>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default DataListFormViewer;
