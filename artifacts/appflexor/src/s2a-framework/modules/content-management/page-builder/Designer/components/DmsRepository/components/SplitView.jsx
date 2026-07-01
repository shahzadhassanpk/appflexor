import React, { createRef, useContext, useEffect, useState } from "react";
import Search from "../Search";
import { FavoriteContext } from "../context/FavoriteContext";

const MIN_WIDTH = 75;
const MAX_WIDTH = 500;

const LeftPane = ({ children, leftWidth, setLeftWidth }) => {
    const leftRef = createRef();

    useEffect(() => {
        if (leftRef.current) {
            if (!leftWidth) {
                setLeftWidth(leftRef.current.clientWidth);
                return;
            }

            leftRef.current.style.width = `${leftWidth}px`;
        }
    }, [leftRef, leftWidth, setLeftWidth]);

    return <div ref={leftRef}>{children}</div>;
};

export const SplitView = ({ left, right, className }) => {
    const [leftWidth, setLeftWidth] = useState(undefined);
    const [separatorXPosition, setSeparatorXPosition] = useState(undefined);
    const [dragging, setDragging] = useState(false);
    const tabs = [
        { name: "Repository", code: "REPO" },
        { name: "Content Search", code: "SEARCH" },
    ];
    const [activeTab, setActiveTab] = useState("REPO");

    const splitPaneRef = createRef();

    const onMouseDown = e => {
        setSeparatorXPosition(e.clientX);
        setDragging(true);
    };

    const onTouchStart = e => {
        setSeparatorXPosition(e.touches[0].clientX);
        setDragging(true);
    };

    const onMove = clientX => {
        if (dragging && leftWidth && separatorXPosition) {
            const newLeftWidth = leftWidth + clientX - separatorXPosition;
            setSeparatorXPosition(clientX);

            if (newLeftWidth < MIN_WIDTH) {
                setLeftWidth(MIN_WIDTH);
                return;
            }

            if (newLeftWidth > MAX_WIDTH) {
                setLeftWidth(MAX_WIDTH);
                return;
            }

            if (splitPaneRef.current) {
                const splitPaneWidth = splitPaneRef.current.clientWidth;
                if (newLeftWidth > splitPaneWidth - MIN_WIDTH) {
                    setLeftWidth(splitPaneWidth - MIN_WIDTH);
                    return;
                }
            }

            setLeftWidth(newLeftWidth);
        }
    };

    const onMouseMove = e => {
        e.preventDefault();
        onMove(e.clientX);
    };

    const onTouchMove = e => {
        onMove(e.touches[0].clientX);
    };

    const onMouseUp = () => {
        setDragging(false);
    };

    React.useEffect(() => {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    });

    return (
        <div className="container-fluid">
            <div className="row mb-2">
                <ul className="nav nav-tabs">
                    {tabs.map((tab, index) => {
                        return (
                            <li
                                className="nav-item"
                                key={index}>
                                <button
                                    className={`nav-link ${
                                        activeTab === tab.code ? "active" : ""
                                    } `}
                                    data-bs-toggle="tab"
                                    data-bs-target={`#${tab.code}`}
                                    type="button"
                                    onClick={() => setActiveTab(tab.code)}>
                                    {tab.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {activeTab === "REPO" && (
                <div className="row mb-2">
                    <div
                        className={`splitView ${className ?? ""}`}
                        ref={splitPaneRef}>
                        <LeftPane
                            leftWidth={leftWidth}
                            setLeftWidth={setLeftWidth}>
                            {left}
                        </LeftPane>
                        <div
                            className="divider-hitbox"
                            onMouseDown={onMouseDown}
                            onTouchStart={onTouchStart}
                            onTouchEnd={onMouseUp}>
                            <div className="divider" />
                        </div>
                        <div className="rightPane">{right}</div>
                    </div>
                </div>
            )}
            {activeTab === "SEARCH" && <SearchPanel />}
        </div>
    );
};

const SearchPanel = props => {
    const favoriteContext = useContext(FavoriteContext);
    const {
        explorerTreeState,
        explorerTree,
        datalistIds,
        repository,
        selectedFolder,
        allFoldersListMap,
        allDocumentsListMap,
        navigationStack,
        dmsConfig,
        onUpdateAction,
        backNavigationAction,
        selectedDocumentType,
        handleNavigationAction,
        search,
        setSearch,
        startProcessInstance8,
        startProcessInstance7,
        actions,
        esSearch,
        setEsSearch,
    } = favoriteContext;

    useEffect(() => {
        setSearch("");
    }, []);

    return (
        <div className="">
            <Search
                explorerTreeState={explorerTreeState}
                explorerTree={explorerTree}
                datalistIds={datalistIds}
                repository={repository}
                selectedFolder={selectedFolder}
                allFoldersListMap={allFoldersListMap}
                allDocumentsListMap={allDocumentsListMap}
                navigationStack={navigationStack}
                dmsConfig={dmsConfig}
                onUpdateAction={onUpdateAction}
                backNavigationAction={backNavigationAction}
                selectedDocumentType={selectedDocumentType}
                handleNavigationAction={handleNavigationAction}
                search={esSearch}
                setSearch={setEsSearch}
                startProcessInstance8={startProcessInstance8}
                startProcessInstance7={startProcessInstance7}
                actions={actions}
            />
        </div>
    );
};
