import axios from "axios";
import $ from "jquery";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../../Config";
import { Organization } from "./Organization";
import { deleteItem, filterArrayByTerms } from "../../../utils/utils";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import { getData as globalGetData } from "../../../components/CrudApiCall";
import Scroll from "../../../components/Scroll/Scroll";
import ChildrenModal from "../../../components/ChildrenModal/ChildrenModal";
import DeleteConfimation from "../../../components/delete-confimation";

function OrganizationList({ isAuthorized, activeTab }) {
    let initialState = {
        id: "new",
        name: "",
        email: "",
        phone: "",
        address: "",
        location: "",
        city: "",
        country: "",
    };
    const [error, setError] = useState(null);
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [cancelIsDisabled, setCancelIsDisabled] = useState(false);
    const [entity, setEntity] = useState([]);
    const [types, setTypes] = useState([]);
    const [addNewState, setAddNewState] = useState({
        clear: false,
    });
    const [filteredEntity, setFilteredEntity] = useState(entity);
    const [selectedEntity, setSelectedEntity] = useState(initialState);
    const [selectedFilteredType, setSelectedFilteredType] = useState({
        type: "",
    });
    const [userList, setUserList] = useState([]);
    const [entityUserList, setEntityUserList] = useState([]);
    const inputReference = useRef(null);
    const deleteModalRef = useRef(null);

    let fields = checkArray(entity) && Object.keys(entity[0]);

    useEffect(() => {
        if (activeTab === "ORGANIZATIONS") {
            handleAddNewAction();
            getData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedEntity && selectedEntity.name.length > 0) {
            setSaveIsDisabled(false);
        } else {
            setSaveIsDisabled(true);
        }
    }, [selectedEntity]);

    useEffect(() => {
        let result = [];
        let value = selectedFilteredType.type.toString();

        result = filterIt(value, entity);
        setFilteredEntity(result);
    }, [selectedFilteredType]);

    function handleInputChange(event) {
        let value = event.target.value;
        let name = event.target.name;
        setSelectedEntity(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function checkArray(a) {
        try {
            for (let key in a) {
                if (key) {
                    return true;
                }
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    async function getSelectedEntity(item) {
        if (item.id === selectedEntity.id) return;
        const res = await getItemById(item.id);
        const selectedItem = res.data.C_DATA.entity[0];
        setSelectedEntity(selectedItem);
    }

    function getItemById(id) {
        const keys = [
                {
                    params: id,
                    dataKey: "entity",
                    serviceKey: "sys.dir.selected.organization",
                    mode: "formData",
                },
            ],
            url = API_URL + "?service.key=masterKey.tenantData",
            datasource = "",
            tenant_id = "";
        return globalGetData({ keys, url, datasource, tenant_id });
    }

    function clearFields() {
        handleAddNewAction();
    }

    function handleSearch(event) {
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        result = filterArrayByTerms(entity, value, fields);
        setFilteredEntity(result);
    }

    function handleFilterInput(_entityList) {
        let text = document.getElementById("entity-search").value;
        let _result = [];
        _result = filterIt(text, _entityList);
        setEntity(_entityList);
        setFilteredEntity(_result);
    }

    function filterIt(terms, arr) {
        if ("" === terms || terms.length < 3 || terms === "Show All")
            return arr;
        const words = terms.match(/\w+|"[^"]+"/g);
        words.push(terms);
        return arr.filter(a => {
            const v = Object.values(a);
            const f = JSON.stringify(v).toLowerCase();

            return words.every(val => f.includes(val));
        });
    }

    function handleAddNewAction() {
        let data = addNewState.adnew;

        setSaveIsDisabled(true);
        setSelectedEntity(initialState);
        setAddNewState(prevState => ({
            ...prevState,
            clear: !data,
        }));
    }

    function getData(callback) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "dirOrganization",
                    serviceKey: "sys.dir.organization",
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "userList",
                    serviceKey: "sys.dir.user",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    let _entity = response.data.C_DATA.dirOrganization;
                    setEntity(_entity);

                    let mainArr = response.data.C_DATA.userList;
                    let finalArr = [];

                    mainArr.forEach(item => {
                        item.label = item.username;
                        item.value = item.id;
                        item.organizationid = item.organizationid;
                        finalArr.push(item);
                    });
                    setUserList(finalArr);
                    setIsLoaded(true);
                    if (callback) {
                        callback(_entity);
                    }

                    if (!callback) {
                        setEntity(_entity);
                        setFilteredEntity(_entity);
                    }
                } else {
                    setError("Unable to get data");
                }
            })
            .catch(error => {
                console.error(error);
                setError(error);
            });
    }

    function saveEntity() {
        // let fieldsData = removeSpecificKeys(selectedEntity);
        let fieldsData = selectedEntity;
        let request = {};
        request.data = [];
        let entityForm = {};
        entityForm.formId = "dir_organization";
        entityForm.entity = "dir_organization";
        entityForm.action = "update";

        if (fieldsData.id && fieldsData.id !== "") {
            entityForm.id = fieldsData.id;
        } else {
            entityForm.id = "new";
        }
        delete fieldsData.parentid;
        entityForm.formData = fieldsData;

        request.data.push(entityForm);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    $(".success-message").html(`Entity saved successfully`);
                    $(".success-message").fadeIn();
                    $(".success-message").fadeOut(3000);
                    // getData(handleFilterInput);
                    if (fieldsData.id === "" || fieldsData.id === "new") {
                        fieldsData.id = response.data.C_DATA[0].formData.id;
                        setSelectedEntity(prev => ({
                            ...prev,
                            id: fieldsData.id,
                        }));
                        setEntity(prev => [...prev, fieldsData]);
                        setFilteredEntity(prev => [...prev, fieldsData]);
                        toastEmitter("Organization Created Successfully", true);
                    } else {
                        setEntity(prev =>
                            prev.map(entity =>
                                entity.id === selectedEntity.id
                                    ? selectedEntity
                                    : entity,
                            ),
                        );
                        setFilteredEntity(prev =>
                            prev.map(entity =>
                                entity.id === selectedEntity.id
                                    ? selectedEntity
                                    : entity,
                            ),
                        );
                        toastEmitter("Organization Updated Successfully", true);
                    }
                    // getData();
                    // clearFields();
                    setIsLoaded(true);
                } else {
                    setError("Unable to save Entity.....");
                }
            })
            .catch(error => {
                setError(error);
            });
    }

    function existingUsers(users) {
        setEntityUserList(users);
    }

    function showDeleteModal() {
        deleteModalRef.current.show();
    }

    function handleDeleteEntity(selectedItem) {
        let fieldsData = selectedItem;

        let request = {};
        request.data = [
            {
                formId: "associated_site",
                entity: "associated_site",
                action: "fk_delete",
                fk_name: "organization_id",
                id: fieldsData?.id,
                fk_id: fieldsData?.id,
            },
            {
                formId: "dir_employment",
                entity: "dir_employment",
                action: "fk_delete",
                fk_name: "organizationid",
                id: fieldsData?.id,
                fk_id: fieldsData?.id,
            },
            {
                formId: "dir_organization",
                entity: "dir_organization",
                action: "delete",
                id: fieldsData?.id,
            },
        ];

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    $(".danger-message").html(`Entity deleted`);
                    $(".danger-message").fadeIn();
                    $(".danger-message").fadeOut(3000);
                    // getData(handleFilterInput);
                    // getData();
                    setEntity(prev =>
                        prev.filter(item => item.id !== fieldsData.id),
                    );
                    setFilteredEntity(prev =>
                        prev.filter(item => item.id !== fieldsData.id),
                    );
                    clearFields();

                    setIsLoaded(true);
                    toastEmitter("Organization Deleted Successfully", true);
                } else {
                    setError("Unable to delete data.....");
                }
            })
            .catch(error => {
                setError(error);
            });
    }

    return (
        <React.Fragment>
            <ChildrenModal
                centered
                size="md"
                header="Delete Organization"
                ref={deleteModalRef}>
                <DeleteConfimation
                    item={selectedEntity}
                    deleteModalRef={deleteModalRef}
                    handleDelete={handleDeleteEntity}
                    message={"Are you sure to Delete Organization?"}
                />
            </ChildrenModal>
            <div
                className="org-list"
                id="organization-list">
                <div className="row py-2 m-0">
                    <div className="col-sm-3 ps-0 pe-2 border-end border-color">
                        {/* <div className="col-sm-12 mb-2">
                            <label className="fw-bold">Organizations Available</label>
                        </div> */}
                        <div className="col-sm-12 mb-2">
                            <div className="search-input search-field input-group mb-1">
                                <i className="input-search-icon fa-solid fa-magnifying-glass text-muted"></i>
                                <input
                                    id="entity-search"
                                    ref={inputReference}
                                    type="text"
                                    className="form-control"
                                    onChange={handleSearch}
                                    placeholder="Search..."
                                />
                                {/* <span className="input-group-text fs-6">
                                    Ctrl + /
                                </span> */}
                            </div>
                        </div>
                        <div className="col-sm-12 listing-col p-0">
                            <Scroll height="48vh">
                                <ul className="list-group list-group-flush">
                                    {filteredEntity &&
                                        filteredEntity.length > 0 &&
                                        filteredEntity.map(item => {
                                            return (
                                                <li
                                                    key={item.id}
                                                    className={`${
                                                        item.id ==
                                                        selectedEntity.id
                                                            ? "list-group-item selected-cell"
                                                            : "list-group-item"
                                                    }`}
                                                    onClick={() =>
                                                        getSelectedEntity(item)
                                                    }>
                                                    <div className="table-row cursor-pointer">
                                                        <span className="d-flex">
                                                            {item.name}
                                                        </span>
                                                        {item.city && (
                                                            <span className="d-flex">
                                                                {item.city}
                                                                {", "}
                                                                {item.country}
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                </ul>
                            </Scroll>
                        </div>
                    </div>
                    <div className="col-sm-9 p-0">
                        <Organization
                            selectedItem={selectedEntity}
                            setSelectedEntity={setSelectedEntity}
                            clearFields={clearFields}
                            handleInputChange={handleInputChange}
                            handleSaveEntity={saveEntity}
                            handleDeleteEntity={showDeleteModal}
                            saveIsDisabled={saveIsDisabled}
                            cancelIsDisabled={cancelIsDisabled}
                            invalidEmail={invalidEmail}
                            handleAddNewAction={handleAddNewAction}
                            userList={userList}
                            existingUsers={existingUsers}
                            getData={getData}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default OrganizationList;
