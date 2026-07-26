import React from "react";

export const FormView = (props) => {
    const { appContext, appConfig, formData } = props;
    return (
        <div className="eos-form-view">
            <h1>EOS Form View</h1>
            <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
    );
}