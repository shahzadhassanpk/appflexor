import { Interweave } from "interweave";

export default function DatalistActionsButtons(props) {
    const {
        flag,
        handleAddNew,
        viewerBtn,
        setViewerBtn,
        selectedExport,
        resetAllFilters,
        deleteAll,
        bulkActions,
        executeBulkAction,
    } = props;

    return (
        <div className="d-flex align-items-center gap-2 flex-wrap mt-2da">
            {flag.add === true && (
                <span className="">
                    <button
                        className="btn btn-sm button-theme mb-1"
                        title="Add"
                        onClick={() => handleAddNew(flag)}>
                        {/* <i className="fa fa-plus"></i> Add */}
                        <Interweave
                            content={flag && flag.titles && flag.titles.add}
                        />
                    </button>
                </span>
            )}
            {viewerBtn &&
                viewerBtn.showImport === true &&
                flag?.selectedItem?.type !== "SQL" && (
                    <span className="">
                        <button
                            title="Import"
                            className="btn btn-sm button-theme mb-1"
                            onClick={() =>
                                setViewerBtn(prev => ({
                                    ...prev,
                                    import: true,
                                }))
                            }>
                            {/* <i className="fa-solid fa-file-import"></i> Import */}
                            <Interweave
                                content={
                                    flag && flag.titles && flag.titles.import
                                }
                            />
                        </button>
                    </span>
                )}
            {viewerBtn.showExport === true && (
                <span className="">
                    <button
                        className="btn btn-sm button-theme mb-1"
                        title="Export"
                        onClick={() => selectedExport()}>
                        {/* <i className="fa-solid fa-file-export"></i>{" "} */}
                        <Interweave
                            content={flag && flag.titles && flag.titles.export}
                        />
                    </button>
                </span>
            )}
            {viewerBtn && viewerBtn.showRefresh === true && (
                <span className="">
                    <button
                        className="btn btn-sm button-theme mb-1"
                        title="Refresh"
                        onClick={() =>
                            setViewerBtn(prev => ({
                                ...prev,
                                refresh: true,
                            }))
                        }>
                        {/* <i className="fa fa-refresh"></i> Refresh */}
                        <Interweave
                            content={flag && flag.titles && flag.titles.refresh}
                        />
                    </button>
                </span>
            )}
            {viewerBtn && viewerBtn.showReset === true && (
                <span className="">
                    <button
                        className="btn btn-sm button-theme mb-1"
                        title="Reset All Filters"
                        onClick={() => resetAllFilters()}>
                        {/* <i className="fa-solid fa-rotate-left me-1"></i>
                        Reset Filters */}
                        <Interweave
                            content={
                                flag && flag.titles && flag.titles.resetfilter
                            }
                        />
                    </button>
                </span>
            )}
            {flag && flag.allowall === true && flag && flag.delete === true && (
                <span className="">
                    <button
                        className="btn btn-sm del-btn-theme mb-1"
                        title="Delete"
                        onClick={() => deleteAll()}>
                        <i className="fa fa-trash"></i> Delete {flag.allowall}
                    </button>
                </span>
            )}

            {/* <pre>
                    <code>
                        selected item : {JSON.stringify(bulkActions, null, 2)}
                    </code>
                </pre> */}
            {bulkActions.map(bulkAction => (
                <span>
                    <button
                        title={bulkAction.list_title}
                        className={`btn btn-sm  button-theme mb-1`}
                        key={bulkAction.id}
                        onClick={() => executeBulkAction(bulkAction)}>
                        {bulkAction.title}
                    </button>
                </span>
            ))}

            {/* {flag && flag.allowall === true && (
                <span className="pe-1">
                    <button
                        className="btn btn-sm del-btn-theme mb-1"
                        title="Delete"
                        onClick={() => deleteAll()}>
                        <i className="fa fa-trash"></i> Delete
                    </button>
                </span>
            )} */}
        </div>
    );
}
