import React, { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import randomColor from "randomcolor";
import { CustomTooltip, CustomizeLegend, colorMaker } from "./utils";
import DescriptionModal from "./DescriptionModal";
import { Interweave } from "interweave";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

export default function StackedBarChartApp(props) {
    const {
        data: {
            title,
            color_palette,
            keyColumn,
            show_legend,
            chart_description,
            refresh_interval,
        },
        chartData: { height, width, data: Data, columns },
        setFlag,
    } = props;

    const [showDescription, setShowDescription] = useState(false);
    const [mouseOverItem, setMouseOverItem] = useState(null);
    const handleClose = () => setShowDescription(false);
    const handleShow = () => setShowDescription(true);
    // useEffect(() => {
    //     console.log(mouseOverItem);
    // }, [mouseOverItem]);

    const captureIndex = index => {
        // console.log(index);
        setMouseOverItem(index);
    };

    if (columns && JSON.stringify(columns) !== "{}")
        return (
            <ErrorBoundary>
                <React.Fragment>
                    <DescriptionModal
                        show={showDescription}
                        close={handleClose}
                        title={title}>
                        <Interweave content={chart_description} />
                    </DescriptionModal>
                    <div className="chart-title">
                        <span></span>
                        <span>{title ? title : ""}</span>
                        <span className="chart-refresh-btn cursor-pointer">
                            <i
                                className="fa-solid fa-circle-info me-2"
                                onClick={() => handleShow()}></i>
                            <i
                                title={
                                    refresh_interval
                                        ? `auto refresh in ${refresh_interval} seconds`
                                        : ""
                                }
                                onClick={() => setFlag("get")}
                                className={`fa-solid fa-arrows-rotate ${
                                    refresh_interval ? "refresh_interval" : ""
                                }`}></i>
                        </span>
                    </div>
                    <ResponsiveContainer height={props.chartData.height}>
                        <BarChart
                            data={props.chartData.data}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={keyColumn}
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <YAxis
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <div
                                className={
                                    mouseOverItem === columns.length - 1 &&
                                    "wrapper-mouseover"
                                }>
                                <Tooltip content={<CustomTooltip />} />
                            </div>

                            {show_legend && (
                                <Legend content={<CustomizeLegend />} />
                            )}

                            {Object.keys(columns).map((key, index) => {
                                const color = color_palette
                                    ? colorMaker(index, props)
                                    : randomColor({
                                          luminosity: "dark",
                                          format: "random",
                                      });
                                return (
                                    keyColumn !== key && (
                                        <div
                                            id="haider"
                                            className="border bg-light"
                                            onMouseEnter={() =>
                                                captureIndex(key)
                                            }>
                                            <Bar
                                                key={index}
                                                dataKey={key}
                                                fill={color}
                                                stackId="a">
                                                {Data.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={color}
                                                    />
                                                ))}
                                            </Bar>
                                        </div>
                                    )
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                </React.Fragment>
            </ErrorBoundary>
        );
}
