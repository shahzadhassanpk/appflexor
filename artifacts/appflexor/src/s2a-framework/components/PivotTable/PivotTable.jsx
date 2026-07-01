import React from "react";
import PivotTableUI from "react-pivottable/PivotTableUI";
import "react-pivottable/pivottable.css";
import { API_URL } from "../../Config";
import axios from "axios";
import { AppContext } from "../../../AppContext";
import { useState, useContext } from "react";

function PivotTable(props) {
    const [data, setData] = useState(props.data?props.data:[]);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    function getData() {
        var dataRequest = {
            tenant_id: tenantId,
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "hotelData",
                    serviceKey: "hotel.data",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=tenant.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        let _boards = response.data.C_DATA.kanban_board;
                        let _tasks = response.data.C_DATA.kanban_task;
                        let _users = response.data.C_DATA.dirUser;

                        setBoards(_boards);
                        setTasks(_tasks);
                        setFilteredTasks(_tasks);
                        setUsers(_users);
                        let _userList = [];
                        _users.forEach(items => {
                            items.label = items.firstname;
                            items.value = items.id;
                            _userList.push(items);
                        });
                        setFilteredUserList(_userList);
                        // getSelectedBoard(task.board_id)
                    } else {
                        console.log(
                            `Either kanban_board does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }
    return (
        <PivotTableUI
            data={data}
            onChange={s => this.setState(s)}
            {...this.state}
        />
    );
}
export default PivotTable;