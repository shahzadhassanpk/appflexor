import { useContext } from "react";
import AnalyticContext from "../AnalyticsContext";
import SelectComponent from "./SelectComponent";

export default function SelectedMeasureForm(props) {
    const { measure, modalRef, tableSave } = props;

    const analyticContext = useContext(AnalyticContext);
    const { userMeasures, setUserMeasures, handleSaveSetting } =
        analyticContext;

    const handleChange = e => {
        const { name, value } = e.target;
        let _userMeasures = [...userMeasures];
        let arr = [];
        _userMeasures.forEach(item => {
            if (item.id === measure.id) {
                if (item.method !== "percentile") {
                    delete item.percentile_percentage;
                }
                let formula = "";
                item[name] = value;
                let labelInArr = item.label.split("_");
                labelInArr.pop();
                labelInArr.push(item.method);
                item["label"] = labelInArr.join("_");
                if (item.method !== "percentile") {
                    formula += item.method + `(${item.key}::float) as ` + item.label;
                    item["formula"] = formula;
                } else {
                    item.formula = "";
                    const percentilePercent = item["percentile_percentage"];

                    const formulaAs = `${item["label"]}_${percentilePercent}th`;
                    // percenitle works from 0 to 1 percent

                    const percentileFormula = `percentile_disc(${
                        percentilePercent / 100
                    }) within group (order by ${item.key}) as ${formulaAs}`;

                    item.formula = percentileFormula;
                }

                arr.push(item);
            } else {
                arr.push(item);
            }
        });
        setUserMeasures(arr);
    };
    if (measure.method !== "percentile")
        return (
            <SelectComponent
                measure={measure}
                handleChange={handleChange}
                handleSaveSetting={handleSaveSetting}
                modalRef={modalRef}
                tableSave={tableSave}
            />
        );
    else if (measure.method === "percentile")
        return (
            <div className="s2a-select-measure">
                <SelectComponent
                    measure={measure}
                    handleChange={handleChange}
                    handleSaveSetting={handleSaveSetting}
                    modalRef={modalRef}
                    tableSave={tableSave}
                />
            </div>
        );
}
