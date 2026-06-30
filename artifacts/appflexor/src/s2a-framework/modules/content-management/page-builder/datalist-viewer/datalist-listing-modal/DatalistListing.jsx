import { useState } from "react";
import { Modal } from "react-bootstrap";
import ReactSelect from "../../../../../components/ReactSelect/ReactSelect";

export default function DatalistListing(props) {
    const {
        dataList,
        saveDataListIdInLayout,
        show,
        setShow,
        getSelectedDataList,
        selectedItem,
        setHidePagination,
        setHideSearch,
        setHideActions,
        hideSearch,
        hidePagination,
        hideActions,
        hideCheckBoxes,
        setHideCheckBoxes,
        hideLabel,
        setHideLabel,
    } = props;
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");
    return (
        <>
            <Modal
                className="s2a-modal"
                dialogClassName="datalistviewer-modal"
                show={show}
                onHide={() => setShow(false)}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span className="header text-truncate">
                            Datalist Viewer Settings
                        </span>
                        <div className="d-flex">
                            <div
                                className={`${
                                    toggleModalWindow === "maximize"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("maximize")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Maximize window">
                                <i className="fa-regular fa-window-maximize modal-resize"></i>
                            </div>
                            <div
                                className={`${
                                    toggleModalWindow === "restore"
                                        ? "visually-hidden"
                                        : ""
                                } `}
                                onClick={() => setToggleModalWindow("restore")}
                                data-bs-toggle="tooltip"
                                data-bs-title="Restore Window">
                                <i className="fa-regular fa-window-restore modal-resize"></i>
                            </div>
                            <i
                                className="fa-solid fa-xmark modal-close"
                                onClick={() => setShow(false)}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <>
                        <div className="row datalist_viewer_listing">
                            <div className="col-sm-6">
                                <div className="select-all">
                                    <label
                                        htmlFor="hideall"
                                        className="label">
                                        <input
                                            type="checkbox"
                                            id="hideall"
                                            className="form-check-input hideall"
                                            checked={
                                                hideActions &&
                                                hideSearch &&
                                                hidePagination &&
                                                hideCheckBoxes &&
                                                hideLabel
                                            }
                                            onClick={e => {
                                                setHideActions(
                                                    e.target.checked,
                                                );
                                                setHideSearch(e.target.checked);
                                                setHidePagination(
                                                    e.target.checked,
                                                );
                                                setHideCheckBoxes(
                                                    e.target.checked,
                                                );
                                                setHideLabel(e.target.checked);
                                            }}
                                        />
                                        Hide
                                    </label>
                                </div>
                                <ul className="form-group actions">
                                    <li className="action-item">
                                        <div className="input-group input-group-sm ">
                                            <label
                                                className=""
                                                htmlFor="HideActions">
                                                <input
                                                    onChange={e =>
                                                        setHideActions(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id="HideActions"
                                                    type="checkbox"
                                                    className="form-check-input margin-right"
                                                    checked={hideActions}
                                                />
                                                Actions
                                            </label>
                                        </div>
                                    </li>
                                    <li className="action-item">
                                        <div className="input-group input-group-sm ">
                                            <label
                                                className=""
                                                htmlFor="HideSearch">
                                                <input
                                                    onChange={e =>
                                                        setHideSearch(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id="HideSearch"
                                                    type="checkbox"
                                                    className="form-check-input margin-right"
                                                    checked={hideSearch}
                                                />
                                                Search
                                            </label>
                                        </div>
                                    </li>
                                    <li className="action-item">
                                        <div className="input-group input-group-sm ">
                                            <label
                                                className=""
                                                htmlFor="HidePagination">
                                                <input
                                                    onChange={e =>
                                                        setHidePagination(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id="HidePagination"
                                                    type="checkbox"
                                                    className="form-check-input margin-right"
                                                    checked={hidePagination}
                                                />
                                                Pagination
                                            </label>
                                        </div>
                                    </li>
                                    <li className="action-item">
                                        <div className="input-group input-group-sm">
                                            <label
                                                className=""
                                                htmlFor="hideCheckBoxes">
                                                <input
                                                    onChange={e =>
                                                        setHideCheckBoxes(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id="hideCheckBoxes"
                                                    type="checkbox"
                                                    className="form-check-input margin-right"
                                                    checked={hideCheckBoxes}
                                                />
                                                Select All
                                            </label>
                                        </div>
                                    </li>
                                    <li className="action-item">
                                        <div className="input-group input-group-sm">
                                            <label
                                                className=""
                                                htmlFor="label">
                                                <input
                                                    onChange={e =>
                                                        setHideLabel(
                                                            e.target.checked,
                                                        )
                                                    }
                                                    id="label"
                                                    type="checkbox"
                                                    className="form-check-input margin-right"
                                                    checked={hideLabel}
                                                />
                                                Label
                                            </label>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="col-sm-6 select-datalist">
                                <label className="label">Select Datalist</label>
                                <ReactSelect
                                    placeholder="Select Datalist"
                                    options={dataList}
                                    fieldLabel="name"
                                    fieldValue="id"
                                    selectedOption={selectedItem}
                                    handleChange={obj =>
                                        getSelectedDataList(obj)
                                    }
                                />
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-sm-12 d-flex justify-content-end">
                                <button
                                    className="btn btn-sm button-theme "
                                    onClick={() => saveDataListIdInLayout()}>
                                    Ok
                                </button>
                            </div>
                        </div>
                    </>
                </Modal.Body>
            </Modal>
        </>
    );
}
