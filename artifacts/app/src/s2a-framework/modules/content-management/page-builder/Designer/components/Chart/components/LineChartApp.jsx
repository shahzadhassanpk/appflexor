import React from "react";
import randomColor from "randomcolor";
import { v4 as uuidv4 } from "uuid";
import {
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { CustomTooltip, CustomizeLegend, colorMaker } from "./utils";
import { Interweave } from "interweave";
import { useState } from "react";
import DescriptionModal from "./DescriptionModal";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

function LineChartApp(props) {
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
                <React.Fragment key={uuidv4()}>
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
                        // width={width}
                        height={height}>
                        <LineChart data={Data}>
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
                                // domain={["dataMin", "dataMax"]}
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <Tooltip
                                type="number"
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
                                // content={<CustomTooltip }
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
                                        <Line
                                            key={index}
                                            type="multitone"
                                            dataKey={key}
                                            stroke={color}
                                            activeDot={{ r: 8 }}
                                        />
                                    )
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </React.Fragment>
            </ErrorBoundary>
        );
}

export default LineChartApp;
