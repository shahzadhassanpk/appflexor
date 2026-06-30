import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AppContext } from "../../../AppContext";
import { API_URL } from "../../../Config";
import { COLUMN_NAMES } from "./constants";
import "./member.css";

const MovableItem = ({
    name,
    description,
    index,
    currentColumnName,
    moveCardHandler,
    setItems,
    items,
    priorty,
    item,
    taskItem,
    handleStatus,
    mode,
}) => {
    const changeItemColumn = (currentItem, columnName) => {
        setItems(prevState => {
            return prevState.map(e => {
                return {
                    ...e,
                    column: e.id === currentItem.id ? columnName : e.column,
                };
            });
        });
    };

    const ref = useRef(null);
    const [, drop] = useDrop({
        accept: "Our first type",
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            moveCardHandler(dragIndex, hoverIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    function taskWithId(selectedTask, totalTasks, columnName) {
        let result = [];
        totalTasks.length > 0 &&
            totalTasks !== undefined &&
            totalTasks.forEach(updatedItems => {
                if (
                    selectedTask.name === updatedItems.name &&
                    description === updatedItems.description &&
                    updatedItems.id === item.id
                ) {
                    updatedItems.column = columnName;
                    result.push(updatedItems);
                }
            });
        return result;
    }

    const [{ isDragging }, drag] = useDrag({
        type: "Our first type",
        item: { index, name, currentColumnName },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();

            if (dropResult) {
                const { name } = dropResult;
                let dragTasks = taskWithId(item, items, name);
                handleStatus(items, dragTasks);
                const { Assigned, IN_PROGRESS, AWAITING_REVIEW, DONE } =
                    COLUMN_NAMES;
                switch (name) {
                    case IN_PROGRESS:
                        changeItemColumn(taskItem, IN_PROGRESS);
                        break;
                    case AWAITING_REVIEW:
                        changeItemColumn(taskItem, AWAITING_REVIEW);
                        break;
                    case DONE:
                        changeItemColumn(taskItem, DONE);
                        break;
                    case Assigned:
                        changeItemColumn(taskItem, Assigned);
                        break;
                    default:
                        break;
                }
            }
        },
        collect: monitor => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.4 : 1;

    drag(drop(ref));
    return (
        <>
            {mode === undefined || mode === "DESIGN_MODE" ? (
                <div>
                    <span className="heading"> {name}</span>
                    <br />
                    <span className="description d-flex justify-content-center">
                        {" "}
                        {description}
                    </span>
                    <br />
                    <span className="description">
                        Priorty:&nbsp;&nbsp;{priorty}
                    </span>
                </div>
            ) : (
                <div
                    ref={ref}
                    className="movable-item"
                    style={{ opacity }}>
                    <span className="heading"> {name}</span>
                    <br />
                    <span className="description d-flex justify-content-center">
                        {" "}
                        {description}
                    </span>
                    <br />
                    <span className="description">
                        Priorty:&nbsp;&nbsp;{priorty}
                    </span>
                </div>
            )}
        </>
    );
};

const Column = ({ children, className, title, mode }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: "Our first type",
        drop: () => ({ name: title }),
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
        // Override monitor.canDrop() function
        canDrop: item => {
            // const { Assigned, IN_PROGRESS, AWAITING_REVIEW, DONE } = COLUMN_NAMES
            // const { currentColumnName } = item
            return true;
        },
    });
    // useEffect(() => {
    //   if (children.length > 0 && children && children !== undefined) {
    //     let stringfyChildren = JSON.stringify(children)
    //     localStorage.setItem("children", stringfyChildren)
    //     let getChildren = localStorage.getItem("children")
    //     let parseChildren = JSON.parse(getChildren)
    //     children = parseChildren
    //   }
    // }, [children])
    const getBackgroundColor = () => {
        if (isOver) {
            if (canDrop) {
                return "rgb(188,251,255)";
            } else if (!canDrop) {
                return "rgb(255,188,188)";
            }
        } else {
            return "";
        }
    };

    return (
        <>
            {mode === undefined || mode === "DESIGN_MODE" ? (
                <div className={className}>
                    <p className="title-style">{title}</p>
                </div>
            ) : (
                <div
                    ref={drop}
                    className={className}
                    style={{ backgroundColor: getBackgroundColor() }}>
                    <p className="title-style">{title}</p>
                    {children}
                </div>
            )}
        </>
    );
};

export const MemberKanban = props => {
    console.log(props);
    let mode = props.mode;
    const appContext = useContext(AppContext);
    const [newTasks, setNewTasks] = useState([]);
    const [items, setItems] = useState(newTasks);

    const moveCardHandler = (dragIndex, hoverIndex) => {
        const dragItem = items[dragIndex];
        if (dragItem) {
            setItems(prevState => {
                const coppiedStateArray = [...prevState];

                // remove item by "hoverIndex" and put "dragItem" instead
                const prevItem = coppiedStateArray.splice(
                    hoverIndex,
                    1,
                    dragItem,
                );

                // remove item by "dragIndex" and put "prevItem" instead
                coppiedStateArray.splice(dragIndex, 1, prevItem[0]);
                return coppiedStateArray;
            });
        }
    };

    const returnItemsForColumn = columnName => {
        return (
            items &&
            items.length > 0 &&
            items !== undefined &&
            items
                .filter(item => item.column === columnName)
                .map((item, index) => (
                    <MovableItem
                        key={item.id}
                        item={item}
                        taskItem={item}
                        name={item.name}
                        description={item.description}
                        priorty={item.priorty}
                        currentColumnName={item.column}
                        setItems={setItems}
                        index={index}
                        moveCardHandler={moveCardHandler}
                        items={items}
                        handleStatus={handleStatus}
                        mode={mode}
                    />
                ))
        );
    };

    const { Assigned, IN_PROGRESS, AWAITING_REVIEW, DONE } = COLUMN_NAMES;

    useEffect(() => {
        getData();
    }, []);

    function onlineUserTasks(_userTasks) {
        let result = [];

        _userTasks.forEach(selectedTask => {
            let initialTask = {
                id: "",
                name: "",
                description: "",
                priorty: "",
                status: "",
                column: selectedTask.status,
            };
            initialTask.id = selectedTask.id;
            initialTask.name = selectedTask.name;
            initialTask.description = selectedTask.description;
            initialTask.priorty = selectedTask.priorty;
            initialTask.status = selectedTask.status;

            result.push(initialTask);
        });

        return result;
    }

    function getData() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: "",
                    dataKey: "kanban_task",
                    serviceKey: "kanban.task",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=multiKey.data", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA) {
                        let _tasks = response.data.C_DATA.kanban_task;

                        setNewTasks(_tasks);
                        let _userTasks = [];
                        _tasks.forEach((_tasks, index) => {
                            let userIdsArray = _tasks.user_id;
                            let array = userIdsArray.split(";");
                            array.forEach(setOfUserIds => {
                                if (
                                    setOfUserIds === appContext.profile.userid
                                ) {
                                    _userTasks.push(_tasks);
                                } else {
                                    if (
                                        _tasks.user_id ===
                                        appContext.profile.userid
                                    ) {
                                        _userTasks.push(_tasks);
                                    }
                                }
                            });
                        });
                        let result = onlineUserTasks(_userTasks);
                        setNewTasks(result);
                        setItems(result);
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

    function handleStatus(_status, _tasks) {
        _status &&
            _status.length > 0 &&
            _status !== undefined &&
            _status.forEach(statusItem => {
                _tasks &&
                    _tasks.length > 0 &&
                    _tasks !== undefined &&
                    _tasks.forEach(taskItem => {
                        if (
                            statusItem.id === taskItem.id &&
                            statusItem.column !== taskItem.status
                        ) {
                            taskItem.status = statusItem.column;
                            if (statusItem.column === "Done") {
                                taskItem.status = "Done";
                            }
                            handleSaveTaskStatus(taskItem);
                        }
                    });
            });
    }

    function handleSaveTaskStatus(task) {
        if (task.name || task.description || task.column || task.user_id) {
            if (task.column !== "Done") {
                task.column = appContext.profile.userid;
            } else {
                task.column = "Done";
            }
            var url = API_URL + "?service.key=update.formData";
            var request = {};
            request.data = [];
            var entityForm = {};

            entityForm.formId = "kanban_task"; //"formid"
            entityForm.entity = "kanban_task"; //Db- "table name"
            entityForm.action = "update";

            if (!task.id || task.id == "" || task.id == "new") {
                entityForm.id = "new";
                task.id = "new";
            } else {
                entityForm.id = task.id;
            }

            entityForm.formData = task;
            request.data.push(entityForm);

            try {
                axios.post(url, request).then(function (response) {
                    if (response.status === 200) {
                        console.log("success");
                    }
                });
            } catch (e) {
                console.log("saveGig error:" + e);
            }
        } else {
            window.confirm("Please enter the task name and description");
        }
    }

    return (
        <div
            className="container d-flex"
            id="member-kanban">
            {mode === undefined ||
                (mode === "DESIGN_MODE" && (
                    <>
                        <div className="column">Assigned</div>
                        <div className="column">In Progress</div>
                        <div className="column">Awaiting review</div>
                        <div className="column">Done</div>
                    </>
                ))}
            {mode === "PREVIEW_MODE" && (
                <>
                    <div className="column">Assigned</div>
                    <div className="column">In Progress</div>
                    <div className="column">Awaiting review</div>
                    <div className="column">Done</div>
                </>
            )}
            {mode === "RENDER_MODE" && (
                <DndProvider backend={HTML5Backend}>
                    <Column
                        title={Assigned}
                        className="column do-it-column"
                        mode={mode}>
                        {returnItemsForColumn(Assigned)}
                    </Column>
                    <Column
                        title={IN_PROGRESS}
                        className="column in-progress-column"
                        mode={mode}>
                        {returnItemsForColumn(IN_PROGRESS)}
                    </Column>
                    <Column
                        title={AWAITING_REVIEW}
                        className="column awaiting-review-column"
                        mode={mode}>
                        {returnItemsForColumn(AWAITING_REVIEW)}
                    </Column>
                    <Column
                        title={DONE}
                        className="column done-column"
                        mode={mode}>
                        {returnItemsForColumn(DONE)}
                    </Column>
                </DndProvider>
            )}
        </div>
    );
};
