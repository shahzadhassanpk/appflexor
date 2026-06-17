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

export default function App(props) {
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
                    <ResponsiveContainer height={height}>
                        <BarChart
                            layout="vertical"
                            data={Data}
                            barCategoryGap={1}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                hide
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            {/* <YAxis type="category" dataKey="name" /> */}
                            <YAxis
                                type="category"
                                dataKey={keyColumn}
                                tick={{ fill: "var(--font-color)" }}
                                tickLine={{ stroke: "var(--font-color)" }}
                            />
                            <Tooltip content={<CustomTooltip />} />

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
                                        <Bar
                                            key={index}
                                            dataKey={key}
                                            fill={color}
                                            stackId="a">
                                            {Data.map((entry, index) => {
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={color}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    )
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                </React.Fragment>
            </ErrorBoundary>
        );
}
