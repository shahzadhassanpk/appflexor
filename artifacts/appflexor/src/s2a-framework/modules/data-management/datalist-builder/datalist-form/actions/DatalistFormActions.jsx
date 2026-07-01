import { v4 as uuid } from "uuid";
import DndWrapper from "../../../../../components/drag-and-drop-listing";
import { DndCard } from "../../../../../components/drag-and-drop-listing/Card";
import React, { useCallback, useEffect, useState } from "react";
export default function FormActions(props) {
    const {
        selectedItem,
        handleAction,
        type,
        setSelectedItem,
        show,
        setShow,
        linkTypes,
        setLinkTypes,
    } = props;
    const sqlHideDefaulAction = selectedItem.form_id
        ? ["save"]
        : ["add", "edit", "delete", "save"];
    const formHideDefaulAction = ["save"];
    const gridHideDefaulAction = ["edit"];
    const actions = selectedItem?.layout?.actions;
    const [items, setItems] = useState(actions);

    useEffect(() => {
        setItems(actions);
    }, [actions]);

    const updateActionInSelectedItem = callBack => {
        const _items = callBack(items);

        setSelectedItem(prev => ({
            ...prev,
            layout: {
                ...prev.layout,
                actions: _items,
            },
        }));
    };

    function handleDeleteAction(item) {
        if (window.confirm("Are you sure you want to delete")) {
            let _selectedItem = structuredClone(selectedItem);
            let _actions = _selectedItem.layout.actions.filter(
                ele => ele.id !== item.id,
            );
            let _selected_fields = _selectedItem.layout.selected_fields;
            let layout = {
                actions: _actions,
                selected_fields: _selected_fields,
            };
            setSelectedItem(prev => ({
                ...prev,
                layout: layout,
            }));
        }
    }

    function editActions(_selectedAction) {
        let _linkType = structuredClone(linkTypes);
        if (!_selectedAction.form_control) {
            _selectedAction.form_control = "save_and_close";
        }

        _linkType.forEach(item => {
            if (item.code === _selectedAction.link_type) {
                item.selected = true;
            } else {
                item.selected = false;
            }
        });
        if (!_selectedAction.list_title) {
            _selectedAction.list_title = "";
        }
        setShow(prev => ({
            ...prev,
            showModal: true,
            selectedItem: _selectedAction,
            mode: "edit",
        }));
        setLinkTypes(_linkType);
    }

    function filterActions(action) {
        if (selectedItem.datalist_type === "TABLE") {
            if (selectedItem.type === "FORM" && action.type === type) {
                return !formHideDefaulAction.includes(action.code)
                    ? true
                    : false;
            } else {
                if (
                    action.type === type &&
                    !sqlHideDefaulAction.includes(action.code)
                ) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return (
                action.type === type &&
                !gridHideDefaulAction.includes(action.code)
            );
        }
    }

    function handleActionClone(action) {
        const id = uuid();
        let cloneAction = structuredClone(action);
        cloneAction.id = id;
        cloneAction.code = id;

        setSelectedItem(prev => ({
            ...prev,
            layout: {
                ...prev.layout,
                actions: [...prev.layout.actions, cloneAction],
            },
        }));
    }

    return (
        <DndWrapper>
            <div className="s2a-custom-action-listing">
                {items.map((action, index) => {
                    return (
                        <React.Fragment key={index}>
                            {filterActions(action) && (
                                <DndCard
                                    id={action.id}
                                    index={index}
                                    setItems={updateActionInSelectedItem}
                                    move={type === "default" ? false : true}>
                                    <div
                                        className="datalistactions-list"
                                        key={index}>
                                        <span className="d-flex">
                                            <div className="input-align">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    value="action"
                                                    onChange={e =>
                                                        handleAction(
                                                            action.code,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    checked={action.selected}
                                                />
                                            </div>
                                            <div
                                                className="action-list"
                                                dangerouslySetInnerHTML={{
                                                    __html: action.title,
                                                }}
                                                title={action.list_title}></div>
                                        </span>
                                        <span className="d-flex">
                                            <div
                                                className={
                                                    type === "custom" ||
                                                    type === "bulk"
                                                        ? "action-icon"
                                                        : "d-none"
                                                }>
                                                {(type === "custom" ||
                                                    type === "bulk") && (
                                                    <i
                                                        className="fa fa-trash"
                                                        onClick={() =>
                                                            handleDeleteAction(
                                                                action,
                                                            )
                                                        }></i>
                                                )}
                                            </div>
                                            <div
                                                className={
                                                    type === "custom" ||
                                                    type === "bulk"
                                                        ? "action-icon"
                                                        : "d-none"
                                                }>
                                                {(type === "custom" ||
                                                    type === "bulk") && (
                                                    <i
                                                        onClick={() =>
                                                            handleActionClone(
                                                                action,
                                                            )
                                                        }
                                                        className="fa-solid fa-clone "
                                                        title="Duplicate    "></i>
                                                )}
                                            </div>
                                            <div className="action-icon">
                                                <i
                                                    className="fa-solid fa-gear"
                                                    title="Edit"
                                                    onClick={() =>
                                                        editActions(action)
                                                    }></i>
                                            </div>
                                        </span>
                                    </div>
                                </DndCard>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </DndWrapper>
    );
}
