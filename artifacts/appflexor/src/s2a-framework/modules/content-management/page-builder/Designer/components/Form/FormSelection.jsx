import axios from "axios";
import { Interweave } from "interweave";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URL } from "../../../../../../Config";
import { modeType } from "../../../../../data-management/form-builder/Forms/FormViewer";
import MultiFormViewer from "../../../../../data-management/form-builder/Forms/FormViewer/MultiFormViewer";
import SingleFormViewer from "../../../../../data-management/form-builder/Forms/FormViewer/SingleFormViewer";
const actions = {
    update: "UPDATE",
    complete: "COMPLETE",
    failed: "FAILED",
    draft: "DRAFT",
};

const toastConfigs = {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
};

function FormSelection({ componentData }) {
    const [form, setForm] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);

    useEffect(() => {
        const { formId } = componentData;
        if (formId) {
            getForm(formId);
        }
    }, [componentData]);

    function handleActions(
        actionType,
        state = {},
        formDetails = {},
        componentsData = {},
        reqPayload = {},
    ) {
        if (actionType === actions.complete) {
            setForm(prev => ({ ...prev, id: state.id }));
            setIsFormSubmit(true);
        }
    }

    function getForm(formId) {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: formId,
                    dataKey: "form",
                    serviceKey: "sys.form",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.form) {
                        setForm(response.data.C_DATA.form[0]);
                    }
                    setIsLoaded(true);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <React.Fragment>
            <div className="container-fluid px-2 s2a-form-viewer">
                <div className="p-2">
                    {!isFormSubmit && componentData.title && (
                        <div className="col-sm-12 s2a-form-title">
                            {componentData.title}
                        </div>
                    )}
                </div>
                {!isFormSubmit && isLoaded && (
                    <div className="container-fluid">
                        <MultiFormViewer
                            form={form}
                            handleActions={handleActions}
                            businessKey="new"
                            submitLabel={componentData.formActionLabel}
                            mode={modeType.render}
                        />
                    </div>
                )}

                {isFormSubmit && (
                    <div className="process-form-submit">
                        <span className="form-submit-msg">
                            {componentData.formSubmission ? (
                                <Interweave
                                    content={
                                        componentData.formSubmission
                                    }></Interweave>
                            ) : (
                                "Form submited successfully"
                            )}
                        </span>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
}

export default FormSelection;
