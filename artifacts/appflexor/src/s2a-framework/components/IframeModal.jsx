import React, { useEffect, useState } from "react";


function IframeModal(externalLink, show){
  
    return (
        <div className="modal fade">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Title</h5>
                        <a className="close" data-bs-dismiss="modal"><i className="fa fa-times-circle"></i></a>
                    </div>
                    <div className="modal-body">
                        <iframe src={externalLink}>
                        </iframe>
                    </div>
                </div>
            </div>
        </div>
    )
}
export { IframeModal };