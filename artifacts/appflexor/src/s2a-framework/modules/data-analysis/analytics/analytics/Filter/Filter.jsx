import React from "react";

function NumberRange({
    column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
    const [min, max] = React.useMemo(() => {
        let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
        preFilteredRows.forEach(row => {
            min = Math.min(row.values[id], min);
            max = Math.max(row.values[id], max);
        });
        return [min, max];
    }, [id, preFilteredRows]);

    return (
        <div className="row s2a-analytic-filter">
            <div className="col-sm-6">
                <input
                    className="form-control"
                    value={filterValue[0] || ""}
                    type="number"
                    onChange={e => {
                        const val = e.target.value;
                        setFilter((old = []) => [
                            val ? parseInt(val, 10) : undefined,
                            old[1],
                        ]);
                    }}
                    placeholder={`Min (${min})`}
                />
            </div>
            <div className="col-sm-6">
                <input
                    className="form-control"
                    value={filterValue[1] || ""}
                    type="number"
                    onChange={e => {
                        const val = e.target.value;
                        setFilter((old = []) => [
                            old[0],
                            val ? parseInt(val, 10) : undefined,
                        ]);
                    }}
                    placeholder={`Max (${max})`}
                />
            </div>
        </div>
    );
}

function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
}) {
    const count = preFilteredRows.length;

    return (
        <input
            className="form-control"
            value={filterValue || ""}
            onChange={e => {
                setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
        />
    );
}

function AnalyticFilterModal(props) {
    const { header, id, column, dataListLabel, uuid } = props;

    return (
        <div
            data-backdrop="false"
            className="modal"
            id={uuid}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1
                            id="staticBackdropLabel"
                            className="modal-title fs-5 text-truncate w-75">
                            {dataListLabel}
                        </h1>
                    </div>
                    <div className="modal-body">
                        <div className="">
                            {column.canFilter && column.render("Filter")}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="btn btn-sm button-theme"
                            data-bs-dismiss="modal"
                            data-bs-target={uuid}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { NumberRange, DefaultColumnFilter, AnalyticFilterModal };
