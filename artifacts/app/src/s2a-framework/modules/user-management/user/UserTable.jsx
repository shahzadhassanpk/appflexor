import React, { useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import TableSorting from "../../../components/TableSorting/TableSorting";

function UserTable({
    filteredUsers,
    setFilteredUsers,
    selectedUser,
    getSelectedUser,
    deleteUserAssociationTables,
    group,
    getPaginateData,
    current,
    size,
    activeTab,
}) {
    return (
        <Table className="s2a-table table-bordered table-hover mb-0 s2a-user-table">
            <Thead className="thead">
                <Tr className="tableHeader">
                    <Th className="col-sm-2 table-row text-left">
                        <TableSorting
                            state={filteredUsers}
                            setState={setFilteredUsers}
                            fieldName={"firstname"}
                            headerTitle={"First Name"}
                            activeTab={activeTab.group}
                        />
                    </Th>
                    <Th className="col-sm-2 table-row text-left">
                        <TableSorting
                            state={filteredUsers}
                            setState={setFilteredUsers}
                            fieldName={"lastname"}
                            headerTitle={"Last Name"}
                            activeTab={activeTab.group}
                        />
                    </Th>
                    <Th className="col-sm-2 table-row text-left">
                        <TableSorting
                            state={filteredUsers}
                            setState={setFilteredUsers}
                            fieldName={"username"}
                            headerTitle={"User Name"}
                            activeTab={activeTab.group}
                        />
                    </Th>
                    <Th className="col-sm-3 table-row text-left">
                        <TableSorting
                            state={filteredUsers}
                            setState={setFilteredUsers}
                            fieldName={"email"}
                            headerTitle={"Email"}
                            activeTab={activeTab.group}
                        />
                    </Th>
                    <Th className="col-sm-2 table-row text-left">Groups</Th>
                    <Th className="col-sm-1 table-row text-left">
                        <TableSorting
                            state={filteredUsers}
                            setState={setFilteredUsers}
                            fieldName={"active"}
                            headerTitle={"Status"}
                            activeTab={activeTab.group}
                        />
                    </Th>
                    <Th className="col-sm-2 table-row text-left"></Th>
                </Tr>
            </Thead>
            <Tbody>
                {getPaginateData(current, size).map((user, i) => {
                    return (
                        <Tr
                            key={user.id}
                            className={` ${
                                user.id === selectedUser.id
                                    ? "selected-cell"
                                    : " "
                            }`}>
                            <Td className="col-sm-2 table-row text-left">
                                <div className="data-cell">
                                    {user.firstname}
                                </div>
                            </Td>
                            <Td className="col-sm-2 table-row text-left">
                                <div className="data-cell">{user.lastname}</div>
                            </Td>
                            <Td className="col-sm-2 table-row text-left">
                                <div className="data-cell">{user.username}</div>
                            </Td>
                            <Td className="col-sm-3 table-row text-left">
                                <div className="data-cell">{user.email}</div>
                            </Td>
                            <Td className="col-sm-2 table-row text-left">
                                <div className="data-cell d-grid">
                                    <Badges
                                        ids={user.groupid}
                                        arr={group}
                                    />
                                </div>
                            </Td>
                            <Td className="col-sm-1 table-row text-left">
                                {user.active == "1" ? "Active" : "Inactive"}
                            </Td>
                            <Td className="col-sm-2 table-row text-left">
                                <div className="data-cell d-flex">
                                    <span
                                        className={`table-edit-font ${
                                            user.username === "padmin"
                                                ? "visually-hidden"
                                                : ""
                                        }`}
                                        title="Edit"
                                        onClick={() => getSelectedUser(user)}>
                                        <i className="fa-regular fa-edit"></i>
                                    </span>
                                    <span
                                        className={`table-del-font ${
                                            user.username === "admin" ||
                                            user.username === "padmin"
                                                ? "visually-hidden"
                                                : ""
                                        }`}
                                        title="Delete"
                                        onClick={() =>
                                            deleteUserAssociationTables(
                                                user,
                                                "delete",
                                            )
                                        }
                                        disabled>
                                        <i className="fa-regular fa-trash-can"></i>
                                    </span>
                                </div>
                            </Td>
                        </Tr>
                    );
                })}
            </Tbody>
        </Table>
    );
    function Badges({ ids, arr }) {
        let result = [];
        let idsArr = ids[0].split(',');
        idsArr.forEach(id => {
            arr.forEach(item => {
                if (item.id === id) {
                    result.push(item);
                }
            });
        });
        return (
            <React.Fragment>
                {result.map((item, i) => {
                    return (
                        <Badge
                            key={i}
                            name={item.label}
                        />
                    );
                })}
            </React.Fragment>
        );
    }

    function Badge({ name }) {
        return (
            <span className="badge rounded-pill text-bg-light bg-info me-2">
                {name}
            </span>
        );
    }
}
export { UserTable };
