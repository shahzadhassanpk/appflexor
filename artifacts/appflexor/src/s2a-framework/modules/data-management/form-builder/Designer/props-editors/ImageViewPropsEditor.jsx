import React, { useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../utils/ErrorBoundry";
import { makeid } from "../../../../../utils/utils";
import DesignerContext from "../../Context/DesignerContext";
import FormContext from "../../Context/FormContext";

export default function ImageViewPropsEditor({ setShow }) {
    const context = useContext(DesignerContext);
    const formContext = useContext(FormContext);
    const [currentComponent, setCurrentComponent] = useState({});
    const [inputField, setInputField] = useState({});

    useEffect(() => {
        if (context.selectedComponent && !isEmpty(context.selectedComponent)) {
            setCurrentComponent(context.selectedComponent);
            let componentData = context.selectedComponent.data;

            if (!componentData.use_img_src) {
                componentData.use_img_src = "NO";
            }

            setInputField(componentData);
        }
        // else {
        //     setInputField({});
        //     setCurrentComponent({});
        // }
    }, [context.selectedComponent]);

    const handleInputField = event => {
        let key = event.target.name;
        let fileName = event.target.fileName;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }
        let _inputField = { ...inputField, [key]: value };

        if (fileName) {
            _inputField = {
                ..._inputField,
                file_name: fileName,
                label: fileName,
            };
        }

        setInputField(_inputField);

        // this will imediatly update context but we need to update them on Click event thus moved this logic to `handleUpdateComponentData`

        // let _components = { ...context.components };
        // let tempData = _components[currentComponent.id].data;
        // tempData = { ...tempData, ..._inputField };
        // _components[currentComponent.id].data = tempData;
        // context.setComponents(_components);
    };
    function handleImageUpload(event) {
        try {
            var filesSelected = event.target.files;
            const extensionsAllowed = ["png", "jpg", "jpeg"];
            let validFilesExtension = [];

            for (var index = 0; index < filesSelected.length; index++) {
                let _file = filesSelected[index];

                if (extensionsAllowed) {
                    var re = /(?:\.([^.]+))?$/;
                    var ext = re.exec(_file.name)[1];

                    if (!extensionsAllowed.includes(ext)) {
                        validFilesExtension.push(`${ext}. `);
                    }
                }
            }

            if (validFilesExtension.length > 0) {
                alert(`${validFilesExtension} extensions not allowed.`);
            } else {
                if (filesSelected.length > 0) {
                    let fileToLoad = filesSelected[0];

                    let fileReader = new FileReader();

                    fileReader.onload = function (fileLoadedEvent) {
                        // data: base64
                        let srcData = fileLoadedEvent.target.result;
                        let prevImages = { ...formContext.images };
                        let _components = { ...context.components };
                        let tempData = _components[currentComponent.id].data;

                        if (tempData.image_id)
                            delete prevImages[tempData.image_id];

                        let key = `${makeid(8)}`;
                        let newImages = { ...prevImages, [key]: srcData };

                        formContext.setImages(newImages);

                        handleInputField({
                            target: {
                                name: event.target.name,
                                value: key,
                                fileName: fileToLoad.name,
                            },
                        });
                    };
                    fileReader.readAsDataURL(fileToLoad);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        tempData = { ...tempData, ...inputField };
        _components[currentComponent.id].data = tempData;

        context.setComponents(_components);
        setShow(false);
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }
    return (
        <ErrorBoundary>
            <form>
                <div className="row">
                    <div className="col-auto mb-3">
                        <span>Image Source</span>
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="radio"
                                name="use_img_src"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                value={"NO"}
                                checked={
                                    inputField.use_img_src === "NO"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2">Upload</span>
                        </label>
                        <label className="px-1 form-check-label pointer">
                            <input
                                type="radio"
                                name="use_img_src"
                                className={`form-check-input `}
                                onChange={handleInputField}
                                value={"YES"}
                                checked={
                                    inputField.use_img_src === "YES"
                                        ? true
                                        : false
                                }
                            />
                            <span className="ms-2">URL</span>
                        </label>
                    </div>
                </div>
                <div className="row">
                    {inputField.use_img_src === "YES" ? (
                        <div className="col mb-3">
                            <label className="form-label">
                                URL{" "}
                                <span className="text-secondary">
                                    (Supports relative and absolute paths)
                                </span>
                            </label>

                            <input
                                type="text"
                                name="image_src"
                                className={`form-control form-control-sm`}
                                onChange={e => handleInputField(e)}
                                value={inputField.image_src}
                            />
                            <p className="float-end text-secondary">
                                Can use <code>{"{data.fieldname}"}</code> for
                                linking data with other fields
                            </p>
                        </div>
                    ) : (
                        <div className="col mb-3">
                            <label className="form-label">Upload Image</label>

                            <input
                                type="file"
                                name={"image_id"}
                                className={`form-control form-control-sm`}
                                onChange={e => handleImageUpload(e)}
                            />
                            <p className="float-end">{inputField.file_name}</p>
                            {/* <input
                            type="text"
                            name="value"
                            className={`form-control form-control-sm`}
                            onChange={e => handleInputField(e)}
                            value={inputField.value}
                        /> */}
                        </div>
                    )}
                </div>

                <div className="d-flex flex-row justify-content-end">
                    <div className="d-flex flex-row">
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                handleUpdateComponentData();
                            }}>
                            OK
                        </button>
                        <button
                            className="btn btn-sm button-theme mx-1"
                            type="button"
                            onClick={() => {
                                setShow(false);
                            }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </ErrorBoundary>
    );
}
