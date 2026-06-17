import React, { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import FieldContext from "./FieldContext";
import Listing from "./Listing";
import FormFieldModal from "./FormFieldModal";

export default function AddFormFields(props) {
    const { selectedForm, setSelectedForm } = props;
    const [selectedItem, setSelectedItem] = useState({});
    const fieldRef = useRef(null);

    const openModal = () => {
        fieldRef.current.showModal();
    };

    const updateModal = () => {
        fieldRef.current.updateModal();
    };
    const fields =
        selectedForm.fields !== "" && typeof selectedForm.fields === "string"
            ? JSON.parse(selectedForm.fields)
            : selectedForm.fields;
    const items = fields;
    const [filteredItems, setFilteredItems] = useState(fields);

    useEffect(() => {
        setSelectedForm({ ...selectedForm, fields: filteredItems });
    }, [filteredItems]);

    useEffect(() => {
        if (selectedForm.id) {
            setFilteredItems(fields ? fields : []);
        }
    }, [selectedForm.id]);

    const handleSearch = e => {
        const searchTerm = e?.target?.value || "";
        if (searchTerm.length > 0) {
            let filteredArray = [];
            filteredArray = items.filter(item => {
                return item.component.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
            });
            setFilteredItems(filteredArray);
        }
        if (searchTerm.length === 0) {
            setFilteredItems(items);
        }
    };

    const csvFieldsImport = () => {};

    return (
        <div className="add-formfield">
            <FieldContext.Provider
                value={{
                    items: filteredItems,
                    setItems: setFilteredItems,
                    openModal,
                    setSelectedItem,
                    selectedItem,
                    updateModal,
                }}>
                <div className="mb-2">
                    <FormFieldModal ref={fieldRef} />
                    <div className="d-flex justify-content-between">
                        <span className="fw-bold">Fields</span>
                        <span>
                            <span
                                className="me-2"
                                style={{ cursor: "pointer" }}>
                                {selectedForm.id === "new" || "" ? (
                                    <i className="fa-solid fa-file-import opacity-50"></i>
                                ) : (
                                    <i
                                        className="fa-solid fa-file-import"
                                        onClick={csvFieldsImport}></i>
                                )}
                            </span>
                            <span style={{ cursor: "pointer" }}>
                                {selectedForm.id === "new" ||
                                selectedForm.id === "" ? (
                                    <i className="fa-solid fa-plus opacity-50"></i>
                                ) : (
                                    <i
                                        className="fa-solid fa-plus"
                                        onClick={openModal}></i>
                                )}
                            </span>
                        </span>
                    </div>
                    <div className="mt-1 mb-1">
                        <input
                            type="text"
                            className="form-control  form-control-sm"
                            placeholder="Search fields by title"
                            disabled={selectedForm.id === "new" || ""}
                            onChange={handleSearch}
                        />
                    </div>
                </div>
                <Listing />
            </FieldContext.Provider>
        </div>
    );
}
