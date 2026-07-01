/*
see for more details
https://recharts.org/ 
*/

import React from "react"
import MultiGroupedBarChart from "../GroupedBarChart/MultiGroupedBarChart"
import MultiLineChart from "../multilinechart/MultiLineChart"
import PieChartComp from "../piechart/PieChartComp"
import StackedAreaChart from "../stackedareachart/StackedAreaChart"
import StackedBarChart from "../stackedbarchart/StackedBarChart"

export default function DemoCharts() {
  const data = [
    {
      name: "Mon",
      uv: 4000,
      pv: 2400,
      tv: 2000,
      amt: 2400,
    },
    {
      name: "Tues",
      uv: 3000,
      pv: 1398,
      tv: 2020,
      amt: 2210,
    },
    {
      name: "Wed",
      uv: 2000,
      pv: 9800,
      tv: 2200,
      amt: 2290,
    },
    {
      name: "Thurs",
      uv: 2780,
      pv: 3908,
      tv: 2002,
      amt: 2000,
    },
    {
      name: "Fri",
      uv: 1890,
      pv: 4800,
      tv: 3000,
      amt: 2181,
    },
    {
      name: "Saturs",
      uv: 2390,
      pv: 3800,
      tv: 4000,
      amt: 2500,
    },
    {
      name: "Sunday",
      uv: 3490,
      pv: 4300,
      tv: 5000,
      amt: 2100,
    },
  ]
  return (
    <div>
      <MultiLineChart data={data} />
      <MultiGroupedBarChart data={data} />
      <StackedAreaChart data={data} />
      <PieChartComp data={data} />
      <StackedBarChart data={data} />
    </div>
  )
}
