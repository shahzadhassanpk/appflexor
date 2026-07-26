import { Interweave } from "interweave";
import React, { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "../../../../../../utils/ErrorBoundry";
import { SubmitFormPropsEditor } from "./SubmitFormPropsEditor";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import { evaluateExpression } from "../../../datalist-viewer/datalist-filter-helpers/DatalistFilters";
import { isEmpty } from "../../../../../data-management/form-builder/Forms/FormViewer/utils";
/**
 *
 * @param {mode, label, handleChangeEvent} props
 * @returns {object}
 */

function SubmitForm(props) {
    // const [obj, setObj] = useState({});
    const [componentData, setComponentData] = useState({});
    const [visible, setVisible] = useState(true);
    const [disable, setDisable] = useState(false);
    const [data, setData] = useState({});

    const htmlModalRef = useRef(null);
    const handleShow = () => htmlModalRef?.current?.show();
    const handleClose = () => htmlModalRef?.current?.close();
    const setShow = bool => {
        bool ? handleShow() : handleClose();
    };

    useEffect(() => {
        try {
            let visibleExp = props.component.data.condition;
            let disableExp = props.component.data.disabled;

            if (disableExp && disableExp !== "") {
                setDisable(
                    evaluateExpression({ expression: disableExp }, data),
                );
            }

            if (visibleExp && visibleExp !== "") {
                setDisable(
                    !evaluateExpression({ expression: visibleExp }, data),
                );
            }
        } catch (error) {
            console.log(error);
        }
    }, [data]);

    useEffect(() => {
        if (props.component && props.component.data) {
            setComponentData(props.component.data);
        }
    }, [props.component.data]);

    const Error = () => {
        return (
            <div>
                <center className="text-danger">Error occurred in HTML</center>
            </div>
        );
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
            <div className="p-3 ">
                <label className="form-label">HTML</label>
            </div>
        );

    return (
        <ErrorBoundary render={() => Error}>
            {visible && (
                <>
                    <>
                        {props.mode &&
                            props.modeType &&
                            props.mode !== props.modeType.design && (
                                <>
                                    <RenderSubmitForm
                                        {...componentData}
                                    />
                                </>
                            )}

                        {props.mode &&
                            props.modeType &&
                            props.mode === props.modeType.design && (
                                <div className="d-flex justify-content-center align-items-center pointer">
                                    <span
                                        className="m-2 fa-regular fa-pen-to-square mx-1"
                                        onClick={() =>
                                            setShow(true)
                                        }></span>{" "}
                                    Edit Submit Form
                                </div>
                                // <RenderSubmitForm {...componentData} />
                            )}
                    </>
                    <ChildrenModal
                        ref={htmlModalRef}
                        size="xl"
                        header="Edit Html">
                        <SubmitFormPropsEditor
                            setShow={setShow}
                            componentData={componentData}
                            setComponentData={setComponentData}
                        />
                    </ChildrenModal>
                </>
            )}
        </ErrorBoundary>
    );
}

function RenderSubmitForm({ actionUrl, inputs, buttonLabel }) {

    const handleSubmit = async e => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const { url } = await response.json();
            window.location.href = url; // redirect to Stripe Checkout or backend response
        } else {
            console.error("Form submission failed");
        }
    };

    return (
        <form
            action={actionUrl}
            method="POST">
            {inputs &&
                !isEmpty(inputs) &&
                Object.entries(inputs).map(([name, value], index) => (
                    <input
                        key={index}
                        type="hidden"
                        name={name}
                        value={value}
                    />
                ))}
            <button type="submit">{buttonLabel || "Submit"}</button>
        </form>
    );
}

export default SubmitForm;
