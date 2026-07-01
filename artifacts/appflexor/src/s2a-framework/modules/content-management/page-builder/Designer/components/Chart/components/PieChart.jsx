import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    Cell,
    Label,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";
// import { API_URL } from "Config";
import randomColor from "randomcolor";
import { colorMaker, renderCustomizedLabel } from "./utils";
import DescriptionModal from "./DescriptionModal";
import { Interweave } from "interweave";
import { ErrorBoundary } from "../../../../../../../utils/ErrorBoundry";

function CustomizePieChart(props) {
    const {
        data: {
            title,
            color_palette,
            keyColumn,
            show_legend,
            show_percent = false,
            chart_description,
            refresh_interval,
            vertical_align,
            align_legend,
        },
        chartData: { height, width, data: Data, columns },
        setFlag,
    } = props;

    const [showDescription, setShowDescription] = useState(false);
    const handleClose = () => setShowDescription(false);
    const handleShow = () => setShowDescription(true);
    const [parseData, setParseData] = useState([]);

    useEffect(() => {
        if (JSON.stringify(Data) !== "[]") {
            const items = [];
            Data.forEach(item => {
                Object.keys(columns).forEach(col => {
                    if (col !== keyColumn) {
                        item[col] = parseInt(item[col]);
                    }
                });
                items.push(item);
            });
            setParseData(items);
        }
    }, [Data]);

    const CustomTooltip = props => {
        const {
            active,
            payload,
            legendName,
            // content: {
            //     props: { legendName },
            // },
        } = props;
        function formatter(value, name, props) {
            if (value >= 1_000_000)
                return [`${(value / 1_000_000).toFixed(1)}M`];
            if (value >= 1_000) return [`${(value / 1_000).toFixed(1)}K`];
            return [value, name];
        }
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`${payload[0].payload[legendName]} :`}</p>
                    {payload.map((entry, index) => (
                        <div
                            key={index}
                            className="tooltip-item">
                            <p className="tooltip-text">
                                {entry["dataKey"] +
                                    ": " +
                                    formatter(entry.value)}
                            </p>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    const CustomizeLegend = props => {
        const {
            payload,
            content: {
                props: { legendName, columns },
            },
        } = props;
        let dim = {};
        payload.forEach((entry, index) => {
            dim[index] = entry.color;
        });
        let legend = Object.keys(columns).filter(item => item !== legendName);
        let _legendWithColor = {};
        payload.forEach((item, index) => {
            _legendWithColor[index] = {
                title: item.payload[legendName],
                color: item.color,
                legend: legend,
            };
        });
        return (
            <div>
                {Object.keys(_legendWithColor).map(entry => (
                    <div
                        key={`item-${entry}`}
                        className="customize__legend">
                        <i
                            style={{
                                fontSize: 8,
                                color: _legendWithColor[entry].color,
                            }}
                            className="fa-solid fa-circle me-1"></i>
                        {_legendWithColor[entry].title}{" "}
                        {_legendWithColor[entry].legend.map(item => item)}
                    </div>
                ))}
            </div>
        );
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
                    {parseData && parseData.length > 0 && (
                        <ResponsiveContainer
                            className="pie-chart"
                            height={height}>
                            <PieChart
                                width={width}
                                height={height}>
                                <Tooltip
                                    content={
                                        <CustomTooltip legendName={keyColumn} />
                                    }
                                />
                                {show_legend && (
                                    <Legend
                                        align={
                                            align_legend
                                                ? align_legend
                                                : "right"
                                        }
                                        verticalAlign={vertical_align}
                                        layout="vertical"
                                        content={
                                            <CustomizeLegend
                                                legendName={keyColumn}
                                                columns={columns}
                                            />
                                        }
                                    />
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
                                            <Pie
                                                key={index}
                                                label={({
                                                    cx,
                                                    cy,
                                                    midAngle,
                                                    innerRadius,
                                                    outerRadius,
                                                    percent,
                                                    value,
                                                }) => {
                                                    const RADIAN =
                                                        Math.PI / 180;
                                                    const radius =
                                                        innerRadius +
                                                        (outerRadius -
                                                            innerRadius) /
                                                            2;
                                                    const x =
                                                        cx +
                                                        radius *
                                                            Math.cos(
                                                                -midAngle *
                                                                    RADIAN,
                                                            );
                                                    const y =
                                                        cy +
                                                        radius *
                                                            Math.sin(
                                                                -midAngle *
                                                                    RADIAN,
                                                            );

                                                    const formatValue = val => {
                                                        if (val >= 1_000_000)
                                                            return `${(
                                                                val / 1_000_000
                                                            ).toFixed(1)}M`;
                                                        if (val >= 1_000)
                                                            return `${(
                                                                val / 1_000
                                                            ).toFixed(1)}K`;
                                                        return val;
                                                    };

                                                    const labelText = props.data
                                                        .show_percent
                                                        ? `${(
                                                              percent * 100
                                                          ).toFixed(0)}%`
                                                        : formatValue(value);

                                                    return (
                                                        <text
                                                            x={x}
                                                            y={y}
                                                            fill="#fff"
                                                            textAnchor="middle"
                                                            dominantBaseline="central"
                                                            fontSize={12}
                                                            fontWeight="bold">
                                                            {labelText}
                                                        </text>
                                                    );
                                                }}
                                                // label={renderCustomizedLabel}
                                                dataKey={key}
                                                data={parseData}
                                                // cx={width / 5}
                                                cx={width * columns.length}
                                                cy={height * 0.45}
                                                outerRadius="70%"
                                                fill={color}>
                                                {parseData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                color_palette
                                                                    ? colorMaker(
                                                                          index,
                                                                          props,
                                                                      )
                                                                    : randomColor(
                                                                          {
                                                                              luminosity:
                                                                                  "dark",
                                                                              format: "random",
                                                                          },
                                                                      )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                        )
                                    );
                                })}
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </React.Fragment>
            </ErrorBoundary>
        );
}

export default CustomizePieChart;
