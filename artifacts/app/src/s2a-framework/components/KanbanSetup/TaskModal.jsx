import React from "react";
import { MultiSelect } from "react-multi-select-component";

export default function TaskModal({
    task,
    handleTaskInput,
    handleSaveTasks,
    // handleMultiUsers,
    selectedUsers,
    filteredUserList,
    taskPriorty,
}) {
    return (
        <div
            className="modal fade"
            id="taskModal"
            tabIndex="-1"
            aria-labelledby="taskModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="taskModalLabel">
                            Add Task
                        </h1>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body">
                        <form>
                            <div className="form-group">
                                {/* <label className="mt-1 fw-bold">
                  Users&nbsp;
                  <span className="text-danger">*</span>
                </label>
                <MultiSelect
                  options={filteredUserList}
                  value={selectedUsers}
                  onChange={handleMultiUsers}
                  labelledBy="Select"
                /> */}
                            </div>
                            <div className="mb-3 row">
                                <div className="col-sm-6">
                                    <label className="col-form-label">
                                        Name{" "}
                                        <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        className="form-control"
                                        placeholder="Task Name"
                                        name="name"
                                        value={task.name}
                                        onChange={(e) => handleTaskInput(e)}
                                    />
                                </div>
                                <div className="col-sm-6">
                                    <label className="col-form-label">
                                        Task priority
                                    </label>
                                    <select
                                        className="form-select"
                                        aria-label="Default select example"
                                        name="priorty"
                                        value={task.priorty}
                                        onChange={(e) => handleTaskInput(e)}
                                    >
                                        <option value="">
                                            Select Task priority
                                        </option>
                                        {taskPriorty.map((_taskPriorty, i) => {
                                            return (
                                                <option
                                                    key={i}
                                                    value={_taskPriorty.name}
                                                >
                                                    {_taskPriorty.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="col-form-label">
                                    Description
                                    <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control col-sm-1"
                                    placeholder="Task Description"
                                    name="description"
                                    value={task.description}
                                    onChange={(e) => handleTaskInput(e)}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSaveTasks(task)}
                            className="btn button-theme "
                            data-bs-dismiss="modal"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
