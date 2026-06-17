import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, BPM_API_URL } from "../../../../Config";
import { componentList } from "../Designer/ComponentRegistry";

/*

    File Viewer takes form key for fetching form layout, formId or businessKey
    (primarily the same thing, these terms are
    interchangabel) for fetching form data,
    handleActions is called when form is saved or failed with an action type param
    handled by Parent Component. Right now form is used in '2' modules
    only 'DataList' and 'Processes' for Processes there is flag 'processConfig' set to true in
    Process mode only

 */

export const actions = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};

export const modeType = {
    design: "DESIGN_MODE",
    preview: "PREVIEW_MODE",
    readonly: "READONLY_MODE",
    render: "RENDER_MODE",
};

const FormViewer = ({
    formKey,
    businessKey,
    submitLabel,

    processConfig = {
        showActions: false,
        showDraftButton: false,
        allowComplete: false,
    },
    isProcessForm = false,
    isSubForm = false,
    processVariables,
    mode = modeType.render,
    handleActions,
    handleChange,
}) => {
    // Form
    const [formData, setFormData] = useState({});
    const [copy, setCopy] = useState({});
    const [formDetails, setFormDetails] = useState({});
    const [infoMsg, setInfoMsg] = useState("");
    const [isValidForm, setIsValidForm] = useState({});
    const [filesContent, setFilesContent] = useState([]);
    const [fileNameMapping, setFileNameMapping] = useState({});
    const [fileDataParsed, setFileDataParsed] = useState({});
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [subFormData, setSubFormData] = useState({});
    const [subFormCount, setSubFormCount] = useState(0);
    const [subFormDefaultConfig, setSubFormDefaultConfig] = useState({});

    const [layoutLoaded, setLayoutLoaded] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    const subFormDataRef = useRef({});
    // Layout
    const [layout, setLayout] = useState([]);
    const [images, setImages] = useState({});
    const [components, setComponents] = useState({});
    const [selectedData, setSelectedData] = useState({});

    useEffect(() => {
        if (
            (mode === modeType.preview || mode === modeType.render) &&
            !isEmpty(components) &&
            layout.length !== 0
        ) {
            setObjectSchemeForValidation(layout, components);
            setLayoutLoaded(true);
            console.log("layout loaded");
        }
        console.log(layout);
    }, [layout, components]);

    const lastFormKey = useRef(null);
    const lastBusinessKey = useRef(null);

    useEffect(() => {
        // if (lastFormKey.current === null || lastFormKey.current !== formKey) {
        if (formKey && formKey !== "") {
            getForm(formKey);
            lastFormKey.current = formKey;
        }
        // }
    }, [formKey]);

    useEffect(() => {
        // if (
        //     lastBusinessKey.current === null ||
        //     lastBusinessKey.current !== businessKey
        // ) {
        if (layoutLoaded && businessKey !== "" && businessKey !== "new") {
            getFormData(businessKey, formKey);
            lastBusinessKey.current = businessKey;
        }
        // }
    }, [businessKey, layoutLoaded]);

    useEffect(() => {
        if (handleChange) {
            if (!isEmpty(formData) && !isEmpty(formDetails)) {
                handleChange(formData, formDetails, filesContent);
            }
        }
    }, [formData, formDetails, filesContent]);

    function deleteFile(file) {
        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        };
        try {
            axios
                .delete(
                    `/file/service/${file.table}/${file.id}/${file.name}`,
                    config,
                )
                .then(function (response) {});
        } catch (e) {
            console.error("Error while sending delete request:" + e);
        }
    }

    const handleInputFields = (
        key = "",
        value = "",
        isValid = false,
        type = "text",
        fileData = "",
        state = {},
        formDetails = {},
    ) => {
        if (type === "subform") {
            console.log(formData);
            console.log(state, formDetails);

            if (!isEmpty(state) && !isEmpty(formDetails)) {
                // console.log("Last state of subFormDataRef");

                // console.log(subFormData);
                // console.log(subFormDataRef.current);

                let tempObj = { ...subFormData };
                let tempObjRef = { ...subFormDataRef.current };

                tempObj[key] = {
                    formData: state,
                    formDetails: { ...formDetails, db_column: key },
                };

                tempObjRef[key] = {
                    formData: state,
                    formDetails: { ...formDetails, db_column: key },
                };
                // console.log("current state of tempObjRef");
                // console.log(tempObj);
                // console.log(tempObjRef);

                // ;
                setSubFormData(tempObj);
                subFormDataRef.current = { ...tempObjRef };
                // console.log(subFormDataRef);
            }
        }
        if (type === "text") {
            setFormData(prev => ({
                ...prev,
                [key]: value,
            }));
        } else if (type === "file") {
            const data = tryParseJSONObject(value, []);

            // const deletedFiles = data.filter(
            //     (file) => file.status === "DELETED"
            // );
            // console.log(deletedFiles);
            // setFilesToDelete(deletedFiles);
            const _fileDataParsed = data.filter(file => {
                return file.status !== "DELETED" || file.status === undefined;
            });

            setFileDataParsed(_fileDataParsed);
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
        }

        // setIsValidForm((prev) => ({
        //     ...prev,
        //     [key]: isValid,
        // }));

        // hanldeChange(key, value)
    };

    const setObjectSchemeForValidation = (layout, components) => {
        let tempObj = {};
        let subFormCount = 0;
        let subFormDefaultConfig = {};
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;
                    let value = foundComponent.data.value;
                    let type = foundComponent.type;
                    // can set initial value from default values for fields here
                    if (key !== undefined) {
                        if (type === "subform") {
                            subFormCount = subFormCount + 1;
                            subFormDefaultConfig = {
                                ...subFormDefaultConfig,
                                [key]: value,
                            };
                            //  if it is subform then its data will be kept in `subFormDefaultConfig` and not in `formData`
                            // tempObj = {
                            //     ...tempObj,
                            //     [key]: value,
                            // };
                        } else if (type !== "subform") {
                            tempObj = {
                                ...tempObj,
                                [key]: value,
                            };
                            // !TODO test this if it fixes checkbox bug
                            // if (type === "checkbox") {
                            //     tempObj = {
                            //         ...tempObj,
                            //         [key]: "",
                            //     };
                            // } else {
                            //     tempObj = {
                            //         ...tempObj,
                            //         [key]: value,
                            //     };
                            // }
                        }
                    }
                });
            });
        });

        if (!isEmpty(processVariables)) {
            // const processkeys = Object.keys(processVariables)
            const tempObjkeys = Object.keys(tempObj);

            tempObjkeys.map(key => {
                if (processVariables[key] !== undefined) {
                    tempObj[key] = processVariables[key].value;
                }
            });
        }
        setSubFormCount(subFormCount);
        setFormData(tempObj);
        setSubFormDefaultConfig(subFormDefaultConfig);
    };

    // TODO: check validations
    const checkValidation = (objToValidate, layout, components) => {
        let isValid = false;
        let invalidKeys = [];
        let invalidLabels = [];
        let message = "";
        // console.log(obj);
        if (isEmpty(objToValidate)) {
            isValid = false;
            message =
                "Required columns are empty. This may result to false validations.";

            return {
                isValid,
                invalidKeys,
                invalidLabels,
                message,
            };
        }
        let schemaArr = [];
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;
                    let label = foundComponent.data.label;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let required = foundComponent.data.required;
                    let obj = {};
                    if (key !== undefined) {
                        obj = {
                            ...obj,
                            [key]: {
                                required,
                                regex,
                                label,
                                key: key,
                                type: foundComponent.type,
                            },
                        };
                        schemaArr.push(obj);
                    }
                });
            });
        });
        for (let i = 0; i < schemaArr.length; i++) {
            let objFound = schemaArr[i];
            let keys = Object.keys(objFound);
            let validationSchema = objFound[keys[0]];

            if (objToValidate[validationSchema.key] !== undefined) {
                if (validationSchema.required === "YES") {
                    try {
                        if (validationSchema.regex.length > 0) {
                            const regexExp = new RegExp(validationSchema.regex);
                            let strToValidate =
                                objToValidate[validationSchema.key];
                            let strIsValid = regexExp.test(strToValidate);

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.key);
                                invalidLabels.push(validationSchema.label);
                            }
                        } else if (validationSchema.type === "checkbox") {
                            let strToValidate =
                                objToValidate[validationSchema.key];

                            let strIsValid =
                                strToValidate === "YES" ? true : false;

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.key);
                                invalidLabels.push(validationSchema.label);
                            }
                        } else {
                            let strToValidate =
                                objToValidate[validationSchema.key];
                            let strIsValid =
                                strToValidate.length > 0 ? true : false;

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.key);
                                invalidLabels.push(validationSchema.label);
                            }
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
        if (invalidKeys.length === 0) {
            isValid = true;
            message = "Validations passed successfully.";
        }
        return {
            isValid,
            invalidKeys,
            invalidLabels,
            message,
        };
    };

    const handleValidation = () => {
        let validations = checkValidation(formData, layout, components);
        return validations;
    };

    // API

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

                        try {
                            let parsedDesign = tryParseJSONObject(form.design, {
                                layout: [],
                                components: {},
                                images: {},
                            });
                            let layout = parsedDesign.layout;
                            let components = parsedDesign.components;
                            let images = parsedDesign.images;

                            let obj = {
                                formKey: form.form_key,
                                name: form.name,
                                table: form.table,
                            };
                            setFormDetails(obj);
                            setLayout(layout);

                            setComponents(components);
                            setImages(images);
                        } catch (error) {
                            console.error(error);
                        }
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

    function tryParseJSONObject(jsonString, defaultValue) {
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object") {
                return o;
            }
        } catch (e) {}

        return defaultValue;
    }

    function prepareProcessData(formData, layout, components) {
        let tempObj = {};
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];

                    let processRef = foundComponent.data.processRef;
                    let key = foundComponent.data.db_column;

                    if (processRef !== undefined && processRef.length > 0) {
                        tempObj = {
                            ...tempObj,
                            [processRef]: formData[key],
                        };
                    }
                });
            });
        });
        return tempObj;
    }

    function handleFileChanges(data, copy, map, parsedData) {
        // console.log(data);
        // console.log(copy);
        // console.log(map);
        // console.log(parsedData);
    }

    async function handleSaveSubFormData(mainId) {
        let request = {};
        let data = [];

        console.log("businessKey" + businessKey);
        console.log(subFormDefaultConfig);
        console.log(formData);

        let _subFormDefaultConfig = { ...subFormDefaultConfig };
        console.log("businessKey" + businessKey);
        console.log(_subFormDefaultConfig);
        console.log(formData);
        console.log();

        console.log("businessKey" + businessKey);

        let keys = Object.keys(subFormDataRef.current);
        // let keys = Object.keys(subFormData);

        keys.forEach(key => {
            let _data = subFormDataRef.current[key];
            // let _data = subFormData[key];

            let newId =
                _data.formData.id !== undefined ? _data.formData.id : "new";
            let columnName = "";

            if (_subFormDefaultConfig[key] !== undefined) {
                // _formData[key] = `${item.formKey};${item.id}`;
                let str = _subFormDefaultConfig[key];
                let obj = tryParseJSONObject(str, {});
                console.log(obj);
                if (obj.saveId === "SAVE_ID_IN_SUB_FORM") {
                    let colName =
                        obj.columnName !== undefined ? obj.columnName : "";

                    columnName = colName;

                    // obj.formData = { ...obj.formData, [colName]: mainId };
                }
            }

            let obj = {
                id: newId,
                entity: _data.formDetails.table,
                formId: _data.formDetails.table,
                action: "update",
                dataKey: _data.formDetails.db_column,
            };

            if (columnName !== "") {
                obj.formData = {
                    ..._data.formData,
                    id: newId,
                    [columnName]: mainId,
                };
            } else {
                obj.formData = {
                    ..._data.formData,
                    id: newId,
                };
            }

            data.push(obj);
        });
        request.data = data;
        console.log(request);
        return new Promise((resolve, reject) => {
            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS == "SUCCESS") {
                        let resArr = response.data.C_DATA;
                        let tempArr = [];
                        resArr.forEach(item => {
                            let obj = {
                                id: item.formData.id,
                            };
                            // for (const element in subFormData) {
                            for (const element in subFormDataRef.current) {
                                let dataKey = item.dataKey;
                                let dbColumn =
                                    // subFormData[element].formDetails.db_column;
                                    subFormDataRef.current[element].formDetails
                                        .db_column;
                                if (dataKey === dbColumn) {
                                    obj.formKey =
                                        subFormDataRef.current[
                                            element
                                        ].formDetails.formKey;
                                    // subFormData[
                                    //     element
                                    // ].formDetails.formKey;
                                    obj.col = item.dataKey;
                                }
                            }
                            // let keys = Object.keys(subFormData);
                            // keys.forEach(key => {
                            //     ;
                            //     let _data = subFormData[key];
                            //     if (item.entity === _data.formDetails.table) {
                            //     }
                            // });

                            tempArr.push(obj);
                        });

                        resolve(tempArr);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(error);
                });
        });

        // Manage files of subform
        // let fieldsData = { ...data.formData };
        // let request = {};
        // request.data = [];
        // let entityForm = {};

        // entityForm.formId = data.formDetails.table;
        // entityForm.entity = data.formDetails.table;
        // entityForm.action = "update";
        // entityForm.fileData = [];

        // if (fieldsData.id && fieldsData.id !== "") {
        //     entityForm.id = fieldsData.id;
        // } else {
        //     entityForm.id = "new";
        //     fieldsData.id = "new";
        // }

        // delete fieldsData.inq_no;
        // entityForm.formData = fieldsData;

        // request.data.push(entityForm);
        // ;
        // axios
        //     .post(API_URL + "?service.key=update.formData", request)
        //     .then(response => {
        //         ;
        //         if (response.data.C_STATUS == "SUCCESS") {
        //             let resObj = response.data.C_DATA[0].formData;

        //             resolve({
        //                 id: resObj.id,
        //                 key: formDetails.formKey,
        //             });
        //         }
        //     })
        //     .catch(error => {
        //         console.error(error);
        //     });

        // let temp = [];
        // let promise = await new Promise((resolve, reject) => {
        //     ;
        //     console.log(subFormData);

        //     ;
        //     resolve(temp);
        // });

        // return promise;
    }

    async function handleMainSave(actionType) {
        let validations = handleValidation();

        if (validations.isValid) {
            let result = await saveMainForm();
            if (result) {
                let { mainId, resObj, reqPayload } = result;
                console.log("Orignal");

                console.log(resObj);
                console.log(formDetails);

                console.log("businessKey" + businessKey);
                console.log(subFormDefaultConfig);
                console.log(formData);

                setFormData(resObj);
                setCopy(resObj);
                saveTagSuggestion();
                setFilesToDelete([]);

                if (Object.keys(subFormDataRef.current).length !== 0) {
                    let _data = await handleSaveSubFormData(mainId);
                    console.log(_data);
                    if (_data.length > 0) {
                        await updateMainForm(_data, resObj);
                    }
                }
                console.log("After APIS");

                console.log(resObj);
                console.log(formDetails);

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
            let msg =
                "Invalid fields : " +
                `${validations.invalidLabels.join(", ")}.`;

            setInfoMsg(msg);
            return null;
        }
    }

    async function saveMainForm() {
        let fieldsData = {};

        console.log("businessKey" + businessKey);
        console.log(subFormDefaultConfig);
        console.log(formData);
        fieldsData = { ...formData };
        // if (formData.id !== undefined || businessKey === "new") {
        // } else {
        // }

        let request = {};
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

    async function updateMainForm(_data, resObj) {
        // if (Object.keys(subFormData).length !== 0) {
        console.log(_data);
        console.log("businessKey" + businessKey);
        console.log(subFormDefaultConfig);
        console.log(formData);

        let fieldsData = {};

        if (resObj.id !== undefined) {
            fieldsData = { ...resObj };
        }

        let _subFormDefaultConfig = { ...subFormDefaultConfig };
        console.log("businessKey" + businessKey);
        if (_data.length > 0) {
            _data.map(item => {
                let key = item.col;
                if (_subFormDefaultConfig[key] !== undefined) {
                    // _formData[key] = `${item.formKey};${item.id}`;
                    let str = _subFormDefaultConfig[key];
                    let obj = tryParseJSONObject(str, {});
                    console.log(obj);

                    if (obj.saveId === "SAVE_ID_IN_MAIN") {
                        let colName =
                            obj.columnName !== undefined
                                ? obj.columnName
                                : "no_column_name_povided";
                        fieldsData[colName] = item.id;
                    } else if (obj.saveId === "SAVE_ID_IN_SUB_FORM") {
                    }
                }
            });
        }

        // filesToDelete.map((file) => {
        //     deleteFile(file);
        // });
        // handleFileChanges(formData, copy, fileNameMapping, fileDataParsed);

        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";
        entityForm.fileData = [];
        // let obj = { ...fileNameMapping };

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
                        resolve(resObj);
                    }
                })
                .catch(error => {
                    reject();
                    console.error(error);
                });
        });
    }

    async function handleSaveData(actionType) {
        let validations = handleValidation();
        let _data = [];
        // if (Object.keys(subFormData).length !== 0) {
        if (Object.keys(subFormDataRef.current).length !== 0) {
            // ;
            try {
                _data = await handleSaveSubFormData();
            } catch (error) {
                console.error(error);
            }
        }
        console.log(_data);
        if (!validations.isValid) {
            let msg = `Invalid fields : ${validations.invalidLabels.join(
                ", ",
            )}.`;

            setInfoMsg(msg);
        } else if (validations.isValid) {
            setInfoMsg("");
            let fieldsData = {};

            if (formData.id !== undefined) {
                fieldsData = { ...formData };
            }

            let _formData = { ...formData };

            if (_data.length > 0) {
                _data.map(item => {
                    let key = item.col;
                    // ;
                    if (_formData[key] !== undefined) {
                        // _formData[key] = `${item.formKey};${item.id}`;
                        let str = _formData[key];
                        let obj = tryParseJSONObject(str, {});
                        console.log(obj);

                        if (obj.saveId === "SAVE_ID_IN_MAIN") {
                            let colName =
                                obj.columnName !== undefined
                                    ? obj.columnName
                                    : "no_column_name_povided";
                            fieldsData[colName] = item.id;
                        } else if (obj.saveId === "SAVE_ID_IN_SUB_FORM") {
                        }
                    }
                });
            }

            // filesToDelete.map((file) => {
            //     deleteFile(file);
            // });
            // handleFileChanges(formData, copy, fileNameMapping, fileDataParsed);

            let request = {};
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
                        setFormData(resObj);
                        setCopy(resObj);
                        saveTagSuggestion();
                        setFilesToDelete([]);

                        if (handleActions) {
                            handleActions(
                                actionType,
                                resObj,
                                formDetails,
                                components,
                                reqPayload,
                            );
                        }

                        // if (callback) {
                        //   callback(resObj.id)
                        // }
                    } else {
                        console.error(response.data.C_MESSAGE);
                    }

                    // if (getData) {
                    //     getData(formId);
                    // }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    function saveTagSuggestion() {}

    function getFormData(_businessKey, _formKey) {
        var dataRequest = {
            datasource: formDetails.datasource,
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
                    setSelectedData(formDataTemp[0]);
                    // if (selectedObject && selectedObject !== undefined) {
                    //     setFormData((prev) => ({ ...prev, ...selectedObject }));
                    // } else {
                    //     setFormData(formDataTemp);
                    // }
                }

                setDataLoaded(true);
            })
            .catch(error => {
                console.error(error);
            });
    }
    //tempraryly comment
    useEffect(() => {
        if (checkObject(selectedData)) {
            //    let key = handleTagKey(selectedData)
            //  let selectedObj = handleTagFormat(selectedData)
            let tempObj = { ...selectedData };

            if (!isEmpty(processVariables)) {
                // const processkeys = Object.keys(processVariables)

                const tempObjkeys = Object.keys(tempObj);

                tempObjkeys.map(key => {
                    if (processVariables[key] !== undefined) {
                        tempObj[key] = processVariables[key].value;
                    }
                });
            }

            setFormData(prev => ({ ...prev, ...tempObj }));
            setCopy(prev => ({ ...prev, ...tempObj }));
        }
    }, [selectedData]);

    function checkObject(object) {
        let flag = false;
        try {
            for (let key in object) {
                if (key) {
                    flag = true;
                    break;
                }
            }
        } catch (error) {
            console.log(error);
        }
        return flag;
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    function isArrayEmpty(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === "") return true;
        }
        return false;
    }

    function renderRow(row) {
        return (
            <Row
                key={row.id}
                rowData={row}
                components={components}
                images={images}
                mode={mode}
                handleInputFields={handleInputFields}
                formData={formData}
                subFormDefaultConfig={subFormDefaultConfig}
                formDetails={formDetails}
                fileNameMapping={fileNameMapping}></Row>
        );
    }

    // utils
    function omitKeys(obj, keys) {
        let unordered = {};

        for (let key in obj) {
            if (keys.indexOf(key) == -1) {
                unordered[key] = obj[key];
            }
        }

        let ordered = Object.keys(unordered)
            .sort()
            .reduce((_obj, key) => {
                _obj[key] = unordered[key];
                return _obj;
            }, {});
        return ordered;
    }

    function printKeys(obj) {
        let keys = Object.keys(obj);
        let str = keys.join(" - ");
        return (
            <div className="bg-light border p-2">
                <div>
                    Inside Form Viewer : {keys.length} : {str}{" "}
                </div>

                <pre>
                    <code>{JSON.stringify(obj, null, 2)}</code>
                </pre>
            </div>
        );
    }

    return (
        <span>
            {!layoutLoaded ? (
                <span>Loading*********</span>
            ) : (
                <div className="py-2 container-fluid s2a-page-layout">
                    {/* {!isSubForm && printKeys(subFormDataRef.current)} */}
                    {/* {!isSubForm && printKeys(subFormData)} */}

                    {/* <pre>
                <code>{JSON.stringify(subFormDataRef, null, 2)}</code>
            </pre> */}

                    {mode === modeType.design &&
                        layout.map((row, index) => {
                            return (
                                <div
                                    className="row"
                                    key={row.id}>
                                    {renderRow(row)}
                                </div>
                            );
                        })}
                    {mode !== modeType.design && (
                        <>
                            {layout.map((row, index) => {
                                return (
                                    <div
                                        className="row"
                                        key={row.id}>
                                        {renderRow(row)}
                                    </div>
                                );
                            })}

                            {isProcessForm && processConfig.showActions && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span></span>
                                        <span className="text-danger">
                                            {infoMsg}
                                        </span>
                                        <span></span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
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
                            )}

                            {isSubForm === false && isProcessForm === false && (
                                <div className="d-flex justify-content-between align-items-center">
                                    <span></span>
                                    <span className="text-danger">
                                        {infoMsg}
                                    </span>
                                    <button
                                        type="button"
                                        className="mx-2 btn button-theme  btn-sm"
                                        onClick={() =>
                                            handleMainSave(actions.complete)
                                        }>
                                        {submitLabel ? (
                                            <span>{submitLabel}</span>
                                        ) : (
                                            <span>Save</span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* <hr />
                    <code>
                        {JSON.stringify(
                            omitKeys(formData, [
                                "datemodified",
                                "datecreated",
                                "createdby",
                                "modifiedby",
                            ]),
                        )}
                    </code> */}
                        </>
                    )}
                </div>
            )}
        </span>
    );
};

function Row({
    rowData,
    components,
    images,
    mode,
    handleInputFields,
    formData,
    subFormDefaultConfig,
    formDetails,
    fileNameMapping,
}) {
    function renderColumn(column) {
        return (
            <React.Fragment>
                <div className={`${column.classes} col-style p-0`}>
                    <Column
                        key={column.id}
                        columnData={column}
                        components={components}
                        images={images}
                        mode={mode}
                        handleInputFields={handleInputFields}
                        formData={formData}
                        subFormDefaultConfig={subFormDefaultConfig}
                        formDetails={formDetails}
                        fileNameMapping={fileNameMapping}></Column>
                </div>
            </React.Fragment>
        );
    }
    return (
        <React.Fragment>
            {rowData.children.map((column, index) => {
                return (
                    <React.Fragment key={column.id}>
                        {renderColumn(column)}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function Column({
    columnData,
    components,
    images,
    mode,
    handleInputFields,
    formData,
    subFormDefaultConfig,
    formDetails,
    fileNameMapping,
}) {
    const renderComponent = component => {
        return (
            <React.Fragment>
                <div className="col-wrapper">
                    <Component
                        key={component.id}
                        componentData={component}
                        components={components}
                        images={images}
                        mode={mode}
                        handleInputFields={handleInputFields}
                        formData={formData}
                        subFormDefaultConfig={subFormDefaultConfig}
                        formDetails={formDetails}
                        fileNameMapping={fileNameMapping}
                    />
                </div>
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            {columnData.children.map(component => {
                return (
                    <React.Fragment key={component.id}>
                        {renderComponent(component)}
                    </React.Fragment>
                );
            })}
        </React.Fragment>
    );
}

function Component({
    componentData,
    components,
    images,
    mode,
    handleInputFields,
    formData,
    subFormDefaultConfig,
    formDetails,
    fileNameMapping,
}) {
    // old
    const [component, setComponent] = useState(null);

    useEffect(() => {
        setComponent(components[componentData.id]);
    }, [componentData]);

    // useEffect(() => {
    //     console.log(`Latest state of component`);
    //     console.log(component);
    // }, [component]);

    // console.log({ componentData });

    return (
        <React.Fragment>
            {/* <code>{JSON.stringify(component)}</code> */}
            {/* {JSON.stringify(context)} */}
            {component &&
                CreateComponent(
                    component,
                    componentList,
                    images,
                    mode,
                    handleInputFields,
                    formData,
                    subFormDefaultConfig,
                    formDetails,
                    fileNameMapping,
                )}
        </React.Fragment>
    );
}

function CreateComponent(
    component,
    componentList,
    images,
    mode,
    handleInputFields,
    formData,
    subFormDefaultConfig,
    formDetails,
    fileNameMapping,
) {
    if (typeof componentList[component.type] !== "undefined") {
        return React.createElement(componentList[component.type], {
            key: component.id,
            component,
            images,
            mode: mode,
            modeType: modeType,
            handleInputFields,
            formData,
            subFormDefaultConfig,
            formDetails,
            fileNameMapping,
        });
    }
    return React.createElement(
        () => (
            <div
                // style={{ minHeight: "90vh" }}
                className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <p className="">
                        The Component for{" "}
                        <span className="text-danger">{component.type}</span>{" "}
                        has not been created yet.
                    </p>
                </div>
            </div>
        ),
        { key: component.id },
    );
}

export default FormViewer;
