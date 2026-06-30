import React from "react";
import { ItemTypes } from "../../datalist-designer/itemTypes";
import { useDrag, useDrop } from "react-dnd";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";

export default function MoveableFormFields({
    item,
    index,
    handleSelectedFields,
    moveCard,
    findCard,
    id,
    cards,
    setItems,
    actions,
    fieldType,
    handleSelectedField,
    handleSave,
    selectedFieldItem,
    datalistType,
    selectedItem,
    setSelectedItem,
}) {
    const componentList = {
        checklist: "CheckList",
        datetime: "DateTime",
        date: "Date",
        number: "Number",
        radio: "Radio",
        richtext: "RichText",
        select: "Select",
        multiSelect: "MultiSelect",
        signature: "Signature",
        taglist: "TagWrapper",
        time: "Time",
        textfield: "TextField",
        autoincrement: "AutoIncrement",
        expression: "Expression",
        textarea: "TextArea",
        phoneField: "PhoneField",
        json: "Json",
        fileuploader: "File",
        imageview: "ImageView",
        HTML: "Html",
    };
    const showFields = {
        autoincrement: true,
        daterange: true,
        checklist: true,
        checkbox: true,
        radio: true,
        datetime: true,
        date: true,
        number: true,
        richtext: true,
        select: true,
        multiSelect: true,
        signature: true,
        taglist: true,
        time: true,
        textfield: true,
        expression: true,
        textarea: true,
        phoneField: true,
        json: true,
        fileuploader: true,
        hiddenfield: true,
        richtexteditor: true,
        carousel: false,
        datalist: false,
        imageview: false,
        HTML: false,
    };
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const originalIndex = findCard(id)?.index;
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ItemTypes.CARD,
            item: { id, originalIndex },
            collect: monitor => ({
                isDragging: monitor.isDragging(),
            }),
            end: (item, monitor) => {
                const { id: droppedId, originalIndex } = item;
                const didDrop = monitor.didDrop();
                if (!didDrop) {
                    moveCard(droppedId, originalIndex);
                } else if (didDrop) {
                    let layout = {
                        selected_fields: cards,
                        actions: actions,
                    };
                    setItems(prev => ({
                        ...prev,
                        layout: layout,
                    }));
                }
            },
        }),
        [id, originalIndex, moveCard],
    );
    const [, drop] = useDrop(
        () => ({
            accept: ItemTypes.CARD,
            hover({ id: draggedId }) {
                if (draggedId !== id) {
                    const { index: overIndex } = findCard(id);
                    moveCard(draggedId, overIndex);
                }
            },
        }),
        [findCard, moveCard],
    );
    const style = {
        // borderBottom: "1px dashed black",
        opacity: 0.5,
        cursor: "move",
        backgroundColor: "var(--primary-color)",
    };
    const opacity = isDragging ? style : 1;
    if (item && showFields[item.type])
        return (
            <div className="s2a-moveable-field">
                <div
                    ref={node => drag(drop(node))}
                    style={{ ...opacity }}
                    className="datalist-fields"
                    key={index}>
                    <div className="d-flex">
                        <div className="input-align">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={
                                    item.selected
                                    // disabledFields[item.type]
                                    //     ? false
                                    //     : item.selected
                                }
                                onChange={() => handleSelectedFields(item.id)}
                                // disabled={
                                //     disabledFields[item.type]
                                //         ? item.disabled
                                //         : false
                                // }
                            />
                        </div>

                        <div className="moveable-fields">
                            {item.db_column && (
                                <div className="title">{item.label}</div>
                            )}
                        </div>
                    </div>
                    {
                        // (item.db_column && item.disabled === false)) && (
                        // !disabledFields[item.type] ? (
                        <div
                            className="form-field-config"
                            onClick={() => handleShow()}>
                            <i className="fa-solid fa-gear"></i>
                        </div>
                        // ) : (
                        //     <div className="form-field-config config-disabled">
                        //         <i className="fa-solid fa-gear"></i>
                        //     </div>
                        // )
                    }
                </div>
                <FieldConfigModal
                    show={show}
                    handleClose={handleClose}
                    item={item}
                    typeList={componentList}
                    fieldType={fieldType}
                    handleSelectedField={handleSelectedField}
                    index={index}
                    handleSave={handleSave}
                    selectedFieldItem={selectedFieldItem}
                    datalistType={datalistType}
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                />
            </div>
        );
}

