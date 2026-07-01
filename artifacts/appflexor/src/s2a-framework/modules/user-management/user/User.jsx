import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { MultiSelect } from "react-multi-select-component";
import { API_URL } from "../../../Config";
// import useKeyboardShortcut from "../../../utils/useKeyboardShortcut";
import MD5 from "crypto-js/md5";
import $ from "jquery";
import ModalBox from "../../../components/Modal/Modal";
import ModuleFormViewer from "../../../components/ModuleFormViewer/ModuleFormViewer";
import { TablePagination } from "../../../components/TablePagination/TablePagination";
import { toastEmitter } from "../../../components/Toastify/Toastify";
import {
    deleteItem,
    filterArrayByTerms,
    insertItem,
    updateItem,
} from "../../../utils/utils";
import { UserForm } from "./UserForm";
import { UserTable } from "./UserTable";
import { getData } from "../../../components/CrudApiCall";
import { AppContext } from "../../../../AppContext";

function User({ isAuthorized, activeTab }) {
    let initialUserObject = {
        id: " ",
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        email: "",
        groupid: "",
        roleid: "",
        userid: " ",
        active: "1",
        provider: "system",
    };
    // const $ = window.$
    // const navigate = useNavigate();
    const appContext = useContext(AppContext);
    const { tenantSubscription } = appContext;
    const inputReference = useRef(null);
    const [userList, setUserList] = useState([]);
    const [selectedUser, setSelectedUser] = useState(initialUserObject);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [userRole, setUserRole] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [group, setGroup] = useState([]);
    const [role, setRole] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [employments, setEmployments] = useState([]);
    const [userRegisteredUsername, setUserRegisteredUsername] = useState(null);
    const [error, setError] = useState([]);
    const [show, setShow] = useState(false);
    const [size, setSize] = useState(10);
    const [current, setCurrent] = useState(1);
    const [userLimit, setUserLimit] = useState(tenantSubscription?.user_limit);
    const [activeUsers, setActiveUsers] = useState();
    const [allowUser, setAllowUser] = useState(false);

    const [showModal, setShowModal] = useState({
        show: false,
        item: {},
        condition: "",
    });
    const [formModal, setFormModal] = useState(false);

    let fields = checkArray(userList) && Object.keys(userList[0]);

    const handleClose = () => setFormModal(false);

    const getPaginateData = (current, pageSize) => {
        return filteredUsers.slice(
            (current - 1) * pageSize,
            current * pageSize,
        );
    };

    useEffect(() => {
        if (activeTab === "USERS") {
            getUserData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (parseInt(activeUsers) >= parseInt(userLimit)) {
            setAllowUser(false);
        } else {
            setAllowUser(true);
        }
    }, [userLimit, activeUsers]);

    useEffect(() => {
        if (
            selectedUser.firstname.length > 0 &&
            selectedUser.lastname.length > 0 &&
            selectedUser.username.length > 0 &&
            selectedUser.email.length > 0 &&
            selectedUser.roleid.length > 0 &&
            selectedUser.groupid.length > 0 &&
            selectedUser.password.length > 0 &&
            confirmPassword.length > 0
        ) {
        }
    }, [selectedUser, confirmPassword]);

    useEffect(() => {
        console.log(filteredUsers);
    }, [filteredUsers]);

    async function getSelectedUser(userObject) {
        let filterArr = [];
        const res = await getSelectedUserById(userObject.id);
        if (res.data.C_STATUS === "FAIL") {
            toastEmitter("User not found", true, "error");
            return;
        }
        const selectedUser = res.data.C_DATA.selectedUser;
        const userMapping = {};

        selectedUser.forEach(user => {
            if (userMapping[user.id]) {
                userMapping[user.id].groupid.push(user.groupid);
            } else {
                const group = [user.groupid];
                user.groupid = group;
                userMapping[user.id] = user;
            }
        });
        const users = Object.values(userMapping);
        userObject = users[0];

        userObject.groupid.forEach(id => {
            const index = group.findIndex(e => e.id === id);
            if (index !== -1) {
                filterArr.push(group[index]);
            }
        });

        let userTempObj = {
            id: userObject.id,
            username: userObject.username,
            password: userObject.password,
            firstname: userObject.firstname,
            lastname: userObject.lastname,
            email: userObject.email,
            groupid: filterArr,
            roleid: userObject.roleid,
            userid: userObject.userid,
            active: userObject.active,
            provider: userObject.provider,
        };
        //set system as provider if not already set
        if(!userTempObj.provider){
            userTempObj.provider = "system";
        }

        setSelectedUser(userTempObj);
        setFilteredGroups(filterArr);
        setShow(false);
        setError([]);
        setFormModal(true);
    }

    function getSelectedUserById(id) {
        const keys = [
            {
                params: id,
                dataKey: "selectedUser",
                serviceKey: "sys.dir.selected.user",
                mode: "formData",
            },
        ];

        return getData({
            keys,
            url: API_URL + "?service.key=masterKey.tenantData",
        });
    }

    function adNewUser() {
        setConfirmPassword("");
        setError([]);
        setFilteredGroups([]);
        setSelectedGroups([]);
        setSelectedUser(initialUserObject);
        setShow(false);
        setFormModal(true);
    }

    function handleMultiSelectGroups(selectedObjects) {
        setFilteredGroups(selectedObjects);

        let groupids = [];
        selectedObjects.forEach(obj => {
            groupids.push(obj);
        });

        setSelectedUser(prev => ({
            ...prev,
            groupid: groupids,
        }));
    }

    function clearFields() {
        adNewUser();
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

    function handleSearch(event) {
        let value = "";
        if (event === undefined) {
            value = inputReference.current.value;
        } else if (event) {
            value = event.target.value.toLowerCase();
        }
        let result = [];
        result = filterArrayByTerms(userList, value, fields);
        setFilteredUsers(result);
        if (value.length > 2) {
            setCurrent(1);
        }
    }

    function handleInputField(event) {
        let value = "";
        let name = event.target.name;
        let type = event.target.type;

        if (type === "checkbox") {
            value = event.target.checked ? "1" : "0";
        } else {
            value = event.target.value;
        }

        setSelectedUser(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function validation(condition) {
        selectedUser.userid = selectedUser.id;
        let _selectedUser = { ...selectedUser };

        let _error = [];
        let filter =
            /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        for (let key in _selectedUser) {
            if (key === "email") {
                if (!filter.test(_selectedUser[key])) _error.push(key);
            }
            if (condition === "save" || condition === "update") {
                if (key === "password") {
                    if (_selectedUser[key]?.length < 3) _error.push(key);
                    if (
                        _selectedUser[key] !== confirmPassword &&
                        show &&
                        condition === "update"
                    ) {
                        _error.push("confirm_password");
                    } else if (
                        condition === "save" &&
                        _selectedUser[key] !== confirmPassword
                    ) {
                        _error.push("confirm_password");
                    }
                }
            }
            if (condition === "update") {
                if (key === "roleid") {
                    if (_selectedUser[key]?.length < 1) _error.push(key);
                }
            }

            if (key === "groupid") {
                if (_selectedUser[key]?.length < 1) _error.push(key);
            }
            if (key !== "active") {
                if (_selectedUser[key]?.length < 1) {
                    _error.push(key);
                }
            }
        }

        setError(_error);
        if (_error.length > 0) {
            return false;
        } else {
            return true;
        }
    }

    function validateAndSave() {
        let promise = new Promise(function (resolve, reject) {
            let callback = user => {
                if (user && user.length > 0) {
                    // $("#signup-msg").html("Username already exists");
                    // $("#signup-msg").fadeIn();
                    // $("#signup-msg").fadeOut(3000);
                    toastEmitter(`User Name already exist!`, true, "warning");
                    resolve(false);
                } else {
                    console.log("UserName is Unique");
                    // saveUserData(selectedUser)
                    resolve(true);
                }
            };
            getUserRegistered(selectedUser.username, callback);
        });
        let isValid = validation("save");
        if (isValid) {
            saveUserData(selectedUser);
        }
    }

    function validateAndUpdate() {
        if (validation("update")) {
            saveUserData(selectedUser);
        }
    }

    function getAssociationDataById(arr, id) {
        let result = {};
        arr.forEach(obj => {
            if (obj.userid === id) {
                result = obj;
            }
        });
        return result;
    }

    function getArrayById(arr, userid) {
        let result = [];
        arr.forEach(obj => {
            if (obj.userid === userid) {
                result.push(obj);
            }
        });
        return result;
    }

    function saveUserData() {
        let fieldsData = JSON.parse(JSON.stringify(selectedUser));
        if (fieldsData.password.length === 32) {
            console.log("not change");
        } else {
            fieldsData.password = MD5(fieldsData.password).toString();
        }
        if (fieldsData.id === "new" || fieldsData.id === " ") {
            delete fieldsData.userid;
            delete fieldsData.groupid;
            delete fieldsData.roleid;

            let url = API_URL + "?service.key=update.formData";
            let request = {};
            request.data = [];
            let entityForm = {};

            entityForm.formId = "dir_user";
            entityForm.entity = "dir_user";
            entityForm.action = "update";

            if (
                !fieldsData.id ||
                fieldsData.id == "" ||
                fieldsData.id == "new" ||
                fieldsData.id == " "
            ) {
                entityForm.id = "new";
                fieldsData.id = "new";
            }

            entityForm.formData = fieldsData;
            request.data.push(entityForm);
            try {
                axios.post(url, request).then(function (response) {
                    if (response.data.C_STATUS === "SUCCESS") {
                        if (fieldsData.id === "new" || fieldsData.id === " ") {
                            let tempUser = { ...selectedUser };

                            tempUser.id = response.data.C_DATA[0].formData.id;
                            saveAssociationTableData(tempUser);
                        }

                        setConfirmPassword("");
                        setSelectedUser(initialUserObject);
                        setFilteredGroups([]);
                        setSelectedGroups([]);
                    } else {
                        toastEmitter(
                            response?.data?.C_MESSAGE,
                            true,
                            "warning",
                        );
                    }
                    getUserData();
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else {
            handleUpdateUser();
        }
    }

    function handleUpdateUser() {
        deleteUserAssociationTables(selectedUser, "update");
    }

    function saveAssociationTableData(userObject, userForm) {
        let roleData = {
            id: "new",
            userid: userObject.id,
            roleid: userObject.roleid,
        };
        let employmentData = {
            id: "new",
            userid: userObject.id,
            role: userObject.roleid,
        };

        let url = API_URL + "?service.key=update.formData";

        let roleForm = {};
        let empForm = {};

        roleForm.formId = "dir_user_role";
        roleForm.entity = "dir_user_role";
        roleForm.action = "update";

        empForm.formId = "dir_employment";
        empForm.entity = "dir_employment";
        empForm.action = "update";

        if (
            !employmentData.id ||
            employmentData.id == "" ||
            employmentData.id == "new" ||
            !roleData.id ||
            roleData.id == "" ||
            roleData.id == "new"
        ) {
            roleForm.id = "new";
            empForm.id = "new";
        } else {
            roleForm.id = "new";
            empForm.id = "new";
        }
        roleForm.formData = roleData;
        empForm.formData = employmentData;

        let request = MultiGroupDynamicSaveRequest(
            userObject.id,
            userObject.groupid,
        );
        if (userForm) {
            request.data.push(userForm);
        }
        request.data.push(roleForm);
        request.data.push(empForm);
        try {
            axios.post(url, request).then(function (response) {
                if (response.data.C_STATUS === "SUCCESS") {
                    const status = {
                        "": "Created",
                        new: "Created",
                        " ": "Created",
                    };
                    const currentStatus =
                        status[selectedUser?.id] === undefined
                            ? "Updated"
                            : status[selectedUser?.id];
                    toastEmitter(`User ${currentStatus} Successfully!`, true);

                    // let updatedItem = { ...selectedUser };
                    // updatedItem.id = userObject?.id;
                    // updatedItem.groupid = selectedUser?.groupid.map(
                    //     item => item.id,
                    // );
                    // if (currentStatus === "Updated") {
                    //     updateItem(setUserList, updatedItem);
                    //     updateItem(setFilteredUsers, updatedItem);
                    // } else {
                    //     insertItem(setUserList, updatedItem);
                    //     insertItem(setFilteredUsers, updatedItem);
                    // }
                    // setSelectedUser(initialUserObject);
                    adNewUser();
                    handleClose();
                    getUserData();
                }
            });
        } catch (e) {
            console.log("saveGig error:" + e);
        }
    }

    function MultiGroupDynamicSaveRequest(userId, groupArr) {
        let groupForm = {};
        groupForm.data = [];
        groupArr.forEach(group => {
            let groupObj = {
                formId: "dir_user_group",
                action: "update",
                formData: {
                    groupid: group.id,
                    userid: userId,
                    id: "new",
                },
                id: "new",
                entity: "dir_user_group",
            };
            groupForm.data.push(groupObj);
        });
        return groupForm;
    }

    function generateUsername() {
        let first_name = selectedUser.firstname;
        let last_name = selectedUser.lastname;
        let username =
            first_name +
            last_name.substring(0, 3) +
            Math.floor(Math.random() * (99 - 0) + 0);
        username = username.replaceAll(" ", "").toLowerCase();

        setSelectedUser(prevState => ({
            ...prevState,
            username: username,
        }));
        let callback = user => {
            if (user && user.length > 0) {
                generateUsername();
            } else {
                console.log("UserName is Unique");
            }
        };
        getUserRegistered(username, callback);
    }

    function getUserRegistered(username, callback) {
        let url = API_URL + "?service.key=masterKey.tenantData";
        let dataRequest = {
            dataKeys: [
                {
                    serviceParams: username,
                    dataKey: "userRegisteredUsername",
                    serviceKey: "sys.dir.user.valid",
                    mode: "formData",
                },
            ],
        };
        axios.post(url, dataRequest).then(function (response) {
            if (response.data.C_STATUS === "SUCCESS") {
                try {
                    let user = response.data.C_DATA.userRegisteredUsername;
                    setUserRegisteredUsername(user);
                    if (callback) {
                        callback(user);
                    }
                } catch (e) {
                    console.log("***********:" + e);
                }
            } else {
                toastEmitter("Please Provide Required Fields.", true, "error");
            }
        });
    }

    async function deleteMultiAssociationGroup(userObject) {
        let fieldsData = userObject;

        let request = {};
        request.data = [];
        let roleForm = {};
        let employmentForm = {};
        let groupForm = {};        

        employmentForm.formId = "dir_employment";
        employmentForm.entity = "dir_employment";
        employmentForm.id = userObject.id;
        employmentForm.fk_id = userObject.id;
        employmentForm.fk_name = "userid";
        employmentForm.action = "fk_delete";
        request.data.push(employmentForm);


        roleForm.formId = "dir_user_role";
        roleForm.entity = "dir_user_role";
        roleForm.id = userObject.id;
        roleForm.fk_id = userObject.id;
        roleForm.fk_name = "userid";
        roleForm.action = "fk_delete";
        request.data.push(roleForm);
        
        groupForm.formId = "dir_user_group";
        groupForm.entity = "dir_user_group";
        groupForm.id = userObject.id;
        groupForm.fk_id = userObject.id;
        groupForm.fk_name = "userid";
        groupForm.action = "fk_delete";
        request.data.push(groupForm);        
        return request;
    }

    async function deleteUserAssociationTables(item, condition, modalResponse) {
        if (modalResponse === undefined) {
            setShowModal(prev => ({
                ...prev,
                show: true,
                item: item,
                condition: condition,
            }));
        }
        if (modalResponse === true) {
            let userForm = {};

            let request;
            let fieldsData = item;
            request = await deleteMultiAssociationGroup(item);

            if (condition === "delete") {
                userForm.formId = "dir_user";
                userForm.entity = "dir_user";
                userForm.action = "delete";
                userForm.id = item.id;
                request.data.push(userForm);
            }

            axios
                .post(API_URL + "?service.key=update.formData", request)
                .then(response => {
                    if (response.data.C_STATUS === "SUCCESS") {
                        let userObj = fieldsData;
                        if (condition === "update") {
                            updateUserRecord(userObj, condition);
                            setShowModal(prev => ({
                                ...prev,
                                show: false,
                                item: {},
                                condition: "",
                            }));
                        } else if (condition === "delete") {
                            adNewUser();
                            deleteItem(setUserList, item);
                            deleteItem(setFilteredUsers, item);
                            setShowModal(prev => ({
                                ...prev,
                                show: false,
                                item: {},
                                condition: "",
                            }));
                            toastEmitter("User Deleted Successfully", true);
                        }
                        handleClose();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    function updateUserRecord(userObj, condition) {
        let fieldsDataUser = structuredClone(selectedUser);
        let fieldsDataAssociation = structuredClone(selectedUser);
        if (fieldsDataUser.password.length === 32) {
            console.log("not change");
        } else {
            fieldsDataUser.password = MD5(fieldsDataUser.password).toString();
            // console.log(
            //     "********************* MD5:" +
            //         MD5(fieldsDataUser.password).toString(),
            // );
        }
        delete fieldsDataUser.userid;
        delete fieldsDataUser.roleid;
        delete fieldsDataUser.groupid;

        let userForm = {};
        userForm.formId = "dir_user";
        userForm.entity = "dir_user";
        userForm.action = "update";

        userForm.id = fieldsDataUser.id;
        userForm.formData = fieldsDataUser;

        // clearFields();
        if (condition === "update") {
            saveAssociationTableData(fieldsDataAssociation, userForm);
        }
    }

    function getActiveUsers(userList) {
        let activeCount = 0;
        userList.forEach(user => {
            if (user.active === "1") {
                activeCount++;
            }
        });
        return activeCount;
    }

    function getUserData(condition) {
        let dataRequest;
        if (condition === "delete") {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "dirUserGroup",
                        serviceKey: "sys.dir.user.group",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirUserRole",
                        serviceKey: "sys.dir.user.role",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirEmployment",
                        serviceKey: "sys.dir.employment.all",
                        mode: "formData",
                    },
                ],
            };
        } else {
            dataRequest = {
                dataKeys: [
                    {
                        serviceParams: "",
                        dataKey: "dirUser",
                        serviceKey: "sys.dir.user",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "activeUser",
                        serviceKey: "sys.active.users",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirRole",
                        serviceKey: "sys.dir.role",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirGroup",
                        serviceKey: "sys.dir.group.list",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirUserGroup",
                        serviceKey: "sys.dir.user.group",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirUserRole",
                        serviceKey: "sys.dir.user.role",
                        mode: "formData",
                    },
                    {
                        serviceParams: "",
                        dataKey: "dirEmployment",
                        serviceKey: "sys.dir.employment.all",
                        mode: "formData",
                    },
                ],
            };
        }

        return new Promise((resolve, reject) => {
            axios
                .post(
                    API_URL + "?service.key=masterKey.tenantData",
                    dataRequest,
                )
                .then(response => {
                    resolve(response);
                    if (response.data.C_STATUS === "SUCCESS") {
                        let userList = response.data.C_DATA.dirUser;
                        let activeUsers =
                            response.data.C_DATA.activeUser[0].active_users;
                        // let activeUsersCount = getActiveUsers(userList);
                        setActiveUsers(activeUsers);
                        const userMapping = {};

                        userList.forEach(user => {
                            if (userMapping[user.id]) {
                                userMapping[user.id].groupid.push(user.groupid);
                            } else {
                                const group = [user.groupid];
                                user.groupid = group;
                                userMapping[user.id] = user;
                            }
                        });
                        let userArr = Object.values(userMapping);

                        let filteredArray = FilteredGroup(userArr);

                        setUserList(filteredArray);

                        if (inputReference.current.value) {
                            let result = [];
                            result = filterArrayByTerms(
                                filteredArray,
                                inputReference.current.value,
                                fields,
                            );
                            setFilteredUsers(result);
                        } else {
                            setFilteredUsers(filteredArray);
                        }

                        // setFilteredUsers(filteredArray);
                        setRole(response.data.C_DATA.dirRole);
                        setUserRole(response.data.C_DATA.dirUserRole);
                        setUserGroups(response.data.C_DATA.dirUserGroup);
                        setEmployments(response.data.C_DATA.dirEmployment);
                        if (response.data.C_DATA.dirGroup) {
                            let mainArr = response.data.C_DATA.dirGroup;
                            let finalArr = [];
                            mainArr.forEach(item => {
                                item.label = item.name;
                                item.value = item.id;
                                finalArr.push(item);
                            });
                            setGroup(finalArr);
                        } else {
                            console.log(
                                `Either dir.user or other dir.not  found does not exists or SQL query returns no result.`,
                            );
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
    }

    function FilteredGroup(userArr) {
        let uniqueGroups = [];
        let allUser = [];
        userArr.forEach(userItem => {
            uniqueGroups = [...new Set(userItem.groupid)];
            userItem.groupid = uniqueGroups;
            allUser.push(userItem);
        });
        return allUser;
    }
    return (
        <div className="user-management-users s2a-users">
            <ModalBox
                header={`${showModal.condition.charAt(0).toUpperCase()}${showModal.condition.slice(1)} User`}
                state={showModal}
                message={`Are you sure to ${showModal.condition} ${showModal.item.username}?`}
                operation={deleteUserAssociationTables}
                setState={setShowModal}
                modalType="user"
            />
            <div className="pt-2">
                {/* <button className="info" onClick={decrypt()}>
            dec
          </button> */}
                <span id="decrypted-text"></span>
                <div className="col-sm-3 mb-2 p-0">
                    <div className="search-input input-group mb-1">
                        <i className="input-search-icon fa-solid fa-magnifying-glass text-muted"></i>
                        <input
                            ref={inputReference}
                            type="text"
                            className="form-control"
                            onChange={handleSearch}
                            placeholder="Search..."
                        />
                        {/* <span className="input-group-text fs-6">Ctrl + /</span> */}
                    </div>
                </div>
                <div className="col-sm-12 p-0 table-height">
                    <UserTable
                        filteredUsers={filteredUsers}
                        setFilteredUsers={setFilteredUsers}
                        selectedUser={selectedUser}
                        getSelectedUser={getSelectedUser}
                        deleteUserAssociationTables={
                            deleteUserAssociationTables
                        }
                        group={group}
                        getPaginateData={getPaginateData}
                        current={current}
                        size={size}
                        activeTab={activeTab}
                    />
                </div>
                <div className="row">
                    <div className="col-sm-8 d-flex pt-2">
                        <div className="col-sm-2">
                            <button
                                type="button"
                                className="button-theme btn btn-sm pull-left my-2"
                                onClick={adNewUser}
                                disabled={!allowUser}>
                                <i className="fa-solid fa-plus pe-1"></i>
                                Add New
                            </button>
                        </div>
                        <div className="col-sm-10">
                            <p className="pt-1">
                                {userLimit - activeUsers == 0
                                    ? "Please update subscription to add more active users. "
                                    : ""}
                                Total Users: {userList.length} / Subscription
                                Users: {userLimit} / Active Users: {activeUsers}{" "}
                                - Remaining active users{" "}
                                {userLimit - activeUsers}.
                            </p>
                        </div>
                    </div>
                    <div className="col-sm-4 p-0">
                        <TablePagination
                            size={size}
                            setSize={setSize}
                            current={current}
                            setCurrent={setCurrent}
                            tableData={filteredUsers}
                        />
                    </div>
                </div>
                <ModuleFormViewer
                    handleClose={handleClose}
                    showModal={formModal}
                    modalTitle="User"
                    size="lg">
                    <div className="user-form">
                        <div
                            className="form col-sm-12 form-background needs-validation mb-2"
                            noValidate>
                            <UserForm
                                error={error}
                                selectedUser={selectedUser}
                                handleInputField={handleInputField}
                                confirmPassword={confirmPassword}
                                MultiSelect={MultiSelect}
                                generateUsername={generateUsername}
                                group={group}
                                filteredGroups={filteredGroups}
                                handleMultiSelectGroups={
                                    handleMultiSelectGroups
                                }
                                role={role}
                                setConfirmPassword={setConfirmPassword}
                                setSelectedUser={setSelectedUser}
                                show={show}
                                setShow={setShow}
                                allowUser={allowUser}
                            />
                        </div>
                        <div className="user-action-btns">
                            {selectedUser.id === " " && (
                                <button
                                    className="btn button-theme btn-sm me-2"
                                    onClick={() => validateAndSave()}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Save
                                </button>
                            )}
                            {selectedUser.id !== " " && (
                                <button
                                    className="btn button-theme btn-sm me-2"
                                    onClick={() => validateAndUpdate()}>
                                    <i className="fa-solid fa-floppy-disk pe-1"></i>
                                    Update
                                </button>
                            )}
                            {selectedUser.id === " " && (
                                <button
                                    className="btn button-theme btn-sm me-2"
                                    onClick={clearFields}>
                                    <i className="fa-solid fa-ban pe-1"></i>
                                    Clear
                                </button>
                            )}
                            <button
                                className="btn button-theme btn-sm"
                                onClick={() => handleClose()}>
                                <i className="fa-solid fa-xmark pe-1"></i>
                                Close
                            </button>
                        </div>
                    </div>
                </ModuleFormViewer>
            </div>
        </div>
    );
}

export default User;
