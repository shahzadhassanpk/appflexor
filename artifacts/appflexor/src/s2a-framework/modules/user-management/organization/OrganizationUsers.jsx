import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { MultiSelect } from "react-multi-select-component";
import { API_URL } from "../../../Config";
import { toastEmitter } from "../../../components/Toastify/Toastify";

function OrganizationUsers({
    selectedId,
    userList = [],
    activeTab,
    existingUsers,
    getUsers,
}) {
    let initialState = {
        id: "new",
        userid: [],
        organizationid: selectedId,
    };
    let initialStateEmployment = {
        id: "new",
        userid: "",
        organizationid: selectedId,
    };
    const [selectedEntity, setSelectedEntity] = useState(initialState);
    const [selectedEmployment, setSelectedEmployment] = useState(
        initialStateEmployment,
    );
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedMultiUser, setSelectedMultiUser] = useState([]);
    const [saveIsDisabled, setSaveIsDisabled] = useState(true);
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        setSaveIsDisabled(!isChanged);
    }, [isChanged]);

    useEffect(() => {
        getUsers();
        setIsChanged(false);
    }, [selectedId]);

    useEffect(() => {
        if (selectedId && userList.length > 0) {
            // Filter by organization
            let tempArr = userList.filter(a => {
                return !a.organizationid || a.organizationid == selectedId;
            });

            // Deduplicate by 'id'
            const uniqueArr = tempArr.filter(
                (user, index, self) =>
                    index === self.findIndex(u => u.id === user.id),
            );

            // Ensure each object has value & label for MultiSelect
            const formattedArr = uniqueArr.map(u => ({
                ...u,
                value: u.id,
                label: u.username || u.firstname || "Unknown",
            }));

            setFilteredUsers(formattedArr);
        }
    }, [selectedId, userList]);

    useEffect(() => {
        if (selectedId && activeTab.organizationUsers === "true") {
            getData(selectedId);
        }
    }, [selectedId, activeTab.organizationUsers]);

    function handleUserChange(selectedObjects) {
        setSelectedUsers(selectedObjects);
        setSelectedMultiUser(selectedObjects);
        setIsChanged(true);
    }

    function handleEmployment(_entity, organizationid) {
        let finalArr = [];
        _entity.forEach(item => {
            item.label = getNameById(item.userid).username;
            // item.label = getNameById(item.userid).firstname;
            item.value = item.userid;
            item.organizationid = organizationid;
            finalArr.push(item);
        });
        return finalArr;
    }

    function getData(id) {
        const dataRequest = {
            dataKeys: [
                {
                    serviceParams: id,
                    dataKey: "dirEmployment",
                    serviceKey: "sys.dir.employment",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    let _entityUsers = response.data.C_DATA.dirEmployment;
                    // existingUsers(_entityUsers);
                    setSelectedUsers(_entityUsers);
                    // setSelectedEntity(prev => ({
                    //     ...prev,
                    //     id: "new",
                    //     organizationid: id,
                    // }));
                    let employment = handleEmployment(_entityUsers, id);

                    setSelectedMultiUser(employment);
                    // handleUserChange(employment);
                    setUsers(_entityUsers);
                    //   console.log(_entity)
                    // if(id){
                    //     setSelectedEmployment((prev)=>({
                    //         ...prev,
                    //         id:id
                    //     }))
                    // }
                    //   if (_entity) {
                    //
                    //   } else {
                    //     setSelectedEntity(initialState)
                    //     setSelectedUsers([])
                    //   }
                } else {
                    setSelectedEmployment(initialStateEmployment);
                    // setSelectedEntity(prev => ({
                    //     ...prev,
                    //     organizationid: id,
                    // }));
                    setSelectedUsers([]);
                    // console.log("Unable to getData...");
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    function getNameById(userid) {
        let result = {};
        userList &&
            userList.forEach(user => {
                if (user.value === userid) {
                    result = user;
                }
            });
        return result;
    }

    function multiEmploymentRequest() {
        let employment = {};
        let request = {};
        request.data = [];

        selectedEntity.userid.forEach(item => {
            employment = {
                formId: "dir_employment",
                entity: "dir_employment",
                action: "update",
                formData: {
                    id: "new",
                    userid: item.value,
                    organizationid: selectedId,
                },
                id: "new",
            };
            request.data.push(employment);
        });
        return request;
    }

    function getArrayById(arr, organizationid) {
        let result = [];
        arr.forEach(obj => {
            if (obj.organizationid === organizationid) {
                result.push(obj);
            }
        });
        return result;
    }

    function multiEmploymentRequestDelete(deleteEmployment) {
        let employment = {};
        let request = {};
        request.data = [
            {
                formId: "dir_employment",
                entity: "dir_employment",
                action: "fk_delete",
                id: selectedId,
                fk_id: selectedId,
                fk_name: "organizationid",
            },
        ];
        return request;
    }

    function saveEntityUser() {
        let employment = [];
        let request;
        if (selectedEntity.id !== "new" || users.length === 0) {
            let currentDelEmploymentArray = getArrayById(
                users,
                selectedEntity.organizationid,
            );
            setUsers(employment);
            if (currentDelEmploymentArray.length > 0) {
                deleteBeforeUpdate(currentDelEmploymentArray);
            }
            request = multiEmploymentRequest();

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS == "SUCCESS") {
                        if (
                            selectedEntity.id === "" ||
                            selectedEntity.id === "new"
                        ) {
                            selectedEntity.id =
                                response.data.C_DATA[0].formData.id;
                            toastEmitter(
                                "Organization user(s) added successfully",
                                true,
                            );
                        }
                        getData(
                            response.data.C_DATA[0].formData.organizationid,
                        );
                        getUsers();
                    } else {
                        console.log("Unable to save EntityUser...");
                    }
                    setIsChanged(false);
                })
                .catch(error => {
                    console.log(error);
                });
        } else {
            if (
                selectedEntity.id !== "new" ||
                selectedEntity.id === "new" ||
                (selectedEntity.id !== "" && users.length > 0)
            ) {
                let currentDelEmploymentArray = getArrayById(
                    users,
                    selectedEntity.organizationid,
                );
                setUsers(employment);
                if (currentDelEmploymentArray.length > 0) {
                    deleteBeforeUpdate(currentDelEmploymentArray);
                }
                toastEmitter("Organization user(s) updated successfully", true);
            }
        }
    }

    function saveEntityUserAfterDelete() {
        let request;

        request = multiEmploymentRequest();
        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS == "SUCCESS") {
                    if (
                        selectedEntity.id === "" ||
                        selectedEntity.id === "new"
                    ) {
                        selectedEntity.id = response.data.C_DATA[0].formData.id;
                    }
                    getData(response.data.C_DATA[0].formData.organizationid);
                } else {
                    console.log("Unable to save EntityUser...");
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    function deleteBeforeUpdate(deleteEmployment) {
        let request;
        request = multiEmploymentRequestDelete(deleteEmployment);

        axios
            .post(API_URL + "?service.key=update.formData", request)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    setUsers([]);
                    setSelectedEntity(prev => ({
                        ...prev,
                        id: "new",
                    }));
                    saveEntityUserAfterDelete();
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
    const [currentUserList, setCurrentUserList] = useState([]);

    useEffect(() => {
        const finalResult = getObjectById();
        const uniqueResult = finalResult.filter(
            (v, i, a) => a.findIndex(u => u.id === v.id) === i,
        );
        setCurrentUserList(uniqueResult);
    }, [selectedUsers]);

    function getObjectById() {
        const result = userList.filter(user =>
            selectedUsers.some(su => su.value === user.id),
        );
        return result;
    }

    return (
        <div
            id="organization-users"
            className="col-sm-12 inventory-details-panel org-users">
            <div className="row mt-2">
                <div className="col-sm-4">
                    <div className="form-group">
                        <label className="mb-1 fw-bold">
                            Available User&nbsp;
                            <span className="text-danger">*</span>
                        </label>
                        <MultiSelect
                            options={filteredUsers}
                            value={selectedMultiUser}
                            onChange={handleUserChange}
                            labelledBy="Select"
                        />
                    </div>
                </div>
                {selectedId !== "" && selectedId !== "new" && (
                    <div className="col-sm-12 mt-2">
                        <div className="form-group">
                            <label className="mb-1 fw-bold">
                                Associated Users
                            </label>
                            <div className="d-flex s2a-border p-2 org-user-badge">
                                <Badges
                                    selectedUsers={selectedUsers}
                                    userList={currentUserList}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="row mt-2">
                <div className="col-sm-12">
                    <button
                        type="button"
                        className="btn button-theme btn-sm pull-left me-2 ms-0"
                        onClick={saveEntityUser}
                        disabled={saveIsDisabled}>
                        <i className="fa-solid fa-floppy-disk pe-1"></i>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function Badges({ userList }) {
    return (
        <React.Fragment>
            <Badge userList={userList} />
        </React.Fragment>
    );
}

function Badge({ userList }) {
    return (
        <span>
            {/* {getObjectById(selectedUsers, name)} */}
            {userList &&
                userList.length > 0 &&
                userList.map(item => {
                    return (
                        <span
                            className="badge rounded-pill text-bg-light me-2"
                            key={item.id}>
                            {item.label}
                        </span>
                    );
                })}
        </span>
    );
}

export { OrganizationUsers };
