import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, BPM_API_URL } from "../../../Config";
import { componentList } from "../Designer/ComponentRegistry";
// Not in use
const FormViewer = ({ formKey, businessKey, getData, formId }) => {
    // Form
    const [formData, setFormData] = useState({});
    const [formDetails, setFormDetails] = useState({});
    const [infoMsg, setInfoMsg] = useState("");
    const [isValidForm, setIsValidForm] = useState({});

    // Layout
    const [layout, setLayout] = useState([]);
    const [images, setImages] = useState({});
    const [components, setComponents] = useState({});
    const [selectedData, setSelectedData] = useState({});
    const [keys, setKeys] = useState({
        formKey: "",
        formId: "",
        businessKey: "",
    });
    const mode = "RENDER_MODE";

    useEffect(() => {
        if ((formKey, businessKey)) {
            setKeys(prev => ({
                ...prev,
                formKey: formKey,
                formId: formId,
                businessKey: businessKey,
            }));
        }
    }, [formKey, businessKey]);

    useEffect(() => {
        if (
            (mode === "PREVIEW_MODE" || mode === "RENDER_MODE") &&
            !isEmpty(components) &&
            layout.length !== 0
        ) {
            setObjectSchemeForValidation(layout, components);
        }
    }, [layout, components]);

    useEffect(() => {
        if (formKey || keys || keys.formKey) {
            getForm(formKey ? formKey : keys.formKey);
        }
    }, [formKey]);

    useEffect(() => {
        if (businessKey && businessKey !== "" && businessKey !== "new") {
            getFormData(
                businessKey ? businessKey : keys.businessKey,
                formKey ? formKey : keys.formKey,
            );
        }
    }, [businessKey, formKey]);

    useEffect(() => {
        let isValid = true;
        let keys = Object.keys(isValidForm);

        keys.map(key => {
            if (!isValidForm[key]) {
                isValid = false;
            }
        });

        if (!isValid) {
            setInfoMsg("Invalid data.");
        } else {
            setInfoMsg("");
        }
    }, [isValidForm]);

    const handleInputFields = (
        key = "",
        value = "",
        isValid = false,
        type = "text",
    ) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));

        setIsValidForm(prev => ({
            ...prev,
            [key]: isValid,
        }));

        // hanldeChange(key, value)
    };

    const setObjectSchemeForValidation = (layout, components) => {
        let tempObj = {};
        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;
                    let type = foundComponent.type;

                    // can set initial value from default values for fields here
                    if (key !== undefined) {
                        if (type === "checkbox") {
                            tempObj = {
                                ...tempObj,
                                [key]: "NO",
                            };
                        } else {
                            tempObj = {
                                ...tempObj,
                                [key]: "",
                            };
                        }
                    }
                });
            });
        });

        // if (!isEmpty(selectedObject) && selectedObject !== undefined) {
        //     setFormData((prev) => ({ ...prev, ...selectedObject }));
        // } else {
        //     setFormData((prev) => ({ ...prev, ...tempObj }));
        // }

        // setFormData({})
    };

    // TODO: check validations
    const checkValidation = (objToValidate, layout, components) => {
        let isValid = false;
        let invalidKeys = [];
        let message = "";
        // console.log(obj);
        if (isEmpty(objToValidate)) {
            isValid = false;
            message =
                "Required columns are empty. This may result to false validations.";

            return {
                isValid,
                invalidKeys,
                message,
            };
        }
        let schemaArr = [];

        layout.map(row => {
            row.children.map(column => {
                column.children.map(component => {
                    let foundComponent = components[component.id];
                    let key = foundComponent.data.db_column;
                    // let value = foundComponent.data.value;
                    let regex = foundComponent.data.regex
                        ? foundComponent.data.regex
                        : "";
                    let required = foundComponent.data.required;
                    let obj = {};
                    if (key !== undefined) {
                        obj = {
                            ...obj,
                            [key]: { key: key, required, regex },
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
                            }
                        } else {
                            let strToValidate =
                                objToValidate[validationSchema.key];
                            let strIsValid =
                                strToValidate.length > 0 ? true : false;

                            if (!strIsValid) {
                                invalidKeys.push(validationSchema.key);
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
            message,
        };
    };

    const handleValidation = () => {
        let validations = checkValidation(formData, layout, components);
        if (validations.isValid) {
            // alert("All good");
            setInfoMsg(validations.message);
        } else {
            let msg = `Invalid fields : ${validations.invalidKeys.join()}. Either these fields are required or may not satisfy regex expression.`;
            if (validations.invalidKeys.length > 0) {
                setInfoMsg(msg);
            }

            // alert(validations.message);
            // setInfoMsg(validations.message);L
            // setFormData({});
        }
    };

    function saveAndStart() {
        let callback = function (_businessKey) {
            getFormData(_businessKey);
        };

        saveData(callback);
    }

    function saveAndComplete() {
        // var callback = function () {
        //   completeTask()
        // }
        // saveData(callback)
    }

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

    //   function updateData(obj) {
    //
    //     let fieldsData = { ...obj }
    //     let request = {}
    //     request.data = []
    //     let entityForm = {}
    //     entityForm.formId = formDetails.table
    //     entityForm.entity = formDetails.table
    //     entityForm.action = "update"
    //     entityForm.id = fieldsData.id

    //     delete fieldsData.inq_no
    //     entityForm.formData = fieldsData
    //     request.data.push(entityForm)
    //     axios
    //       .post(API_URL + "?service.key=update.formData", request)
    //       .then((response) => {
    //         if (response.data.C_STATUS == "SUCCESS") {
    //           let resObj = response.data.C_DATA[0].formData
    //           setFormData(resObj)
    //           // setInquiryState((prev) => ({
    //           //     ...prev,
    //           //     id: resObj.id,
    //           // }));
    //         } else {
    //           console.error(response.data.C_MESSAGE)
    //         }
    //       })
    //       .catch((error) => {
    //         console.error(error)
    //       })
    //   }

    function saveData(callback) {
        let fieldsData = { ...formData };
        let request = {};
        request.data = [];
        let entityForm = {};

        entityForm.formId = formDetails.table;
        entityForm.entity = formDetails.table;
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
            fieldsData.id = "new";
        }

        delete fieldsData.inq_no;
        entityForm.formData = fieldsData;

        request.data.push(entityForm);
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    //   let resObj = response.data.C_DATA[0].formData
                    //   setFormData((prev) => ({
                    //     ...prev,
                    //     id: resObj.id,
                    //   }))
                    //   if (callback) {
                    //     callback(resObj.id)
                    //   }
                } else {
                    console.error(response.data.C_MESSAGE);
                }

                getData(formId ? formId : keys.formId);
            })
            .catch(error => {
                console.error(error);
            });
    }

    function getFormData(_businessKey, _formKey) {
        var dataRequest = {
            dataKeys: [
                {
                    dataKey: "formData",
                    getFormBy: "key",
                    formKey: _formKey,
                    businessKey: _businessKey,
                    mode: "formData",
                },
            ],
        };
        axios
            .post(API_URL + "?service.key=get.formData", dataRequest)
            .then(response => {
                if (response.data.C_DATA) {
                    let formDataTemp = response.data.C_DATA.formData;
                    setSelectedData(formDataTemp[0]);
                    // if (selectedObject && selectedObject !== undefined) {
                    //     setFormData((prev) => ({ ...prev, ...selectedObject }));
                    // } else {
                    //     setFormData(formDataTemp);
                    // }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    useEffect(() => {
        if (checkObject(selectedData)) {
            //    let key = handleTagKey(selectedData)

            //  let selectedObj = handleTagFormat(selectedData)
            if (checkObject(selectedData)) {
                setFormData(prev => ({ ...prev, ...selectedData }));
            }
        }
    }, [selectedData]);

    function handleTagFormat(selectedItem) {
        let selectedObject = { ...selectedItem };
        if (checkObject(selectedObject)) {
            Object.values(selectedObject).forEach(item => {
                const myString = item;
                const substring = "[";
                const index = myString.indexOf(substring);
                if (index === 0) {
                    let tags = item;
                    let parsedTags = tryToParse(tags);

                    console.log(tags);
                    let key = findKeyByValue(selectedObject, tags);
                    if (key !== "") {
                        selectedObject[key] = parsedTags;
                    }
                }
            });
        }
        return selectedObject;
    }

    function tryToParse(tags) {
        let parsedTags = [];
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            console.log(error);
        }
        return parsedTags;
    }

    function findKeyByValue(obj, value) {
        try {
            for (let key in obj) {
                if (obj.hasOwnProperty(key) && obj[key] === value) {
                    return key;
                }
            }
            return null;
        } catch (error) {
            console.log(error);
        }
    }

    function handleTagKey(selectedItem) {
        let selectedObject = { ...selectedItem };
        let key = "";

        if (checkObject(selectedObject)) {
            Object.values(selectedObject).forEach(item => {
                const myString = item;
                const substring = "[";
                const index = myString.indexOf(substring);
                if (index === 0) {
                    let tags = item;
                    key = findKeyByValue(selectedObject, tags);
                }
            });
        }
        return key;
    }

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
                formData={formData}></Row>
        );
    }

    return (
        <div className="py-2 container-fluid s2a-page-layout">
            {mode === "DESIGN_MODE" &&
                layout.map((row, index) => {
                    return (
                        <div
                            className="row"
                            key={row.id}>
                            {renderRow(row)}
                        </div>
                    );
                })}

            {mode !== "DESIGN_MODE" && (
                <>
                    {/* {infoMsg !== "" && (
                        <div className="p-1 alert alert-info" role="alert">
                            {infoMsg}
                        </div>
                    )} */}
                    {layout.map((row, index) => {
                        return (
                            <div
                                className="row"
                                key={row.id}>
                                {renderRow(row)}
                            </div>
                        );
                    })}

                    {/* <button className="float-right mb-2 btn btn-sm btn-warning" onClick={handleValidation}>
                        Test validations
                    </button> */}
                    <button
                        type="button"
                        className="mx-2 btn btn-danger btn-sm"
                        onClick={() => saveData(formData)}>
                        {" "}
                        Save
                    </button>
                    <hr />
                    <code>{JSON.stringify(formData)}</code>
                </>
            )}
        </div>
    );
};

function Row({
    rowData,
    components,
    images,
    mode,
    handleInputFields,
    formData,
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
                        formData={formData}></Column>
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
}) {
    // console.log(`INSIDE PREVIEW COMPONENT`);
    // console.log(components);
    // useEffect(() => {
    //     let _nodes = querySelectorAll('[data-id="component"]');
    //     console.log("All nodes having [data-id=]");
    //     console.log(_nodes);
    // }, []);

    // const querySelectorAll = (selector) => {
    //     const elList = document.querySelectorAll(selector);

    //     if (!elList) throw new Error("Could not find elements");

    //     return elList;
    // };

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
) {
    const modeType = {
        design: "DESIGN_MODE",
        preview: "PREVIEW_MODE",
        readonly: "READONLY_MODE",
        render: "RENDER_MODE",
    };

    if (typeof componentList[component.type] !== "undefined") {
        return React.createElement(componentList[component.type], {
            key: component.id,
            component,
            images,
            mode: mode,
            modeType: modeType,
            handleInputFields,
            formData,
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
