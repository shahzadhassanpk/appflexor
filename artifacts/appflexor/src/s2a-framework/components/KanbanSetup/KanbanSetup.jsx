import axios from "axios"
import React, { useContext, useEffect, useState } from "react"
import { API_URL } from "../../Config"
import BoardList from "./BoardList"
import BoardModal from "./BoardModal"
import ColumnModal from "./ColumnModal"
import filterIt from "./Filterit"
import { Kanbanboard } from "./KanbanBoard/Kanbanboard"
import "./kanbansetup.css"

export default function KanbanSetup(props) {
  let mode = props.mode
  const [selectedBoardId, setSelectedBoardId] = useState("")
  let initialboard = {
    id: "",
    name: "",
    description: "",
  }
  let initialColumn = {
    id: "",
    board_id: "",
    name: "",
  }
  const [savedColumn, setSavedColumn] = useState(initialColumn)
  const [board, setBoard] = useState(initialboard)
  const [boards, setBoards] = useState([])
  const [filteredBoards, setFilteredBoards] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [column, setColumn] = useState({})
  const [users, setUsers] = useState([])
  const [filteredUserList, setFilteredUserList] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [columnList, setColumnList] = useState([])
  const [columnProperty, setColumnProperty] = useState({
    key: "",
    property: "",
  })
  let initialTask = {
    id: "",
    name: "",
    description: "",
    column: "",
    board_id: "",
    user_id: "",
    priorty: "",
    status: "Un-Assigned",
  }
  const [task, setTask] = useState(initialTask)
  const [tasks, setTasks] = useState([])
  const [memberColumn, setMemberColumn] = useState([])
  useEffect(() => {
    getData()
  }, [])

  function addNewColumns() {
    
    if (columnProperty.property) {
      setColumnProperty((prev) => ({
        ...prev,
        key: "",
        property: "",
      }))
      let dynamicObjProperty = { ...column }
      Object.defineProperty(dynamicObjProperty, columnProperty.property, {
        value: columnProperty.property,
        writable: true,
        enumerable: true,
        configurable: true,
      })
      setColumn(dynamicObjProperty)
      setTask((prev) => ({
        ...prev,
        column: columnProperty.property,
        user_id: columnProperty.property,
      }))

      if (columnProperty.property !== "") {
        handleSaveColumn(columnProperty.property)
      }
    } else {
      window.confirm("Please enter the column name")
    }
  }

  function handleBoardInput(e) {
    let value = e.target.value
    let name = e.target.name
    setBoard((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  function handleTaskInput(e) {
    let value = e.target.value
    let name = e.target.name
    setTask((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleColumnInput(e) {
    let value = e.target.value
    let name = e.target.name
    setColumnProperty((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function clearFieldsBoard() {
    setBoard(initialboard)
  }
  function clearFieldsTask() {
    setTask((prev) => ({
      ...prev,
      id: "",
      name: "",
    }))
  }

  function handelEditBoard(selectedBoard) {
    setBoard(selectedBoard)
  }

  function handleSaveBoard() {
    if (board.name) {
      setTask((prev) => ({
        ...prev,
        column: column,
      }))
      var url = API_URL + "?service.key=update.formData"
      var request = {}
      request.data = []
      var entityForm = {}

      entityForm.formId = "kanban_board" //"formid"
      entityForm.entity = "kanban_board" //Db- "table name"
      entityForm.action = "update"

      if (!board.id || board.id == "" || board.id == "new") {
        entityForm.id = "new"
        board.id = "new"
      } else {
        entityForm.id = board.id
      }

      entityForm.formData = board
      request.data.push(entityForm)

      try {
        axios.post(url, request).then(function (response) {
          if (response.status === 200) {
            setBoard((prev) => ({
              ...prev,
              id: response.data.C_DATA[0].formData["id"],
            }))
            getSelectedBoard(response.data.C_DATA[0].formData["id"])
            // let boardId = response.data.C_DATA[0].formData.id
            // columnAndBoardId(boardId)
            getData()
          }
        })
      } catch (e) {
        console.log("saveGig error:" + e)
      }
    } else {
      window.confirm("Please enter the name")
    }
  }

  function handleSaveColumn(columnName) {
    
    let fieldData = { ...savedColumn }
    fieldData.name = columnName
    if (fieldData.name !== "" && fieldData.board_id !== "") {
      var url = API_URL + "?service.key=update.formData"
      var request = {}
      request.data = []
      var entityForm = {}

      entityForm.formId = "kanban_column" //"formid"
      entityForm.entity = "kanban_column" //Db- "table name"
      entityForm.action = "update"

      if (!fieldData.id || fieldData.id == "" || fieldData.id == "new") {
        entityForm.id = "new"
        fieldData.id = "new"
      } else {
        entityForm.id = fieldData.id
      }

      entityForm.formData = fieldData
      request.data.push(entityForm)

      try {
        axios.post(url, request).then(function (response) {
          if (response.status === 200) {
            //   setBoard((prev) => ({
            //     ...prev,
            //     id: response.data.C_DATA[0].formData.id,
            //   }))
            // let boardId = response.data.C_DATA[0].formData.id
            // columnAndBoardId(boardId)
            getData()
          }
        })
      } catch (e) {
        console.log("saveGig error:" + e)
      }
    } else {
      window.confirm("Please enter the name")
    }
  }

  function handleSaveTasks(task) {
    
    if (task.name && task.description && task.column || task.user_id) {
      if (task.column === "BackLogs") {
        task.status = "Un-Assigned"
      }
      else if(task.column === "Done"){
        task.status = "Done"
      }
      else{
         task.status = "Assigned"
      }
      setTask((prev) => ({
        ...prev,
        column: columnProperty.property,
      }))
      var url = API_URL + "?service.key=update.formData"
      var request = {}
      request.data = []
      var entityForm = {}

      entityForm.formId = "kanban_task" //"formid"
      entityForm.entity = "kanban_task" //Db- "table name"
      entityForm.action = "update"

      if (!task.id || task.id == "" || task.id == "new") {
        entityForm.id = "new"
        task.id = "new"
      } else {
        entityForm.id = task.id
      }

      entityForm.formData = task
      request.data.push(entityForm)

      try {
        axios.post(url, request).then(function (response) {
          if (response.status === 200) {
            
            setTask((prev) => ({
              ...prev,
              id: response.data.C_DATA[0].formData["id"],
              board_id: task.board_id,
            }))
            getData()
          }
        })
      } catch (e) {
        console.log("saveGig error:" + e)
      }
    } else {
      window.confirm("Please fill the task name and description")
    }
  }

  function deleteBoardWithTasks(_board_id) {
    let boardWithTasks = []
    tasks.forEach((_task) => {
      if (_board_id === _task.board_id) {
        boardWithTasks.push(_task)
      }
    })
    return boardWithTasks ? boardWithTasks : []
  }
  function deleteBoardWithColumns(_board_id) {
    
    let boardWithColumns = []
    columnList.forEach((column) => {
      if (_board_id === column.board_id) {
        boardWithColumns.push(column)
      }
    })
    return boardWithColumns ? boardWithColumns : []
  }

  function deleteBoard(item) {
    if (window.confirm("Are you sure to delete?") == true) {
      let fieldsData = item
      let taskRelatedToBoard = deleteBoardWithTasks(fieldsData.id)
      let columnRelatedToBoard = deleteBoardWithColumns(fieldsData.id)
      deleteAssociationTask(taskRelatedToBoard)
      deleteAssociationColumns(columnRelatedToBoard)
      let request = {}
      request.data = []
      let entityForm = {}
      entityForm.formId = "kanban_board"
      entityForm.entity = "kanban_board"
      entityForm.action = "delete"

      entityForm.id = fieldsData.id
      request.data.push(entityForm)

      axios
        .post(API_URL + "?service.key=update.formData", request)
        .then((response) => {
          if (response.data.C_STATUS === "SUCCESS") {
            clearFieldsBoard()
            getData()
            setColumn({})
          }
        })
        .catch((error) => {
          console.error(error)
        })
    } else {
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
  function deleteBoardColumns(deleteItem) {
    let request = {}
    request.data = []
    deleteItem.length > 0 &&
      deleteItem !== undefined &&
      deleteItem.forEach((_deleteTask) => {
        let taskObject = {
          formId: "kanban_column",
          action: "delete",
          formData: {
            id: _deleteTask.id,
          },
          id: _deleteTask.id,
          entity: "kanban_column",
        }
        request.data.push(taskObject)
      })
    return request
  }

  function deleteAssociationTask(_boardWithTask) {
    let request
    request = deleteBoardTasks(_boardWithTask)

    axios
      .post(API_URL + "?service.key=update.formData", request)
      .then((response) => {
        if (response.data.C_STATUS === "SUCCESS") {
          clearFieldsBoard()
          getData()
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }
  function deleteAssociationColumns(_boardWithColumns) {
    let request
    request = deleteBoardColumns(_boardWithColumns)

    axios
      .post(API_URL + "?service.key=update.formData", request)
      .then((response) => {
        if (response.data.C_STATUS === "SUCCESS") {
          clearFieldsBoard()
          getData()
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  function deleteTasks(item) {
    if (window.confirm("Are you sure to delete?") == true) {
      let fieldsData = item
      let request = {}
      request.data = []
      let entityForm = {}
      entityForm.formId = "kanban_task"
      entityForm.entity = "kanban_task"
      entityForm.action = "delete"

      entityForm.id = fieldsData.id
      request.data.push(entityForm)

      axios
        .post(API_URL + "?service.key=update.formData", request)
        .then((response) => {
          if (response.data.C_STATUS === "SUCCESS") {
            clearFieldsBoard()
            getData()
          }
        })
        .catch((error) => {
          console.error(error)
        })
    } else {
    }
  }

  function getData() {
    var dataRequest = {
      dataKeys: [
        {
          serviceParams: "",
          dataKey: "kanban_board",
          serviceKey: "kanban.board",
          mode: "formData",
        },
        {
          serviceParams: "",
          dataKey: "kanban_task",
          serviceKey: "kanban.task",
          mode: "formData",
        },
        {
          serviceParams: "",
          dataKey: "dirUser",
          serviceKey: "dir.user",
          mode: "formData",
        },
        {
          serviceParams: "",
          dataKey: "kanban_column",
          serviceKey: "kanban.column",
          mode: "formData",
        },
      ],
    }

    axios
      .post(API_URL + "?service.key=multiKey.data", dataRequest)
      .then((response) => {
        if (response.data.C_STATUS === "SUCCESS") {
          
          if (response.data.C_DATA) {
            let _boards = response.data.C_DATA.kanban_board
            let _tasks = response.data.C_DATA.kanban_task
            let _users = response.data.C_DATA.dirUser
            let _columns = response.data.C_DATA.kanban_column

            setBoards(_boards)
            setTasks(_tasks)
            setFilteredTasks(_tasks)
            setColumnList(_columns)
            let userArr = []
            _users.forEach((currentUser, i) => {
              if (userArr.length === 0) {
                let groupId = []
                groupId.push(currentUser.groupid)
                let _currentUser = {
                  ...currentUser,
                  groupid: groupId,
                }
                userArr.push(_currentUser)
              } else {
                const i = userArr.findIndex((e) => e.id === currentUser.id)
                if (i > -1) {
                  userArr[i].groupid.push(currentUser.groupid)
                } else {
                  let groupId = []
                  groupId.push(currentUser.groupid)
                  let _currentUser = {
                    ...currentUser,
                    groupid: groupId,
                  }
                  userArr.push(_currentUser)
                }
              }
            })
            setUsers(userArr)
            setFilteredUserList(userArr)
            if (selectedBoardId)
              getSelectedBoard(selectedBoardId, _columns, _tasks)
          } else {
            console.log(
              `Either kanban_board does not exists or SQL query returns no result.`
            )
          }
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }
  function getArrayById(arr, id) {
    let result = []
    arr &&
      arr.length > 0 &&
      arr.forEach((obj) => {
        if (obj.board_id === id) {
          result.push(obj)
        }
      })
    return result ? result : []
  }
  function objectOfColumn(filteredColumn, _id) {
    
    let result = {}
    filteredColumn &&
      filteredColumn.length > 0 &&
      filteredColumn.forEach((items) => {
        if (items.board_id === _id) {
          // result = items.column
          result = Object.defineProperty(result, items.name, {
            value: items.name,
            writable: true,
            enumerable: true,
            configurable: true,
          })
        }
      })
    return result ? result : {}
  }

  function getSelectedBoard(selectedBoard, columnListUpdated, tasksUpdated) {
    
    setSelectedBoardId(selectedBoard)
    // selectedBoardId = selectedBoard
    if (selectedBoard !== "") {
      setSavedColumn((prev) => ({
        ...prev,
        board_id: selectedBoard,
      }))
    }

    setBoard((prev) => ({
      ...prev,
      id: selectedBoard,
    }))
    setTask((prev) => ({
      ...prev,
      board_id: selectedBoard,
    }))

    let filteredColumn = filterIt(
      selectedBoard,
      columnListUpdated ? columnListUpdated : columnList
    )
    let filteredTasksById = filterIt(
      selectedBoard,
      tasksUpdated ? tasksUpdated : tasks
    )
    // let _columns = getArrayById(filteredTasks, selectedBoard)

    setFilteredTasks(filteredTasksById)
    let allColumn = objectOfColumn(filteredColumn, selectedBoard)
    Object.defineProperties(allColumn, {
      BackLogs: {
        value: "BackLogs",
        writable: true,
        enumerable: true,
        configurable: true,
      },
      Done: {
        value: "Done",
        writable: true,
        enumerable: true,
        configurable: true,
      },
    })
    setColumn(allColumn)
    // if (_columns.length < 0 || (_columns.length === 0 && allColumn === {})) {
    //   setColumn({})
    // }
  }

  return (
    <>
      <div className="d-flex" id="kanban-setup-style">
        <div className="sidebar-boards mx-2">
          <a
            data-bs-toggle="modal"
            data-bs-target="#boardModal"
            data-bs-whatever="@board"
            onClick={() => clearFieldsBoard()}
            style={{ cursor: "pointer", color: "blue" }}
          >
            <i className="fa-regular fa-square-plus"></i>
          </a>
          <BoardModal
            board={board}
            handleBoardInput={handleBoardInput}
            handleSaveBoard={handleSaveBoard}
          />
          <div className="kanban-list">
            <BoardList
              boards={boards}
              filteredBoards={filteredBoards}
              setFilteredBoards={setFilteredBoards}
              getSelectedBoard={getSelectedBoard}
              handelEditBoard={handelEditBoard}
              deleteBoard={deleteBoard}
              board={board}
            />
          </div>
        </div>
        <div className="kanban-tasks">
          <span className="d-flex">
            <a
              type="button"
              className="add-column"
              data-bs-toggle="modal"
              data-bs-target="#columnModal"
              data-bs-whatever="@column"
              onClick={() => clearFieldsTask()}
              style={{ cursor: "pointer", color: "blue" }}
            >
              <i
                className={task.board_id ? `fa-regular fa-square-plus` : ``}
              ></i>
            </a>
          </span>
          <ColumnModal
            column={column}
            columnProperty={columnProperty}
            handleColumnInput={handleColumnInput}
            addNewColumns={addNewColumns}
            task={task}
            users={users}
          />
          {task.board_id ? (
            <Kanbanboard
              tasks={filteredTasks}
              COLUMN_NAMES={column}
              SET_COLUMNS={setColumn}
              task={task}
              handleTaskInput={handleTaskInput}
              handleSaveTasks={handleSaveTasks}
              clearFieldsTask={clearFieldsTask}
              getSelectedBoard={getSelectedBoard}
              setTask={setTask}
              deleteTasks={deleteTasks}
              users={users}
              filteredUserList={filteredUserList}
              // handleMultiUsers={handleMultiUsers}
              selectedUsers={selectedUsers}
              setSelectedUsers={setSelectedUsers}
              getData={getData}
              columnProperty={columnProperty}
              columnList={columnList}
              mode={mode}
            />
          ) : (
            <></>
          )}
        </div>
      </div>
    </>
  )
}
