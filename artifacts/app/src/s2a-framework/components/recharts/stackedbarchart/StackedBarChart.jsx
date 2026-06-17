import "../rechart.css";
import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

const data = [
    {
        name: "Page A",
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        name: "Page B",
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: "Page C",
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: "Page D",
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: "Page E",
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: "Page F",
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: "Page G",
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

export default function StackedBarChart() {
    return (
        <BarChart
            width={500}
            height={300}
            data={data}
            margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
                type="number"
                domain={[0, "dataMax + 1000"]} // Adjust as needed
                ticks={[0, 2000, 4000, 6000, 8000, 10000, 12000]}
                tickFormatter={value => {
                    console.log("Y tick value:", value);
                    if (value >= 1_000_000)
                        return `${(value / 1_000_000).toFixed(1)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                    return value;
                }}
            />
            <Tooltip
                formatter={value => {
                    if (value >= 1_000_000)
                        return `${(value / 1_000_000).toFixed(1)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
                    return value;
                }}
            />
            <Legend />
            <Bar
                dataKey="pv"
                stackId="a"
                fill="#8884d8"
            />
            <Bar
                dataKey="uv"
                stackId="a"
                fill="#82ca9d"
            />
        </BarChart>
    );
}
