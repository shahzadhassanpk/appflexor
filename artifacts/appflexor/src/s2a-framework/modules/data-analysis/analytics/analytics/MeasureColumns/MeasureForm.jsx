import React, { useContext, useEffect } from "react";
import { useState } from "react";
import AnalyticContext from "../AnalyticsContext";
import { v4 as uuid } from "uuid";
import useLogger from "../../../../../components/hooks/useLogger";

export default function MeasureForm(props) {
    const { measures, childModal } = props;
    const analyticContext = useContext(AnalyticContext);
    const { userMeasures, setUserMeasures, staticMeasures } = analyticContext;
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [_measures, _setMeasures] = useState([]);

    useEffect(() => {
        _setMeasures(staticMeasures);
    }, []);

    const handleInput = (e, item) => {
        const { name, value } = e.target;
        return (item[name] = value);
    };

    const selectedMeasure = (e, item, index) => {
        const { checked } = e.target;
        const result = _measures.map((_item, i) => {
            _item.id = uuid();
            if (i === index) {
                return { ...item, selected: checked };
            } else {
                return _item;
            }
        });
        _setMeasures(result);
    };

    const handleMethod = (selectedItem, code) => {
        const result = _measures.map(_item => {
            if (selectedItem.id === _item.id) {
                return { ..._item, method: code };
            } else {
                return _item;
            }
        });
        _setMeasures(result);
    };

    const handlePushMeasures = () => {
        const arr = [];
        let isError = false;
        let errorMessage = "";
        let _measuresClone = [..._measures];
        _measuresClone.forEach(measure => {
            if (measure.selected) {
                if (measure.method === undefined) {
                    measure.formula = "";
                    measure.method = "count";
                    measure.formula +=
                        measure.method +
                        `(${measure.key}::float) as ${measure.label}`;
                    measure.label += `_${measure.method ? measure.method : ""}`;
                } else if (measure.method === "percentile") {
                    measure.formula = "";
                    let percentilePercent = measure["percentile_percentage"];
                    if (!percentilePercent) {
                        isError = true;
                        errorMessage =
                            "Invalid percentile value for " + measure["label"];
                        return;
                    }

                    const formulaAs = `${measure["label"]}_${percentilePercent}th`;
                    // percenitle works from 0 to 1 percent

                    const percentileFormula = `percentile_disc(${
                        percentilePercent / 100
                    }) within group (order by ${measure.key}) as ${formulaAs}`;

                    measure.formula = percentileFormula;

                    measure.label += `_${measure.method ? measure.method : ""}`;
                    measure.id = uuid();
                } else {
                    measure.label += `_${measure.method ? measure.method : ""}`;
                    measure = measureFormula(measure);
                }

                arr.push(measure);
            }
        });
        if (!isError) {
            setUserMeasures(prev => [...prev, ...arr]);
            _setMeasures(staticMeasures);
            childModal.current.close();
        } else {
            setIsError(isError);
            setErrorMessage(errorMessage);
        }
    };

    const measureFormula = item => {
        let formula = "";
        item.id = uuid();
        formula += item.method + `(${item.key}::float) as ` + item.label;
        item.formula = formula;
        return item;
    };

    useLogger(_measures);

    return (
        <div className="s2a-measure-form">
            <div className="mb-2 measure-form">
                <label className="fw-bold mb-1">Available Measures</label>
                <ul className="list-group">
                    {_measures &&
                        _measures.map((item, index) => (
                            <>
                                <li
                                    key={index}
                                    className="list-group-item d-flex justify-content-between">
                                    <label className="row">
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-2"
                                            onChange={e =>
                                                selectedMeasure(e, item, index)
                                            }
                                            selected={item.selected}
                                        />
                                        {item.label} ({item.method})
                                    </label>
                                    <DropDown
                                        item={item}
                                        handleInput={handleInput}
                                        handleMethod={handleMethod}
                                    />
                                </li>
                            </>
                        ))}
                </ul>
            </div>
            <div className="float-end">
                {isError && (
                    <span className="error-msg me-2">{errorMessage}</span>
                )}
                <button
                    className="btn btn-sm button-theme"
                    onClick={() => handlePushMeasures()}>
                    Ok
                </button>
            </div>
        </div>
    );
}

function DropDown(props) {
    const { item, handleInput, handleMethod } = props;
    const [methods, setMethods] = useState([
        { code: "count", title: "Count", selected: false },
        { code: "sum", title: "Sum", selected: false },
        { code: "avg", title: "Average", selected: false },
        { code: "min", title: "Min", selected: false },
        { code: "max", title: "Max", selected: false },
        { code: "percentile", title: "Percentile", selected: false },
    ]);

    const selectMethod = (item, method) => {
        handleMethod(item, method.code);
        const _methods = [...methods];
        const result = _methods.map(m => {
            if (m.code === method.code) {
                return { ...m, selected: true };
            } else {
                return { ...m, selected: false };
            }
        });
        setMethods(result);
    };

    return (
        <>
            <div className="dropdown">
                <span
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                </span>
                <ul className="dropdown-menu">
                    <li>
                        {methods.map((method, index) => {
                            return (
                                <div
                                    className="dropdown-item"
                                    key={index}>
                                    <span className="me-1 vertical-top">
                                        <input
                                            name={"method" + item.id}
                                            type="radio"
                                            className="form-check-input"
                                            checked={method.selected}
                                            value={method.code}
                                            onChange={() =>
                                                selectMethod(item, method)
                                            }
                                        />
                                    </span>
                                    <label className="">{method.title}</label>
                                </div>
                            );
                        })}
                        <div className="p-2 percentile__input">
                            {item.method === "percentile" && (
                                <input
                                    placeholder="1 to 100"
                                    className="form-control"
                                    name="percentile_percentage"
                                    value={item.percentile_percentage}
                                    onChange={e => handleInput(e, item)}
                                    type="number"
                                    max={100}
                                    min={0}
                                />
                            )}
                        </div>
                    </li>
                    <button className="m-2 btn btn-sm button-theme">Ok</button>
                </ul>
            </div>
        </>
    );
}
