import { useState } from "react";

export default function SelectComponent(props) {
    const { measure, handleChange, handleSaveSetting, modalRef, tableSave } =
        props;

    const methods = [
        { code: "count", title: "Count" },
        { code: "sum", title: "Sum" },
        { code: "avg", title: "Average" },
        { code: "min", title: "Min" },
        { code: "max", title: "Max" },
        { code: "percentile", title: "Percentile" },
    ];
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const saveAndClose = () => {
        if(measure.method === "percentile" && !parseInt(measure.percentile_percentage)){
            setIsError(true);
            setErrorMessage("Invalid percentile value");
        }else{
            setIsError(false);
            handleSaveSetting(tableSave ? "run" : "save");
            modalRef?.current?.close();
        }
       
    };

    return (
        <div className="s2a-analytic-select">
            <label className="mb-1 mt-1">Methods</label>
            <select
                name="method"
                className="form-select"
                value={measure.method}
                onChange={handleChange}>
                {/* <option value="">Default</option> */}
                {methods?.map(method => {
                    return (
                        <option
                            key={method.code}
                            value={method.code}>
                            {method.title}
                        </option>
                    );
                })}
            </select>
            {measure.method === "percentile" && (
                <>
                    <label className="mt-1 mb-1">Percentile Percentage</label>
                    <input
                        className="form-control"
                        type="number"
                        name="percentile_percentage"
                        value={measure.percentile_percentage}
                        onChange={handleChange}
                    />
                </>
            )}
            <div onClick={() => saveAndClose()}>
                {
                    isError && <span className="error-msg me-2">{errorMessage}</span>
                }
                <button className="btn btn-sm button-theme mt-3 float-end">
                    Ok
                </button>
            </div>
        </div>
    );
}
