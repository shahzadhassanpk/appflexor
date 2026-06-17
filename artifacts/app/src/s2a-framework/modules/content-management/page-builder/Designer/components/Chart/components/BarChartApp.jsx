import React, { useState, useEffect } from "react";
import randomColor from "randomcolor";
import axios from "axios";
// import { API_URL } from "Config";
import {
    BarChart as _BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { CustomTooltip, CustomizeLegend, colorMaker } from "./utils";
import DescriptionModal from "./DescriptionModal";
import { Interweave } from "interweave";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

function BarChartApp(props) {
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
    const handleClose = () => setShowDescription(false);
    const handleShow = () => setShowDescription(true);
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
                    <ResponsiveContainer
                        className="chart-container"
                        height={height}>
                        <_BarChart data={Data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={keyColumn}
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <YAxis
                                type="number"
                                tickFormatter={value => {
                                    if (value >= 1_000_000)
                                        return `${(value / 1_000_000).toFixed(
                                            1,
                                        )}M`;
                                    if (value >= 1_000)
                                        return `${(value / 1_000).toFixed(1)}K`;
                                    return value;
                                }}
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <Tooltip
                                className="custom-tooltip"
                                formatter={(value, name, props) => {
                                    if (value >= 1_000_000)
                                        return [
                                            `${(value / 1_000_000).toFixed(
                                                1,
                                            )}M`,
                                            name,
                                        ];
                                    if (value >= 1_000)
                                        return [
                                            `${(value / 1_000).toFixed(1)}K`,
                                            name,
                                        ];
                                    return [value, name];
                                }}
                            />
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
                                        <>
                                            <Bar
                                                key={index}
                                                dataKey={key}
                                                fill={color}>
                                                {Data.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={color}
                                                    />
                                                ))}
                                            </Bar>
                                        </>
                                    )
                                );
                            })}
                        </_BarChart>
                    </ResponsiveContainer>
                </React.Fragment>
            </ErrorBoundary>
        );
}
export default BarChartApp;
