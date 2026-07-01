import React, { useContext, useEffect, useState } from "react";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { AppContext } from "../../../../../../../AppContext";
import useGlobalData from "../../../../../../components/useGlobal";

/**
 *
 *
 * @param {mode,modeType, label, handleChangeEvent} props
 * @returns {object}
 */

function PhoneField(props) {
    const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [message, setMessage] = useState("");
    const classes = componentData?.classes ?? "";
    const dbColumnAsClass = componentData?.db_column ?? "";

    const expressionProps = useGlobalData();

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);

            let key = props.component.data.db_column;
            let value = props.component.data.value;

            if (
                props.component.data.regex &&
                props.component.data.regex.length > 0
            ) {
                const regexExp = new RegExp(props.component.data.regex);
                let strToValidate = value;
                let strIsValid = regexExp.test(strToValidate);

                if (!strIsValid || value) {
                    let regexInfo = `Field must match regex pattern.`;
                    if (props.component.data.regexinfo) {
                        regexInfo = props.component.data.regexinfo;
                    }
                    setMessage(regexInfo);
                } else {
                    setMessage("");
                }
            }
            // set default value from form properties
            // setObj({
            //     [key]: value,
            // });
            // if (key && value && props.handleInputFields) {
            //     props.handleInputFields(key, value);
            // }
        }
    }, [props.component.data]);

    useEffect(() => {
        if (!props.formData || isEmpty(props.formData)) {
            return;
        }
        let key = props.component.data.db_column;

        setObj(prev => ({
            ...prev,
            [key]: props.formData[key],
        }));
        // console.log("****************" + componentData.db_column);
        // console.log("****************" + key);
        // console.log("****************" + JSON.stringify(obj));
        // console.log("****************" + props.formData[key]);
    }, [props.formData]);

    function handleChange(e) {
        let key = e.target.id;
        let value = e.target.value;
        let isValid = true;
        // TODO: check for isRequired & maxLength

        if (
            componentData.required === "YES" &&
            value.trim().length === 0 &&
            isValid
        ) {
            isValid = false;
        }

        // setObj((prev) => ({
        //     ...prev,
        //     [key]: value,
        // }));

        // this `handleInputFields` will be provided by Parent component
        if (props.handleInputFields) {
            props.handleInputFields(componentData.db_column, value, isValid);
        }
    }

    const Error = () => {
        return <div>Error occurred in Phone Field.</div>;
    };

    // utils
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    if (isEmpty(componentData))
        return (
            <div className="mb-3 p-3">
                <label className="form-label">Phone Field</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    disabled
                />
            </div>
        );

    const userDefineClasses = () => {
        let result = "";
        if (props.mode !== props.modeType.design) {
            result = classes + " " + dbColumnAsClass;
        }
        return result;
    };

    return (
        <ErrorBoundary render={() => Error}>
            <div className={"field-padding " + userDefineClasses()}>
                <label className="form-label">
                    {componentData.label ? componentData.label : "Phone field"}
                    {componentData.required &&
                        componentData.required === "YES" && (
                            <span className="text-danger">&nbsp;*</span>
                        )}
                </label>
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.design ||
                        props.mode === props.modeType.readonly) && (
                        <>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                value={obj[componentData.db_column]}
                                disabled
                            />
                        </>
                    )}
                {props.mode &&
                    props.modeType &&
                    (props.mode === props.modeType.preview ||
                        props.mode === props.modeType.render) && (
                        <>
                            <input
                                type="text"
                                className={`form-control form-control-sm ${
                                    componentData.required &&
                                    componentData.required === "YES"
                                        ? obj[componentData.db_column] === ""
                                            ? "form-control-danger"
                                            : ""
                                        : ""
                                } `}
                                id={
                                    componentData.db_column &&
                                    componentData.db_column
                                }
                                // value={obj[obj.key] ? obj[obj.key] : ""}
                                value={obj[componentData.db_column]}
                                onChange={handleChange}
                                disabled={
                                    props.mode &&
                                    props.mode === props.modeType.design
                                }
                            />
                            <p className="text-danger">
                                {message && <span>{message}</span>}
                            </p>
                        </>
                    )}
                <code>{JSON.stringify(obj)}</code>
            </div>
        </ErrorBoundary>
    );
}

export default PhoneField;