function FieldConfigModal(props) {
    const {
        show,
        handleClose,
        item,
        typeList,
        fieldType,
        handleSelectedField,
        index,
        handleSave,
        selectedFieldItem,
        datalistType,
        selectedItem,
        setSelectedItem,
    } = props;

    function handleSaved(item) {
        handleSave(item);
        handleClose();
    }

    const actionCheckboxes = [
        {
            name: "include",
            value: item.include || false,
            db_column: item.db_column,
            checked: item.include,
            type: "checkbox",
            label: "Include Export",
            show: true,
        },
        {
            name: "serviceParam",
            value: item.serviceParam || false,
            db_column: item.db_column,
            checked: item.serviceParam,
            type: "checkbox",
            label: "Service Param",
            show: true,
        },
        {
            name: "isHtml",
            value: item.isHtml || false,
            db_column: item.db_column,
            checked: item.isHtml,
            type: "checkbox",
            label: "Show Html with expression",
            show: true,
        },
        {
            name: "isFilter",
            value: item.isFilter || false,
            db_column: item.db_column,
            checked: item.isFilter,
            type: "checkbox",
            label: "Show Filter",
            show: true,
        },
        {
            name: "includeAggregate",
            value: item.includeAggregate || false,
            db_column: item.db_column,
            checked: item.includeAggregate,
            type: "checkbox",
            label: "Include Aggregate",
            show: item.type === "number",
        },
    ];

    const aggregateOptions = [
        {
            label: "Sum",
            code: "SUM",
        },
        {
            label: "Average",
            code: "AVG",
        },
        {
            label: "Min",
            code: "MIN",
        },
        {
            label: "Max",
            code: "MAX",
        },
        // {
        //     label: "Percentile",
        //     code: "PERCENTILE",
        // },
    ];

    const jsonConversion = [
        { code: "json", label: "Json" },
        { code: "json_to_html", label: "Json to html" },
    ];
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    return (
        <>
            <Modal
                className="s2a-modal s2a-config-modal"
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title className="modal-title">
                        <span>{item.label}</span>
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
                                onClick={handleClose}></i>
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <div className="row">
                            <div className="col-sm-6">
                                <Form.Group
                                    className="mb-3"
                                    controlId={item.db_column}>
                                    <Form.Label>Field Label</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="label"
                                        value={item.label}
                                        onChange={e =>
                                            handleSelectedField(e, index, item)
                                        }
                                        placeholder="Enter Label"
                                        autoFocus
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-sm-6">
                                <Form.Group
                                    className="mb-3"
                                    controlId={item.db_column}>
                                    <Form.Label>Field Type</Form.Label>
                                    <Form.Select
                                        aria-label="Default select example"
                                        name="type"
                                        className="form-control"
                                        value={item.type}
                                        onChange={e =>
                                            handleSelectedField(e, index, item)
                                        }
                                        disabled={
                                            fieldType === "SQL"
                                                ? false
                                                : fieldType === "FORM"
                                                ? true
                                                : false
                                        }>
                                        <option defaultValue={""}>
                                            Select Type
                                        </option>
                                        {Object.keys(typeList).map(
                                            (fieldType, index) => (
                                                <option
                                                    key={index}
                                                    className="text-capitalize"
                                                    defaultValue={fieldType}>
                                                    {fieldType}
                                                </option>
                                            ),
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <Form.Group
                                    className="mb-3"
                                    controlId={item.db_column}>
                                    <Form.Label>Db Column</Form.Label>
                                    <Form.Control
                                        type="text"
                                        disabled
                                        placeholder={item.db_column}
                                        autoFocus
                                    />
                                </Form.Group>
                            </div>
                            {item.type === "fileuploader" &&
                                selectedItem.type === "SQL" && (
                                    <div className="col-sm-6">
                                        <Form.Group
                                            className="mb-3"
                                            controlId={item.db_column}>
                                            <Form.Label>Table</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={selectedItem.table}
                                                onChange={e =>
                                                    setSelectedItem(prev => ({
                                                        ...prev,
                                                        table: e.target.value,
                                                    }))
                                                }
                                                autoFocus
                                            />
                                        </Form.Group>
                                    </div>
                                )}
                            <div className="col-sm-6">
                                {item.type === "expression" && (
                                    <Form.Group
                                        className="mb-3"
                                        controlId={item.db_column}>
                                        <Form.Label>Expression</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="expression"
                                            value={item.expression}
                                            placeholder={item.expression}
                                            autoFocus
                                            onChange={e =>
                                                handleSelectedField(
                                                    e,
                                                    index,
                                                    item,
                                                )
                                            }
                                        />
                                    </Form.Group>
                                )}
                            </div>
                            {datalistType === "SQL" && item.type === "json" && (
                                <>
                                    <div className="col-sm-12 d-flex align-items-center mb-3">
                                        <span className="me-2">
                                            Conversion Type:{" "}
                                        </span>
                                        {jsonConversion.map((type, index) => (
                                            <div
                                                key={index}
                                                className="form-group">
                                                <input
                                                    id={type.label}
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="json_type"
                                                    value={type.code}
                                                    autoFocus
                                                    checked={
                                                        item.json_type ===
                                                        type.code
                                                    }
                                                    onChange={e =>
                                                        handleSelectedField(
                                                            e,
                                                            index,
                                                            item,
                                                        )
                                                    }
                                                />
                                                <label
                                                    htmlFor={type.label}
                                                    className="text-capitalize ps-2 pe-2">
                                                    {type.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {actionCheckboxes.map((actionCheckboxe, i) => {
                            // const notReq = ["signature", "fileuploader"];
                            const notReq = ["signature"];
                            if (
                                notReq.includes(item.type) &&
                                actionCheckboxe.name === "isFilter"
                            ) {
                                actionCheckboxe.show = false;
                            }
                            return (
                                actionCheckboxe.show && (
                                    <Form.Group
                                        key={i}
                                        className="mb-3 me-3 d-inline-flex"
                                        controlId={actionCheckboxe.db_column}>
                                        <Form.Check
                                            className="pe-2"
                                            type={actionCheckboxe.type}
                                            placeholder={
                                                actionCheckboxe.db_column
                                            }
                                            name={actionCheckboxe.name}
                                            value={
                                                actionCheckboxe.value || false
                                            }
                                            checked={actionCheckboxe.value}
                                            onChange={e =>
                                                handleSelectedField(
                                                    e,
                                                    index,
                                                    item,
                                                )
                                            }
                                            autoFocus
                                        />
                                        <Form.Label>
                                            {actionCheckboxe.label}
                                        </Form.Label>
                                    </Form.Group>
                                )
                            );
                        })}
                        {item.type === "number" && item.includeAggregate && (
                            <>
                                <div className="row">
                                    <Form.Group
                                        className="mb-3"
                                        controlId="aggregate">
                                        <Form.Label>Aggregate Types</Form.Label>
                                        <Form.Select
                                            onChange={e =>
                                                handleSelectedField(
                                                    e,
                                                    index,
                                                    item,
                                                )
                                            }
                                            name="aggregate"
                                            value={item.aggregate}
                                            aria-label="Default select example">
                                            <option
                                                key="first"
                                                value="">
                                                Select Aggregate
                                            </option>
                                            {aggregateOptions.map(
                                                (aggregateOption, index) => (
                                                    <option
                                                        key={index}
                                                        value={
                                                            aggregateOption.code
                                                        }>
                                                        {aggregateOption.label}
                                                    </option>
                                                ),
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                </div>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-sm button-theme"
                        onClick={handleClose}>
                        Close
                    </button>
                    <button
                        className="btn btn-sm button-theme"
                        onClick={() => handleSaved(selectedFieldItem)}>
                        Save Changes
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
