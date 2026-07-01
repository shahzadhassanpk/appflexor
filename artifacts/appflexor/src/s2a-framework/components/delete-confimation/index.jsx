import React from "react";

const DeleteConfimation = ({ item, deleteModalRef, handleDelete, message }) => {
    return (
        <div>
            <span className="">{message}</span>
            <div className="mt-3 text-end">
                <button
                    onClick={() => {
                        handleDelete(item);
                        deleteModalRef.current.close();
                    }}
                    className="btn btn-sm button-theme me-2">
                    Yes
                </button>
                <button
                    onClick={() => deleteModalRef.current.close()}
                    className="btn btn-sm button-theme me-2">
                    No
                </button>
            </div>
        </div>
    );
};

export default DeleteConfimation;
