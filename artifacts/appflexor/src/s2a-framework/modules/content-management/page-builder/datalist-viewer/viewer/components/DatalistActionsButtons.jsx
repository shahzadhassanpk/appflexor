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
        <div className="s2a-dl-actions">
            {/* ── New (primary) ── */}
            {flag.add === true && (
                <button
                    className="s2a-dl-btn-primary"
                    title="Add"
                    onClick={() => handleAddNew(flag)}>
                    <Interweave content={flag?.titles?.add} />
                </button>
            )}

            {/* ── Import ── */}
            {viewerBtn?.showImport === true && flag?.selectedItem?.type !== "SQL" && (
                <button
                    title="Import"
                    className="s2a-dl-btn-ghost"
                    onClick={() =>
                        setViewerBtn(prev => ({ ...prev, import: true }))
                    }>
                    <Interweave content={flag?.titles?.import} />
                </button>
            )}

            {/* ── Export ── */}
            {viewerBtn?.showExport === true && (
                <button
                    className="s2a-dl-btn-ghost"
                    title="Export"
                    onClick={() => selectedExport()}>
                    <Interweave content={flag?.titles?.export} />
                </button>
            )}

            {/* ── Refresh ── */}
            {viewerBtn?.showRefresh === true && (
                <button
                    className="s2a-dl-btn-ghost"
                    title="Refresh"
                    onClick={() =>
                        setViewerBtn(prev => ({ ...prev, refresh: true }))
                    }>
                    <Interweave content={flag?.titles?.refresh} />
                </button>
            )}

            {/* ── Reset Filters ── */}
            {viewerBtn?.showReset === true && (
                <button
                    className="s2a-dl-btn-ghost"
                    title="Reset All Filters"
                    onClick={() => resetAllFilters()}>
                    <Interweave content={flag?.titles?.resetfilter} />
                </button>
            )}

            {/* ── Bulk action buttons ── */}
            {bulkActions?.map(bulkAction => (
                <button
                    key={bulkAction.id}
                    title={bulkAction.list_title}
                    className="s2a-dl-btn-ghost"
                    onClick={() => executeBulkAction(bulkAction)}>
                    {bulkAction.title}
                </button>
            ))}
        </div>
    );
}
