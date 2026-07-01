import { COMPONENT, ROW, COLUMN } from "./Constants"
import {React, lazy} from "react"
// import LinechartDemo from "./LinechartDemo"
// import StackBarChart from "../recharts/stackedbarchart/StackedBarChart"
// import GroupBarChart from "../recharts/GroupedBarChart/MultiGroupedBarChart"
// import PieChart from "../recharts/piechart/PieChartComp"
// import StackedAreaChart from "../recharts/stackedareachart/StackedAreaChart"
// import MultilineChart from "../recharts/multilinechart/MultiLineChart"

const LinechartDemo = lazy(() =>
  import("./LinechartDemo"),
);
const StackBarChart = lazy(() =>
  import("../recharts/stackedbarchart/StackedBarChart"),
);
const GroupBarChart = lazy(() =>
  import("../recharts/GroupedBarChart/MultiGroupedBarChart"),
);
const PieChart = lazy(() =>
  import("../recharts/piechart/PieChartComp"),
);
const StackedAreaChart = lazy(() =>
  import("../recharts/stackedbarchart/StackedBarChart"),
);


let mapping = {
  "row": ROW,
  "column": COLUMN,
  "component": COMPONENT,
  "graph": LinechartDemo,
  "StackBarChart":StackBarChart,
  "groupbarchart":GroupBarChart,
  "piechart":PieChart,
  "stackedareachart":StackedAreaChart,
  "multilinechart":MultilineChart
}

const initialData = {
  // layout: [
  //   {
  //     type: ROW,
  //     id: "row0",
  //     children: [
  //       {
  //         type: COLUMN,
  //         id: "column0",
  //         children: [
  //           {
  //             type: COMPONENT,
  //             id: "component0",
  //           },
  //           {
  //             type: COMPONENT,
  //             id: "component1",
  //           },
  //         ],
  //       },
  //       {
  //         type: COLUMN,
  //         id: "column1",
  //         children: [
  //           {
  //             type: COMPONENT,
  //             id: "component2",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // ],
  components: {
    // component0: { id: "component0", type: "input", content: "Some input" },
    // component1: { id: "component1", type: "image", content: "Some image" },
    // component2: { id: "component2", type: "email", content: "Some email" },
    // component3: { id: "component3", type: "name", content: "Some name" },
    // component4: { id: "component4", type: "phone", content: "Some phone" },
    1: {
      id: "1",
      type: "component",
      content: React.createElement(mapping["graph"]),
    },
    2: {
      id: "2",
      type: "stackbarchart",
      content: React.createElement(mapping["StackBarChart"]),
    },
    3: {
      id: "3",
      type: "groupbarchart",
      content: React.createElement(mapping["groupbarchart"]),
    },
    4: {
      id: "4",
      type: "piechart",
      content: React.createElement(mapping["piechart"]),
    },
    5: {
      id: "5",
      type: "stackedareachart",
      content: React.createElement(mapping["stackedareachart"]),
    },
    6: {
      id: "6",
      type: "multilinechart",
      content: React.createElement(mapping["multilinechart"]),
    },
  },
}



export default initialData
