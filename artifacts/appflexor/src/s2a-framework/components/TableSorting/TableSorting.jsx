import React, { useEffect, useState } from "react";
import "./TableSorting.css";

export default function TableSorting({
    state,
    setState,
    fieldName,
    headerTitle,
    activeTab,
}) {
    const [retrivePreviousState, setRetrivePreviousState] = useState(state);
    const [automate, setAutomate] = useState("def");

    useEffect(() => {
        setAutomate("def");
        if (state.length > 0 && state !== undefined) {
            setRetrivePreviousState(state);
        }
    }, [activeTab]);

    useEffect(() => {
        if (automate === "asc") {
            SortingAsc();
        } else if (automate === "desc") {
            SortingDsc();
        } else {
            DefaultState();
        }
    }, [automate]);

    function toggleStates(curretState) {
        let allStates = ["def", "asc", "desc"];
        let index = allStates.indexOf(curretState);

        if (index === 2) {
            index = 0;
        } else {
            index++;
        }
        if (allStates[index] === "def") {
            if (
                retrivePreviousState.length > 0 &&
                retrivePreviousState !== undefined
            ) {
                setState(retrivePreviousState);
            } else {
                setState(state);
            }
        }
        setAutomate(allStates[index]);
    }
    function SortingAsc() {
        if (state.length > 0) {
            let _filteredItems = [...state];
            let sorted = _filteredItems.sort(function (a, b) {
                return ("" + a[fieldName]).localeCompare(b[fieldName]);
            });
            setState(sorted);
        }
    }
    function SortingDsc() {
        if (state.length > 0) {
            let _filteredItems = [...state];
            let sorted = _filteredItems.sort(function (a, b) {
                return ("" + b[fieldName]).localeCompare(a[fieldName]);
            });
            setState(sorted);
        }
    }
    function DefaultState() {
        setAutomate("def");
    }

    return (
        <div
            className="sorted-header s2a-table-sorting"
            onClick={() => toggleStates(automate)}>
            <div className="header-title">{headerTitle}</div>
            <div className="sort-btn">
                {automate === "def" && <i className="fa-solid fa-sort"></i>}
                {automate === "asc" && <i className="fa-solid fa-sort-up"></i>}
                {automate === "desc" && (
                    <i className="fa-solid fa-sort-down"></i>
                )}
            </div>
        </div>
    );
}
