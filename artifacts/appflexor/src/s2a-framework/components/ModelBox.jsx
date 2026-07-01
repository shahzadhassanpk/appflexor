import React, { useState } from "react";

function ModelBox({ buttonTitle, src }) {
    return (
      <div className="mx-2">
        {/* <button
          type="button"
          className="btn btn-sm button-theme "
          data-bs-toggle="modal"
          data-bs-target="#exampleModal"
        >
          {buttonTitle}
        </button> */}
  
        <div
          className="modal fade"
          id="exampleModal"
          tabIndex="-1"
          aria-labelledby="add-review"
          aria-hidden="false"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <iframe
                  src={src}
                  width="100%"
                  height="650px"
                  frameborder="0"
                  scrolling="no"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export { ModelBox };