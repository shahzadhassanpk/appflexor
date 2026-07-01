import shortid from "shortid";
import React, { useState } from "react";
import LinechartDemo from "./LinechartDemo";
import StackBarChart from "../recharts/stackedbarchart/StackedBarChart";
import GroupBarChart from "../recharts/GroupedBarChart/MultiGroupedBarChart";
import PieChart from "../recharts/piechart/PieChartComp";
import StackedAreaChart from "../recharts/stackedareachart/StackedAreaChart";
import MultilineChart from "../recharts/multilinechart/MultiLineChart";

export const SIDEBAR_ITEM = "sidebarItem";
export const ROW = "row";
export const COLUMN = "column";
export const COMPONENT = "component";
export const PAGELAYOUT = "pagelayout";

export const SIDEBAR_ITEMS = [
    {
        component_id: "1",
        type: SIDEBAR_ITEM,
        component: {
            type: "linechart",
            content: <LinechartDemo />,
        },
    },
    {
        component_id: "2",
        type: SIDEBAR_ITEM,
        component: {
            type: "stackbarchart",
            content: <StackBarChart />,
        },
    },
    {
        component_id: "3",
        type: SIDEBAR_ITEM,
        component: {
            type: "groupbarchart",
            content: <GroupBarChart />,
        },
    },
    {
        component_id: "4",
        type: SIDEBAR_ITEM,
        component: {
            type: "piechart",
            content: <PieChart />,
        },
    },
    {
        component_id: "5",
        type: SIDEBAR_ITEM,
        component: {
            type: "stackedareachart",
            content: <StackedAreaChart />,
        },
    },
    {
        component_id: "6",
        type: SIDEBAR_ITEM,
        component: {
            type: "multilinechart",
            content: <MultilineChart />,
        },
    },
];

export const PAGE_ITEMS = [];
