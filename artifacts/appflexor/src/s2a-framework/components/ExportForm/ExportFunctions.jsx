import { useState } from "react";
import { jsonExport } from "../../utils/utils";
import { toastEmitter } from "../Toastify/Toastify";

function ExportForm(props) {
    const { nameExport, fileName="" } = props;
    const [name, setName] = useState(fileName);
    return (
        <>
            <label
                htmlFor="name"
                className="mb-2 fw-bold">
                Export File Name
            </label>
            <input
                className="form-control mb-2"
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <button
                title="Provide File Name"
                disabled={name.length < 1}
                className="btn btn-sm button-theme float-end"
                onClick={() => nameExport(name, true)}>
                Export
            </button>
        </>
    );
}

function exportData(modalRef, filterItems, setFilteredItems, type) {
    let _selectedItems = filterItems.filter(item => item.selected === true);
    if (_selectedItems.length === 1) {
        jsonExport(filterItems, setFilteredItems, undefined, type);
    } else if (_selectedItems.length > 1) {
        modalRef.current.show();
    } else {
        toastEmitter("Select Item First", true, "warning");
    }
}

export { ExportForm, exportData };
