import React from "react";

export default function ChartWrapper(props) {
    const {
        config: { dimensions, measures },
        data,
    } = props;
    console.log(dimensions, "dim");
    console.log(measures, "measure");
    console.log(data, "data");
    return <div className="s2a-analytic-chart-wrapper">ChartWrapper</div>;
}
