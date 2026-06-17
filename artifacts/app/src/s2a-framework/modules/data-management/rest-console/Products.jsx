import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import { API_URL } from "../../Config";

function Products({ isAuthorized, activeTab }) {
    let initialState = {
        id: "",
        product_key: "",
        product_name: "",
    };
    const [items, setItems] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [selectedItem, setSelectedItem] = useState(initialState);

    useEffect(() => {
        getData();
    }, [isAuthorized, activeTab.products]);

    useEffect(() => {
        if (selectedItem && selectedItem.product_name.length > 0) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedItem]);

    function getselectedItem(item) {
        setSelectedItem(item);
    }

    function addNewItem() {
        setSelectedItem(initialState);
        setSaveIsDisabled(true);
    }

    function clearFields() {
        addNewItem();
    }

    function handleInputField(event, id) {
        let value = event.target.value;
        let name = event.target.name;

        setSelectedItem(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function saveData(callback) {
        var url = API_URL + "?service.key=update.formData";
        var request = {};
        request.data = [];
        var entityForm = {};

        entityForm.formId = "products"; //"formid"
        entityForm.entity = "products"; //Db- "table name"
        entityForm.action = "update";

        if (
            !selectedItem.id ||
            selectedItem.id == "" ||
            selectedItem.id == "new"
        ) {
            entityForm.id = "new";
            selectedItem.id = "new";
        } else {
            entityForm.id = selectedItem.id;
        }

        entityForm.formData = selectedItem;
        request.data.push(entityForm);

        try {
            axios.post(url, request).then(function (response) {
                if (response.status === 200) {
                    if (selectedItem.id === "new" || selectedItem.id === "") {
                        selectedItem.id = response.data.C_NEW_RECORD_ID;
                    }
                    clearFields();
                    getData();
                }
            });
        } catch (e) {
            console.log("Save error:" + e);
        }
        getData();
    }

    function deleteData(item) {
        if (window.confirm("Are you sure to delete?") == true) {
            let fieldsData = item;

            let request = {};
            request.data = [];
            let entityForm = {};
            entityForm.formId = "products";
            entityForm.entity = "products";
            entityForm.action = "delete";

            entityForm.id = fieldsData.id;
            request.data.push(entityForm);

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        clearFields();
                        getData();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            // console.log("you press cancel")
        }
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "products",
                    serviceKey: "console.products",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (response.status === 200) {
                    if (response.data.C_STATUS === "UNAUTHORIZED") {
                        console.log(`UNAUTHORIZED, please login.`);
                    } else if (response.data.C_STATUS === "SUCCESS") {
                        // console.log(typeof response.data);
                        // console.log(response.data);
                        if (response.data.C_DATA.products) {
                            setItems(response.data.C_DATA.products);
                        } else {
                            console.log(
                                `Either app.products does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <React.Fragment>
            <div className="row my-2 px-3">
                <div className="col-sm-12 p-0">
                    <Table className="s2a-table table-bordered table-hover mb-0">
                        <Thead className="thead">
                            <Tr className="tableHeader">
                                <Th className="col-sm-4 table-row text-left">
                                    Name
                                </Th>
                                <Th className="col-sm-4 table-row text-left">
                                    Key
                                </Th>
                                <Th className="col-sm-4 table-row text-left"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {items.map(item => {
                                return (
                                    <Tr
                                        key={item.id}
                                        className={` ${
                                            item.id === selectedItem.id
                                                ? "selected-cell"
                                                : " "
                                        }`}
                                        onClick={() => getselectedItem(item)}>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.product_name}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            {item.product_key}
                                        </Td>
                                        <Td className="col-sm-4 table-row text-left">
                                            <a
                                                className=""
                                                style={{ cursor: "pointer" }}
                                                onClick={() =>
                                                    deleteData(item)
                                                }>
                                                Delete
                                            </a>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </div>
            </div>
            <div className="col-sm-12 p-0">
                <a
                    type="button"
                    className="btn button-theme  btn-sm pull-left my-2"
                    onClick={addNewItem}>
                    Add New
                </a>
            </div>
            <div className="form col-sm-12 form-border my-2 px-3">
                <div className="row">
                    <div className="col-sm-3">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Product Name&nbsp;
                                <span className="text-danger">*</span>
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="product_name"
                                value={selectedItem.product_name}
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                    <div className="col-sm-3">
                        <div className="form-group">
                            <label className="mt-1 fw-bold">
                                Product Key&nbsp;
                                <span className="text-danger"></span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="product_key"
                                value={selectedItem.product_key}
                                onChange={handleInputField}
                            />
                        </div>
                    </div>
                </div>
                {selectedItem.id === "" && (
                    <button
                        className="btn button-theme  btn-sm pull-left m-2 ms-0"
                        onClick={saveData}
                        disabled={saveIsDisabled}>
                        <span className="fa fa-check pe-1"></span> Save
                    </button>
                )}
                {selectedItem.id !== "" && (
                    <button
                        className="btn btn-warning btn-sm pull-left m-2 ms-0"
                        onClick={saveData}
                        disabled={saveIsDisabled}>
                        <span className="glyphicon glyphicon-ok"></span> Update
                    </button>
                )}
                {selectedItem.id === "" && (
                    <button
                        className="btn btn-warning btn-sm pull-left m-2 text-light"
                        onClick={clearFields}>
                        <span className="glyphicon glyphicon-remove"></span>{" "}
                        Cancel
                    </button>
                )}
            </div>
        </React.Fragment>
    );
}

export { Products };
