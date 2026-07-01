import React from 'react'

export default function BoardModal({board,handleBoardInput,handleSaveBoard}) {
  return (
    <div
      className="modal fade"
      id="boardModal"
      tabIndex="-1"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="exampleModalLabel">
              Add Team
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
                <label htmlFor="name" className="col-form-label">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="Board Name"
                  name="name"
                  value={board.name}
                  onChange={(e) => handleBoardInput(e)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="col-form-label">
                  Descritipn:
                </label>
                <input
                  className="form-control col-sm-1"
                  placeholder="Board Description"
                  name="description"
                  value={board.description}
                  onChange={(e) => handleBoardInput(e)}
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
              onClick={() => handleSaveBoard()}
              className="btn button-theme "
              data-bs-dismiss="modal"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
