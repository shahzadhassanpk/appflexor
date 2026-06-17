import React,{useEffect} from "react"

export default function ColumnModal({
  users,
  column,
  handleColumnInput,
  columnProperty,
  addNewColumns,
  task,
}) {
  useEffect(() => {
    // console.log(users,'select users');
  }, [users])
  
  return (
    <div
      className="modal fade"
      id="columnModal"
      tabIndex="-1"
      aria-labelledby="columnModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="columnModalLabel">
              Add Member
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
              <div className="mb-3">
                {/* <label className="col-form-label" htmlFor="name">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="Column Name"
                  name="key"
                  value={columnProperty.key}
                  onChange={(e) => handleColumnInput(e)}
                /> */}
                <label className="col-form-label" htmlFor="name">
                  Users <span className="text-danger">*</span>
                </label>
                <select
                  name="property"
                  className="form-select"
                  value={columnProperty.property}
                  onChange={(e) => handleColumnInput(e)}
                >
                  <option value="" disabled>
                    Select User
                  </option>
                  {users.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.username}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div className="mb-3">
                <label className="col-form-label">Descritipn:</label>
                <input
                  className="form-control col-sm-1"
                  placeholder="Column Description"
                  name="description"
                  value={columnProperty.description}
                  onChange={(e) => handleColumnInput(e)}
                />
              </div> */}
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
              // onClick={() => handleSaveBoard()}
              onClick={() => addNewColumns()}
              data-bs-dismiss="modal"
              className="btn button-theme "
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
