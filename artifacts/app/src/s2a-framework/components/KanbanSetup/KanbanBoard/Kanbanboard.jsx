import axios from "axios"
import React, { useEffect, useRef, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { API_URL } from "../../../Config"
import TaskModal from "../TaskModal"
import filterIt from "../Filterit"

import "./asserts/styles/kanban.css"

const MovableItem = ({
  name,
  index,
  currentColumnName,
  moveCardHandler,
  setItems,
  description,
  COLUMN_NAMES,
  deleteTasks,
  setTask,
  items,
  handleSaveTasks,
  users,
  setSelectedUsers,
  taskStatus,
  priorty,
  currentTask,
  mode,
}) => {
  const changeItemColumn = (currentItem, columnName) => {
    let updatedArr = []
    items.forEach((item) => {
      if (item.id === currentItem.id) {
        item.status = "Assigned"
        item.column = columnName

        item.user_id = columnName
        handleSaveTasks(item)
        updatedArr.push(item)
      } else {
        updatedArr.push(item)
      }
    })
    setItems(updatedArr)
  }

  const ref = useRef(null)

  const [, drop] = useDrop({
    accept: "Our first type",
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }
      // Time to actually perform the action
      moveCardHandler(dragIndex, hoverIndex)
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })
  const [{ isDragging }, drag] = useDrag({
    type: "Our first type",
    item: { index, name, currentColumnName },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (dropResult) {
        const { name } = dropResult
        // const { DO_IT, IN_PROGRESS, AWAITING_REVIEW, DONE } = COLUMN_NAMES
        Object.values(COLUMN_NAMES).map((key) => {
          return name === key ? changeItemColumn(currentTask, key) : null
        })
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.4 : 1
  drag(drop(ref))
  function handleDelete(_deleteTask) {
    deleteTasks(_deleteTask)
  }

  function handleUpdate(item) {
    setTask(item)
    let _ids = item.user_id
    let _idsArr = _ids.split(";")
    let _finalArr = []
    _idsArr.forEach((id) => {
      users.forEach((_user) => {
        if (id === _user.id) {
          _finalArr.push(_user)
        }
      })
    })
    setSelectedUsers(_finalArr)
  }

  return (
    <>
      {mode === "RENDER_MODE" ? (
        <div ref={ref} className="movable-item" style={{ opacity }}>
          <div key={currentTask.id}>
            <span className="row">
              <span className="task-name col-sm-8">{name}</span>
              <span className="mx-1 col-sm-1">
                <i
                  className="fa-solid fa-pen-to-square text-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#taskModal"
                  data-bs-whatever="@task"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleUpdate(currentTask)}
                ></i>
              </span>
              <span
                className="col-sm-1 del-btn-theme text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(currentTask)}
              >
                <i className="fa-solid fa-trash-can del-btn-theme"></i>
              </span>
            </span>
            <br />
            <span className="task-description d-flex justify-content-center">
              {description}
            </span>
            <span className="task-priorty">Priorty: &nbsp;{priorty}</span>
            <br />
            <span className="task-status">{taskStatus}</span>
          </div>
        </div>
      ) : (
        <div className="movable-item" style={{ opacity }}>
          <div key={currentTask.id}>
            <span className="row">
              <span className="task-name col-sm-8">{name}</span>
              <span className="mx-1 col-sm-1">
                <i
                  className="fa-solid fa-pen-to-square text-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#taskModal"
                  data-bs-whatever="@task"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleUpdate(currentTask)}
                ></i>
              </span>
              <span
                className="col-sm-1 del-btn-theme text-danger"
                style={{ cursor: "pointer" }}
                onClick={() => handleDelete(currentTask)}
              >
                <i className="fa-solid fa-trash-can del-btn-theme"></i>
              </span>
            </span>
            <br />
            <span className="task-description d-flex justify-content-center">
              {description}
            </span>
            <span className="task-priorty">Priorty: &nbsp;{priorty}</span>
            <br />
            <span className="task-status">{taskStatus}</span>
          </div>
        </div>
      )}
    </>
  )
}

const Column = ({
  children,
  className,
  title,
  COLUMN_NAMES,
  setTask,
  SET_COLUMNS,
  task,
  handleTaskInput,
  users,
  tasks,
  deleteColumnWithTasks,
  handleDeleteColumn,
  mode,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "Our first type",
    drop: () => ({ name: title }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    // Override monitor.canDrop() function
    canDrop: (item) => {
      // const { currentColumnName } = item
      // const { item } = COLUMN_NAMES

      return true
    },
  })

  const getBackgroundColor = () => {
    if (isOver) {
      if (canDrop) {
        return "rgb(188,251,255)"
      } else if (!canDrop) {
        return "rgb(255,188,188)"
      }
    } else {
      return ""
    }
  }

  function clearFieldsTask() {
    setTask((prev) => ({
      ...prev,
      id: "",
      name: "",
      description: "",
      column: title,
      priorty: "",
    }))
  }

  function deleteColumn(_title) {
    let arrayOfTask = []
    if (tasks && tasks.length > 0) {
      tasks &&
        tasks.length > 0 &&
        tasks.forEach((userTask) => {
          if (userTask.column === _title) {
            arrayOfTask.push(userTask)
          }
        })
    } else {
      handleDeleteColumn(_title)
    }
    return arrayOfTask ? arrayOfTask : []
  }

  function multiDeleteTaskAndColumn(_title) {
    let result = deleteColumn(_title)
    deleteColumnWithTasks(result, _title)
  }

  function getObjectById(arr, id) {
    let result = null
    arr.forEach((obj) => {
      if (obj.id === id) {
        result = obj
      }
    })
    return result ? result : { firstname: "", username: "" }
  }

  let newArray = [
    { id: "BackLogs", name: "BackLogs" },
    { id: "Done", name: "Done" },
  ]

  return (
    <>
      {mode === "RENDER_MODE" ? (
        <div
          className={`${
            className == "kanban-column backlogs-column"
              ? `kanban-column backlogs-column order-first`
              : `${
                  className == "kanban-column done-column"
                    ? `kanban-column done-column order-last`
                    : `kanban-column`
                }`
          }`}
        >
          <div ref={drop} style={{ backgroundColor: getBackgroundColor() }}>
            <div className="row">
              <p className="col-sm-10 column-style ">
                {getObjectById(users, title).username}{" "}
                {getObjectById(newArray, title).name}{" "}
              </p>
              <div className="col-sm-1">
                <span
                  className="fa-solid fa-trash-can text-danger"
                  onClick={() => multiDeleteTaskAndColumn(title)}
                ></span>
              </div>
            </div>
            <a
              className="add-task"
              data-bs-toggle="modal"
              data-bs-target="#taskModal"
              data-bs-whatever="@task"
              onClick={() => clearFieldsTask()}
              style={{
                cursor: "pointer",
                color: "black",
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-plus"></i>
            </a>
            {children}
          </div>
        </div>
      ) : (
        <div
          className={`${
            className == "kanban-column backlogs-column"
              ? `kanban-column backlogs-column order-first`
              : `${
                  className == "kanban-column done-column"
                    ? `kanban-column done-column order-last`
                    : `kanban-column`
                }`
          }`}
        >
          <div className={className}>
            <div className="row">
              <p className="col-sm-10 column-style ">
                {getObjectById(users, title).username}{" "}
                {getObjectById(newArray, title).name}{" "}
              </p>
              <div className="col-sm-1">
                <span
                  className="fa-solid fa-trash-can text-danger"
                  onClick={() => multiDeleteTaskAndColumn(title)}
                ></span>
              </div>
            </div>
            <a
              className="add-task"
              data-bs-toggle="modal"
              data-bs-target="#taskModal"
              data-bs-whatever="@task"
              onClick={() => clearFieldsTask()}
              style={{
                cursor: "pointer",
                color: "black",
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-plus"></i>
            </a>
          </div>
        </div>
      )}
    </>
  )
}

export const Kanbanboard = ({
  tasks,
  COLUMN_NAMES,
  task,
  handleTaskInput,
  handleSaveTasks,
  SET_COLUMNS,
  setTask,
  deleteTasks,
  users,
  filteredUserList,
  selectedUsers,
  setSelectedUsers,
  getData,
  columnList,
  mode,
}) => {
  const [items, setItems] = useState(tasks)
  let taskPriorty = [{ name: "low" }, { name: "Medium" }, { name: "High" }]

  const moveCardHandler = (dragIndex, hoverIndex) => {
    const dragItem = items[dragIndex]
    if (dragItem) {
      setItems((prevState) => {
        const coppiedStateArray = [...prevState]

        // remove item by "hoverIndex" and put "dragItem" instead
        const prevItem = coppiedStateArray.splice(hoverIndex, 1, dragItem)

        // remove item by "dragIndex" and put "prevItem" instead
        coppiedStateArray.splice(dragIndex, 1, prevItem[0])
        return coppiedStateArray
      })
    }
  }

  const returnItemsForColumn = (columnName) => {
    return (
      items &&
      items.length > 0 &&
      items
        .filter((item) => item.column === columnName)
        .map((item, index) => (
          <MovableItem
            key={item.id}
            name={item.name}
            currentColumnName={item.column}
            setItems={setItems}
            index={index}
            moveCardHandler={moveCardHandler}
            description={item.description}
            COLUMN_NAMES={COLUMN_NAMES}
            deleteTasks={deleteTasks}
            tasks={tasks}
            items={items}
            setTask={setTask}
            handleSaveTasks={handleSaveTasks}
            users={users}
            setSelectedUsers={setSelectedUsers}
            taskStatus={item.status}
            taskId={item.id}
            priorty={item.priorty}
            currentTask={item}
            mode={mode}
          />
        ))
    )
  }
  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    UpdateTasks()
  }, [tasks])

  useEffect(() => {
    if (COLUMN_NAMES > {}) {
      UpdateColumn()
    }
  }, [COLUMN_NAMES])

  function UpdateTasks() {
    setItems(tasks)
  }

  function UpdateColumn() {
    SET_COLUMNS(COLUMN_NAMES)
  }

  function deleteAssociationTask(_boardWithTask, deleteColumn) {
    let request
    request = deleteBoardTasks(_boardWithTask)
    if (request.data.length > 0) {
      if (window.confirm("Are you sure to delete all tasks?") == true) {
        axios
          .post(API_URL + "?service.key=update.formData", request)
          .then((response) => {
            if (response.data.C_STATUS === "SUCCESS") {
              handleDeleteColumn(deleteColumn)
            }
            getData()
          })
          .catch((error) => {
            console.error(error)
          })
      }
    } else {
      handleDeleteColumn(deleteColumn, "deleteColumnOnly")
    }
  }

  function deleteBoardTasks(deleteItem) {
    let request = {}
    request.data = []
    deleteItem.length > 0 &&
      deleteItem !== undefined &&
      deleteItem.forEach((_deleteTask) => {
        let taskObject = {
          formId: "kanban_task",
          action: "delete",
          formData: {
            id: _deleteTask.id,
          },
          id: _deleteTask.id,
          entity: "kanban_task",
        }
        request.data.push(taskObject)
      })
    return request
  }

  function handleDeleteColumn(item, condition) {
    if (item === "BackLogs" || item === "Done") {
    } else {
      if (window.confirm("Are you sure to delete this column?") == true) {
        let deletedColumn = filterIt(item, columnList)
        let fieldsData = deletedColumn

        let request = {}
        request.data = []
        let entityForm = {}
        entityForm.formId = "kanban_column"
        entityForm.entity = "kanban_column"
        entityForm.action = "delete"

        entityForm.id = fieldsData[0].id
        request.data.push(entityForm)

        axios
          .post(API_URL + "?service.key=update.formData", request)
          .then((response) => {
            if (response.data.C_STATUS === "SUCCESS") {
              console.log("deleted")
            }
            getData()
          })
          .catch((error) => {
            console.error(error)
          })
      } else {
      }
    }
  }

  return (
    <div className="kanbanboard-container" id="kanban-board">
      {mode === "PREVIEW_MODE" ||
        (mode === "DESIGN_MODE" && (
          <div>
            {Object.values(COLUMN_NAMES).map((key, index) => {
              return (
                <Column
                  key={index}
                  title={key}
                  className={`kanban-column ${key.toLowerCase()}-column`}
                  COLUMN_NAMES={COLUMN_NAMES}
                  setTask={setTask}
                  SET_COLUMNS={SET_COLUMNS}
                  users={users}
                  tasks={tasks}
                  deleteColumnWithTasks={deleteAssociationTask}
                  handleDeleteColumn={handleDeleteColumn}
                  mode={mode}
                >
                  {returnItemsForColumn(key)}
                </Column>
              )
            })}
            <div>
              <TaskModal
                task={task}
                handleTaskInput={handleTaskInput}
                handleSaveTasks={handleSaveTasks}
                filteredUserList={filteredUserList}
                // handleMultiUsers={handleMultiUsers}
                selectedUsers={selectedUsers}
                taskPriorty={taskPriorty}
              />
            </div>
          </div>
        ))}
      {mode === "RENDER_MODE" && (
        <DndProvider backend={HTML5Backend}>
          {Object.values(COLUMN_NAMES).map((key, index) => {
            return (
              <Column
                key={index}
                title={key}
                className={`kanban-column ${key.toLowerCase()}-column`}
                COLUMN_NAMES={COLUMN_NAMES}
                setTask={setTask}
                SET_COLUMNS={SET_COLUMNS}
                users={users}
                tasks={tasks}
                deleteColumnWithTasks={deleteAssociationTask}
                handleDeleteColumn={handleDeleteColumn}
                mode={mode}
              >
                {returnItemsForColumn(key)}
              </Column>
            )
          })}
          <div>
            <TaskModal
              task={task}
              handleTaskInput={handleTaskInput}
              handleSaveTasks={handleSaveTasks}
              filteredUserList={filteredUserList}
              selectedUsers={selectedUsers}
              taskPriorty={taskPriorty}
            />
          </div>
        </DndProvider>
      )}
    </div>
  )
}
