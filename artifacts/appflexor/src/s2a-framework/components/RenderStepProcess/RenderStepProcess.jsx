import { useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "../../utils/ErrorBoundry";
import React, { useContext, useEffect, useState } from "react";
import StepProcessor from "../../modules/camunda/cam8/StepProcessor8";
import { AppContext } from "../../../AppContext";
import axios from "axios";
import { API_URL } from "../../Config";

export default function RenderStepProcess() {
    const actions = {
        update: "UPDATE",
        complete: "COMPLETE",
        failed: "FAILED",
        draft: "DRAFT",
    };
    let [searchParams] = useSearchParams();
    const appContext = useContext(AppContext);
    const [selectedTask, setSelectedTask] = useState({});
    const [userList, setUserList] = useState([]);
    const [currentProcessState, setCurrentProcessState] = useState({
        initial: true,
        start: false,
        step: false,
    });
    const [userDetails, setUserDetails] = useState({
        firstname: "",
        lastname: "",
        username: "",
    });
    const taskInitState = {
        id: "",
    };

    const [taskLoaded, setTaskLoaded] = useState(false);
    const [taskExist, setTaskExist] = useState(true);
    const [taskCompleted, setTaskCompleted] = useState(false);
    const [taskUpdated, setTaskUpdated] = useState(false);
    const tenantId = appContext?.tenantSubscription?.tenant_id;

    let taskId = searchParams.get("taskId");
    let url = window.location.href;
    let data;
    let camundaVars = {};

    useEffect(() => {
        if (taskId && taskId !== "") {
            getTask(taskId);
        }
    }, [taskId]);

    function handleStepProcessActions(actionType) {
        if (actionType === actions.complete) {
            setCurrentProcessState({
                initial: true,
                start: false,
                step: false,
            });
            setSelectedTask(taskInitState);
            setTaskCompleted(true);
        } else if (actionType === actions.update) {
            getTask(taskId);
        }
    }

    function getTask(taskId) {
        let serviceParams = taskId;
        let serviceKeyOrder = "bpm.get.task";
        let dataRequest = {
            dataKeys: [
                {
                    serviceParams: serviceParams,
                    dataKey: "task",
                    serviceKey: serviceKeyOrder,
                    mode: "formData",
                },
                {
                    serviceParams: "",
                    dataKey: "user",
                    serviceKey: "sys.user.profile",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    let taskList = response.data.C_DATA.task;
                    if (taskList.length > 0) {
                        let tempTask = taskList[0];
                        try {
                            tempTask.variables = JSON.parse(tempTask.variables);
                        } catch (e) {}
                        setSelectedTask(tempTask);
                        setTaskLoaded(true);
                    } else {
                        setTaskExist(false);
                    }

                    if (userList && typeof userList === "object") {
                        setUserList(userList);
                    }

                    let user = response.data.C_DATA.user;

                    if (user && typeof user === "object") {
                        if (user[0]) {
                            setUserDetails(user[0]);
                        }
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    function renderStepProcessor() {
        return (
            <StepProcessor
                task={selectedTask}
                userList={userList}
                userDetails={userDetails}
                handleProcessActions={handleStepProcessActions}
                hideHeader={true}
            />
        );
    }

    return (
        <ErrorBoundary>
            <>
                {!taskLoaded && taskExist ? (
                    <span>Loading..</span>
                ) : (
                    <>
                        {taskExist && selectedTask?.id !== "" && (
                            <div className="col-sm-6 process-step">
                                {renderStepProcessor()}
                            </div>
                        )}
                        {!taskExist &&
                            <div className="col-sm-6 process-step">
                                Assignment does not exist or already been processed.
                            </div>
                        }
                        {taskExist && taskCompleted &&
                            <div className="col-sm-6 process-step">
                                Assignment completed.
                            </div>
                        }
                        {taskExist && taskUpdated &&
                            <div className="col-sm-6 process-step">
                                Assignment updated.
                            </div>
                        }
                    </>
                )}
            </>
        </ErrorBoundary>
    );
}
