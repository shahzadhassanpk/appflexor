import React from "react";

export default function BoardList({
    boards,
    getSelectedBoard,
    handelEditBoard,
    deleteBoard,
    board,
}) {
    return (
        <div>
            {boards &&
                boards.map((boardItem) => {
                    return (
                        <div className="row boards-style" key={boardItem.id}>
                            <span
                                className={
                                    board.id === boardItem.id
                                        ? `selected-badge-pill col-sm-8`
                                        : `col-sm-8 de-selected`
                                }
                                onClick={() => getSelectedBoard(boardItem.id)}
                            >
                                {boardItem.name}
                            </span>
                            <a
                                type="button"
                                className="text-end text-decoration-none col-sm-1"
                                style={{ cursor: "pointer", color: "blue" }}
                                data-bs-toggle="modal"
                                data-bs-target="#boardModal"
                                data-bs-whatever="@mdo"
                                onClick={() => handelEditBoard(boardItem)}
                            >
                                <i className="fa-solid fa-pen-to-square"></i>
                            </a>
                            <a
                                type="button"
                                className="text-end text-decoration-none col-sm-1"
                                style={{ cursor: "pointer", color: "red" }}
                                onClick={() => deleteBoard(boardItem)}
                            >
                                <i className="fa-solid fa-trash-can"></i>
                            </a>
                        </div>
                    );
                })}
        </div>
    );
}
