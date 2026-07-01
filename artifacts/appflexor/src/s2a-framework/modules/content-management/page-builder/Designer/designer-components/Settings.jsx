import React, { useCallback, useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../utils/ErrorBoundry";
import DesignerContext from "../../Context/DesignerContext";
import PageContext from "../../Context/PageContext";
import { RenderFormFields } from "./RenderFormFields";
import { makeid } from "../../../../../utils/utils";

export function Settings() {
    const context = useContext(DesignerContext);
    const pageContext = useContext(PageContext);

    const [currentComponent, setCurrentComponent] = useState({});
    const [propsFromComponent, setPropsFromComponent] = useState([]);
    const [inputField, setInputField] = useState({});

    useEffect(() => {
        if (!isEmpty(context.selectedComponent)) {
            let props = context.selectedComponent.props;
            let data = { ...context.selectedComponent.data };

            // TODO: set dafalut value to properties, fix it
            // props.map((props) => {
            //     data[props.id] = props.value;
            // });

            setCurrentComponent(context.selectedComponent);
            setPropsFromComponent(props);
            setInputField(data);
        } else {
            setInputField({});
            setPropsFromComponent([]);
            setCurrentComponent({});
        }
    }, [context]);

    const handleUpdateComponentData = () => {
        let _components = { ...context.components };
        let tempData = _components[currentComponent.id].data;

        tempData = { ...tempData, ...inputField };
        _components[currentComponent.id].data = tempData;

        context.setComponents(_components);
    };

    const handleInputField = event => {
        let name = event.target.name;
        let value = "";

        if (event.target.type === "checkbox") {
            value = event.target.checked ? "YES" : "NO";
        } else {
            value = event.target.value;
        }
        // ;
        // old
        // setInputField((prev) => ({
        //     ...prev,
        //     [name]: value,
        // }));

        // new
        let _inputField = { ...inputField, [name]: value };
        setInputField(_inputField);

        let _components = { ...context.components };

        let tempData = _components[currentComponent.id].data;
        tempData = { ...tempData, ..._inputField };
        _components[currentComponent.id].data = tempData;
        context.setComponents(_components);
    };

    function handleImageUpload(event) {
        try {
            var filesSelected = event.target.files;
            if (filesSelected.length > 0) {
                var fileToLoad = filesSelected[0];

                var fileReader = new FileReader();

                fileReader.onload = function (fileLoadedEvent) {
                    // data: base64
                    var srcData = fileLoadedEvent.target.result;

                    let prevImages = { ...pageContext.images };
                    let _components = { ...context.components };
                    let tempData = _components[currentComponent.id].data;

                    if (tempData.image_id) delete prevImages[tempData.image_id];

                    let key = `${makeid(8)}`;
                    let newImages = { ...prevImages, [key]: srcData };

                    pageContext.setImages(newImages);

                    handleInputField({
                        target: {
                            name: event.target.name,
                            value: key,
                        },
                    });
                };
                fileReader.readAsDataURL(fileToLoad);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function handleRadioOptions(radioList, fieldId) {
        // let _radioList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });

        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        componentProps.map(props => {
            if (props.type === fieldId) {
                let temp = props;
                temp.options = radioList;
                newProps.push(temp);
            } else {
                newProps.push(props);
            }
        });

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    function handleCheckListOptions(checkList, fieldId) {
        // let _checkList = [];
        // let arr = [...radioList];

        // arr.map((opt) => {
        //     delete opt.id;
        //     _radioList.push(opt);
        // });

        let _components = { ...context.components };

        let componentProps = _components[currentComponent.id].props;
        let newProps = [];

        componentProps.map(props => {
            if (props.type === fieldId) {
                let temp = props;
                temp.options = checkList;
                newProps.push(temp);
            } else {
                newProps.push(props);
            }
        });

        _components[currentComponent.id].props = newProps;
        context.setComponents(_components);
    }

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return (
        <ErrorBoundary>
            {currentComponent.type !== "" && (
                <>
                    <div className="p-2  border-bottom">
                        <label htmlFor="">Field :&nbsp;</label>
                        <span className="text-capitalize">
                            {currentComponent.type}
                        </span>
                    </div>
                </>
            )}
            <div className="p-2 enable-scroll properties-scrolling">
                <div className="mb-3">
                    <RenderFormFields
                        fieldsArr={propsFromComponent}
                        inputField={inputField}
                        handleInputField={handleInputField}
                        handleImageUpload={handleImageUpload}
                        handleRadioOptions={handleRadioOptions}
                        handleCheckListOptions={handleCheckListOptions}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
}
