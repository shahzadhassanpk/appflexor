import React, { useEffect, useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Modal from "react-bootstrap/Modal";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import { API_URL } from "../../../../../../Config";
import {
    createPostRequest,
    deletePostRequest,
    updatePostRequest,
} from "../../../../datalist-builder/custom-action-modal/utils";
import ActionParamTableForForm from "./ActionParamTableForForm";

export default function CustomActionForForms(props) {
    const {
        show,
        setShow,
        selectedItem,
        setSelectedItem,
        formList,
        linkType,
        processCategory,
        dataList,
        fields,
        page,
    } = props;
    const [validated, setValidated] = useState(false);
    const [toggleModalWindow, setToggleModalWindow] = useState("restore");

    const initialHyperParameters = {
        index: "",
        parameter_name: "",
        column_name: "",
    };

    const [hyperParam, setHyperParam] = useState(initialHyperParameters);
    const initialCustomActions = {
        id: "",
        code: "",
        title: "",
        form: "",
        list_title: "",
        selected: true,
        hyper_parameters: [],
        hyper_link: "",
        hyper_target: "dialog",
        confirmation_message: "",
        visibility_control: [],
        type: "custom",
        expression: "",
        link_type: "",
        emailkey: "",
        enable_modal: false,
        process_category: "",
        process_id: "",
        datalist_id: "",
        post_json: "",
        method: "",
        api_service: "",
        datasource: "",
        allow_refresh: true,
        entity: "",
        modal_size: "",
        aside_position: "",
        show_as: "",
    };
    const RestApiMethods = [
        { title: "Default Option", code: "" },
        { title: "Post", code: "post" },
        { title: "Put", code: "put" },
        { title: "Patch", code: "patch" },
        { title: "Delete", code: "delete" },
    ];
    const appServiceMethods = [
        { title: "Default Option", code: "" },
        { title: "Add New", code: "post" },
        { title: "Update", code: "update" },
        { title: "Delete", code: "delete" },
    ];
    const [action, setAction] = useState(initialCustomActions);
    const [filteredProcess, setFilteredProcess] = useState([]);
    const [requestMethods, setRequestMethods] = useState([]);
    const [apiServices] = useState([
        { title: "App Service", code: "APPSERVICE" },
        { title: "External", code: "EXTERNAL" },
    ]);
    const hyperTargetOptions = [
        { code: "current_window", title: "Current Window" },
        { code: "new_window", title: "New Window" },
        { code: "dialog", title: "Dialog" },
        // { code: "aside", title: "Inline" },
        // { code: "switch", title: "Switch" },
    ];

    const appServiceKeysMapping = useMemo(() => {
        return {
            post: { operation: () => createPostRequest() },
            update: { operation: () => updatePostRequest() },
            delete: { operation: () => deletePostRequest() },
        };
    }, []);

    const restApiMapping = useMemo(() => {
        return {
            post: { operation: () => restApi() },
            put: { operation: () => restApi() },
            patch: { operation: () => restApi() },
            get: { operation: () => restApi() },
            delete: { operation: () => restApi() },
        };
    }, []);
    const modalSizes = [
        { title: "Small", code: "sm" },
        { title: "Large", code: "lg" },
        { title: "Extra Large", code: "xl" },
        { title: "Full Screen", code: "xxl-down" },
    ];
    const asidePositions = [
        { title: "Left", code: "left" },
        { title: "Right", code: "right" },
        { title: "Top", code: "top" },
        { title: "Bottom", code: "bottom" },
    ];

    const restApi = () => {
        return {};
    };

    useEffect(() => {
        if (action && action?.api_service) {
            action?.api_service === "APPSERVICE"
                ? setRequestMethods(appServiceMethods)
                : setRequestMethods(RestApiMethods);
        }
    }, [action?.api_service]);

    useEffect(() => {
        if (show.mode == "addNew") {
            setAction(initialCustomActions);
        } else {
            setAction(selectedItem);
        }
    }, [show]);

    useEffect(() => {
        if (
            (action?.code === "edit" || action?.code === "add") &&
            !action?.hyper_target
        ) {
            setAction({ ...action, hyper_target: "dialog", modal_size: "lg" });
        }
        //  else if (
        //     action?.hyper_target === "aside" &&
        //     !action?.aside_position
        // ) {
        //     setAction({ ...action, aside_position: "left" });
        // }
        else if (action?.hyper_target === "" && action?.type === "custom") {
            setAction({ ...action, hyper_target: "dialog" });
        }
    }, [action]);

    useEffect(() => {
        if (action?.process_category) {
            getProcessDefination();
        }
    }, [action?.process_category]);

    function getProcessDefination() {
        var dataRequest = {
            dataKeys: [
                {
                    serviceParams: action?.process_category,
                    dataKey: "processMap",
                    serviceKey: "sys.selectedcategory.process",
                    mode: "formData",
                },
            ],
        };

        axios
            .post(API_URL + "?service.key=masterKey.tenantData", dataRequest)
            .then(response => {
                if (response.data.C_STATUS === "UNAUTHORIZED") {
                    console.log(`UNAUTHORIZED, please login.`);
                } else if (response.data.C_STATUS === "SUCCESS") {
                    if (response.data.C_DATA.processMap) {
                        setFilteredProcess(response.data.C_DATA.processMap);
                    } else {
                        console.log(
                            `Either dir.group does not exists or SQL query returns no result.`,
                        );
                    }
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    const handleSubmit = event => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
        } else if (form.checkValidity() === true) {
            setShow(prev => ({
                ...prev,
                showModal: false,
                selectedItem: {},
            }));

            if (show.mode === "addNew") {
                let _newAction = structuredClone(action);
                _newAction.id = `${uuidv4()}`;
                _newAction.code = `${uuidv4()}`;
                _newAction.label = "custom_action_field";
                // _newAction.db_column = "custom_action_field";
                setSelectedItem(prev => ({ ...prev, ..._newAction }));

                // handleClose();
            } else if (show.mode === "edit") {
                let _action = structuredClone(selectedItem);
                let _newAction = { ...action };
                _newAction = { ..._action, ...action };
                _newAction.label = "custom_action_field";
                // _newAction.db_column = "custom_action_field";

                setSelectedItem(prev => ({ ...prev, ..._newAction }));
            }
        }
        setValidated(true);
    };

    const handleInput = e => {
        const { name, value, checked } = e.target;
        if (name === "title" && action?.type === "custom") {
            setAction(prev => ({
                ...prev,
                [name]: value,
                code: value.toLowerCase(),
            }));
        } else if (
            name === "allow_refresh" ||
            name === "allow_create_col"
            // || name === "json_export"
        ) {
            setAction(prev => ({
                ...prev,
                [name]: checked,
            }));
        } else if (checked || name === "enable_modal") {
            setAction(prev => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setAction(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleProcessCategory = e => {
        try {
            setAction(prev => ({
                ...prev,
                process_category: e.target.value,
            }));
        } catch (error) {
            console.log(error);
        }
    };
    function defaultApiMethods() {
        const jsonData = appServiceKeysMapping[action.method].operation();

        setRequestMethods(appServiceMethods);
        return JSON.stringify(jsonData, null, 2);
    }
    const handleRadio = e => {
        let jsondata = "";
        const { name, value } = e.target;
        let _actions = { ...action };
        if (value === "URL") {
            _actions.form = "";
            _actions.emailkey = "";
            _actions.code = value;
        } else if (value === "FORM") {
            _actions.hyper_link = "";
            _actions.emailkey = "";
            _actions.code = value;
        } else if (value === "POST") {
            _actions.form = "";
            _actions.hyper_link = "";
            _actions.code = value;
            // jsondata = defaultApiMethods(value);
        } else if (value === "PROCESS") {
            _actions.hyper_link = "";
            _actions.emailkey = "";
            _actions.code = value;
            // jsondata = defaultApiMethods(value);
        }

        _actions = { ..._actions, [name]: value, post_json: jsondata };
        setAction(_actions);
    };

    const addHyperParameter = () => {
        const paramters = action?.hyper_parameters
            ? action?.hyper_parameters
            : [];
        const _hyper_parameters = [...paramters];
        const _hyperParam = { ...initialHyperParameters };
        _hyperParam.index = _hyper_parameters.length;
        _hyper_parameters.push(_hyperParam);
        setAction(prev => ({
            ...prev,
            hyper_parameters: _hyper_parameters,
        }));
    };

    const handleClose = () => {
        setShow(prev => ({
            ...prev,
            showModal: false,
            selectedItem: {},
        }));
        setHyperParam(initialHyperParameters);
        setAction(initialCustomActions);
    };

    const handleDesignJsonChange = value => {
        // let value = e.target.value;
        setAction(prev => ({
            ...prev,
            post_json: value,
        }));
    };

    const handleMethodAndJson = e => {
        const { name, value } = e.target;

        var data =
            action?.api_service === "APPSERVICE"
                ? appServiceKeysMapping[value].operation()
                : restApiMapping[value].operation();

        const jsondata = JSON.stringify(data, null, 2);
        const post_url =
            action?.api_service === "EXTERNAL"
                ? ""
                : API_URL + "?service.key=update.formData";

        setAction({
            ...action,
            [name]: value,
            post_json: jsondata,
            post_url: post_url,
        });
    };

    const handleApiAndJson = e => {
        const { name, value } = e.target;
        const url =
            value === "EXTERNAL"
                ? ""
                : API_URL + "?service.key=update.formData";
        setAction({
            ...action,
            [name]: value,
            post_json: "",
            method: "",
            post_url: url,
        });
    };

    const checkCondition = () => {
        let valid = false;
        if (
            action?.link_type === "POST" &&
            action?.api_service &&
            action?.method
        ) {
            valid = true;
        } else if (show && show.selectedItem && action?.link_type !== "POST") {
            valid = true;
        }
        return valid;
    };

    return (
        <div className="s2a-custom-actions-modal">
            <span onClick={() => setShow({ ...show, showModal: true })}>
                edit
            </span>
            <Modal
                show={show && show.showModal}
                onHide={handleClose}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                className="s2a-modal custom-action-modal"
                backdrop="static"
                keyboard={false}
                animation={true}
                fullscreen={toggleModalWindow === "maximize"}>
                <Modal.Header>
                    <Modal.Title
                        id="contained-modal-title-vcenter"
                        className="modal-title">
                        <span>Configure Action</span>
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
                    <Form
                        noValidate
                        validated={validated}
                        onSubmit={handleSubmit}>
                        <>
                            <Row className="mb-2">
                                <Form.Group
                                    className=""
                                    as={Col}
                                    sm="4"
                                    controlId="label">
                                    <Form.Label>Label</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder="Label"
                                        name="title"
                                        value={action?.title}
                                        onChange={handleInput}
                                    />
                                </Form.Group>
                                <Form.Group
                                    as={Col}
                                    sm="4"
                                    controlId="title">
                                    <Form.Label>Hover Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Title"
                                        name="list_title"
                                        value={action?.list_title}
                                        onChange={handleInput}
                                    />
                                </Form.Group>
                                <Form.Group
                                    as={Col}
                                    sm="4"
                                    controlId="show_as">
                                    <Form.Label>Link Show As</Form.Label>
                                    <Form.Select
                                        ect
                                        aria-label="Default select example"
                                        value={action?.show_as}
                                        onChange={e =>
                                            setAction(prev => ({
                                                ...prev,
                                                show_as: e.target.value,
                                            }))
                                        }>
                                        <option value={""}>
                                            Default Option
                                        </option>
                                        {["link", "button"].map(item => (
                                            <option
                                                key={item}
                                                value={item}
                                                className="text-capitalize">
                                                {item}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <>
                                    <Form.Group
                                        as={Col}
                                        sm="12"
                                        className="pt-3"
                                        controlId="link_type">
                                        <Form.Label className="me-2">
                                            Link Type:
                                        </Form.Label>
                                        {linkType.map((item, index) => (
                                            <>
                                                {item.code !== "PROCESS" &&
                                                    item.code !== "DATALIST" &&
                                                    item.code !== "POST" && (
                                                        <React.Fragment
                                                            key={index}>
                                                            <input
                                                                id={item.title}
                                                                className="form-check-input d-inline-flex me-2"
                                                                type="radio"
                                                                label={
                                                                    item.title
                                                                }
                                                                name="link_type"
                                                                value={
                                                                    item.code
                                                                }
                                                                checked={
                                                                    item.code ===
                                                                    action.link_type
                                                                }
                                                                onChange={e =>
                                                                    handleRadio(
                                                                        e,
                                                                        index,
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            <label
                                                                className="me-2"
                                                                htmlFor={
                                                                    item.title
                                                                }>
                                                                {item.title}
                                                            </label>
                                                        </React.Fragment>
                                                    )}
                                            </>
                                        ))}
                                    </Form.Group>
                                    {action?.link_type === "URL" && (
                                        <>
                                            <Form.Group
                                                as={Col}
                                                sm="6"
                                                controlId="HyperLink">
                                                <Form.Label>
                                                    Hyper Link
                                                </Form.Label>
                                                <Form.Control
                                                    required={
                                                        action?.link_type ===
                                                        "URL"
                                                    }
                                                    type="text"
                                                    placeholder="HyperLink"
                                                    name="hyper_link"
                                                    value={action?.hyper_link}
                                                    onChange={handleInput}
                                                />
                                            </Form.Group>
                                            <HyperTargetField
                                                action={action}
                                                hyperTargetOptions={
                                                    hyperTargetOptions
                                                }
                                                handleInput={handleInput}
                                                modalSizes={modalSizes}
                                                asidePositions={asidePositions}
                                            />
                                        </>
                                    )}
                                    {action?.link_type === "FORM" && (
                                        <>
                                            <Form.Group
                                                as={Col}
                                                sm="6"
                                                controlId="select_form">
                                                <Form.Label>
                                                    Select Form
                                                </Form.Label>
                                                <Form.Select
                                                    required={
                                                        action?.link_type ===
                                                        "FORM"
                                                            ? true
                                                            : false
                                                    }
                                                    type="text"
                                                    placeholder="Select form"
                                                    name="form"
                                                    value={action?.form}
                                                    onChange={handleInput}>
                                                    <option
                                                        key={0}
                                                        value="">
                                                        Default Option
                                                    </option>
                                                    {formList &&
                                                        formList.map(item => (
                                                            <option
                                                                key={item.id}
                                                                value={
                                                                    action?.link_type ===
                                                                    "FORM"
                                                                        ? item.form_key
                                                                        : ""
                                                                }>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                </Form.Select>
                                            </Form.Group>
                                            <HyperTargetField
                                                action={action}
                                                hyperTargetOptions={
                                                    hyperTargetOptions
                                                }
                                                handleInput={handleInput}
                                                modalSizes={modalSizes}
                                                asidePositions={asidePositions}
                                            />
                                        </>
                                    )}
                                    {action?.link_type === "POST" && (
                                        <>
                                            <Row className="mb-2 mt-2">
                                                {action?.link_type ===
                                                    "POST" && (
                                                    <Form.Group
                                                        as={Col}
                                                        sm="6"
                                                        controlId="api_service">
                                                        <Form.Label>
                                                            Api Service
                                                        </Form.Label>
                                                        <Form.Select
                                                            required={
                                                                action?.link_type ===
                                                                "POST"
                                                            }
                                                            type="text"
                                                            placeholder="method"
                                                            name="api_service"
                                                            value={
                                                                action?.api_service
                                                            }
                                                            onChange={
                                                                // handleInput
                                                                handleApiAndJson
                                                            }>
                                                            <option value="">
                                                                Select Api
                                                                Service
                                                            </option>
                                                            {apiServices.map(
                                                                (
                                                                    service,
                                                                    index,
                                                                ) => (
                                                                    <option
                                                                        value={
                                                                            service.code
                                                                        }
                                                                        key={
                                                                            index
                                                                        }>
                                                                        {
                                                                            service.title
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </Form.Select>
                                                    </Form.Group>
                                                )}
                                                {action?.api_service && (
                                                    <Form.Group
                                                        sm="6"
                                                        as={Col}
                                                        controlId="method">
                                                        <Form.Label>
                                                            Method
                                                        </Form.Label>
                                                        <Form.Select
                                                            required={
                                                                action?.link_type ===
                                                                "POST"
                                                            }
                                                            type="text"
                                                            placeholder="method"
                                                            name="method"
                                                            value={
                                                                action?.method
                                                            }
                                                            // onClick={
                                                            //     handleMethodAndJson
                                                            // }
                                                            onChange={
                                                                handleMethodAndJson
                                                            }>
                                                            {requestMethods.map(
                                                                (
                                                                    method,
                                                                    index,
                                                                ) => (
                                                                    <option
                                                                        value={
                                                                            method.code
                                                                        }
                                                                        key={
                                                                            index
                                                                        }>
                                                                        {
                                                                            method.title
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </Form.Select>
                                                    </Form.Group>
                                                )}
                                            </Row>
                                            {action?.api_service ===
                                                "EXTERNAL" &&
                                                action?.method && (
                                                    <Row className="mb-2 mt-2">
                                                        <Form.Group
                                                            as={Col}
                                                            sm="12"
                                                            controlId="post_url">
                                                            <Form.Label>
                                                                Post Url
                                                            </Form.Label>
                                                            <Form.Control
                                                                required={
                                                                    action?.link_type ===
                                                                        "POST" &&
                                                                    action?.api_service ===
                                                                        "EXTERNAL"
                                                                }
                                                                type="text"
                                                                placeholder="Enter post url"
                                                                name="post_url"
                                                                value={
                                                                    action?.post_url
                                                                }
                                                                onChange={
                                                                    handleInput
                                                                }
                                                            />
                                                        </Form.Group>
                                                    </Row>
                                                )}
                                        </>
                                    )}
                                    {action?.link_type === "PROCESS" && (
                                        <>
                                            <Form.Group
                                                as={Col}
                                                sm="6"
                                                controlId="selectcategory">
                                                <Form.Label>
                                                    Select Category
                                                </Form.Label>
                                                <Form.Select
                                                    required={
                                                        action?.link_type ===
                                                            "FORM" ||
                                                        action?.link_type ===
                                                            "PROCESS"
                                                            ? true
                                                            : false
                                                    }
                                                    type="text"
                                                    placeholder="Select Category"
                                                    name="process_category"
                                                    value={
                                                        action?.process_category
                                                    }
                                                    onChange={
                                                        handleProcessCategory
                                                    }>
                                                    <option
                                                        key={0}
                                                        value="">
                                                        Default Option
                                                    </option>
                                                    {processCategory &&
                                                        processCategory.map(
                                                            item => (
                                                                <option
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    value={
                                                                        action?.link_type ===
                                                                        "PROCESS"
                                                                            ? item.key
                                                                            : ""
                                                                    }>
                                                                    {item.title}
                                                                </option>
                                                            ),
                                                        )}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group
                                                as={Col}
                                                sm="6"
                                                controlId="selected_process">
                                                <Form.Label>
                                                    Select Process
                                                </Form.Label>
                                                <Form.Select
                                                    disabled={
                                                        action?.process_category
                                                            ? false
                                                            : true
                                                    }
                                                    required={
                                                        action?.link_type ===
                                                        "PROCESS"
                                                            ? true
                                                            : false
                                                    }
                                                    type="text"
                                                    placeholder="Select Process"
                                                    name="process_id"
                                                    value={action?.process_id}
                                                    onChange={handleInput}>
                                                    <option
                                                        key={0}
                                                        value="">
                                                        Default Option
                                                    </option>
                                                    {filteredProcess &&
                                                        filteredProcess.map(
                                                            item => (
                                                                <option
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    value={
                                                                        action?.link_type ===
                                                                        "PROCESS"
                                                                            ? item.id
                                                                            : ""
                                                                    }>
                                                                    {item.title}
                                                                </option>
                                                            ),
                                                        )}
                                                </Form.Select>
                                            </Form.Group>
                                            {action?.process_id && (
                                                <Form.Group
                                                    as={Col}
                                                    sm="12"
                                                    controlId="deploy_msg">
                                                    <Form.Label className="mt-2">
                                                        Confirm Message For
                                                        Process
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        disabled={
                                                            action?.process_category
                                                                ? false
                                                                : true
                                                        }
                                                        required={
                                                            action?.link_type ===
                                                            "PROCESS"
                                                                ? true
                                                                : false
                                                        }
                                                        placeholder="please enter confirm message"
                                                        name="deploy_msg"
                                                        value={
                                                            action?.deploy_msg
                                                        }
                                                        onChange={
                                                            handleInput
                                                        }></Form.Control>
                                                </Form.Group>
                                            )}
                                        </>
                                    )}
                                    {action?.link_type === "DATALIST" && (
                                        <>
                                            <Form.Group
                                                as={Col}
                                                sm="6"
                                                controlId="se">
                                                <Form.Label>
                                                    Select Datalist
                                                </Form.Label>
                                                <Form.Select
                                                    required={
                                                        action?.link_type ===
                                                        "DATALIST"
                                                            ? true
                                                            : false
                                                    }
                                                    type="text"
                                                    placeholder="Select Datalist"
                                                    name="datalist_id"
                                                    value={action?.datalist_id}
                                                    onChange={handleInput}>
                                                    <option
                                                        key={0}
                                                        value="">
                                                        Default Option
                                                    </option>
                                                    {dataList &&
                                                        dataList.map(item => (
                                                            <option
                                                                key={item.id}
                                                                value={
                                                                    action?.link_type ===
                                                                    "DATALIST"
                                                                        ? item.id
                                                                        : ""
                                                                }>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                </Form.Select>
                                            </Form.Group>
                                            <HyperTargetField
                                                action={action}
                                                hyperTargetOptions={hyperTargetOptions.filter(
                                                    option =>
                                                        option.code !==
                                                        "dialog",
                                                )}
                                                handleInput={handleInput}
                                                modalSizes={modalSizes}
                                                asidePositions={asidePositions}
                                            />
                                        </>
                                    )}
                                </>
                            </Row>
                            {checkCondition() && (
                                <Row className="mb-2">
                                    <Form.Label className="hyperlink-header">
                                        Hyperlink Parameters
                                    </Form.Label>
                                    <ActionParamTableForForm
                                        items={
                                            action && action?.hyper_parameters
                                        }
                                        action={action}
                                        setItems={setAction}
                                        setHyperParam={setHyperParam}
                                        hyperParam={hyperParam}
                                        selectedItem={selectedItem}
                                        item={action}
                                        appServiceKeysMapping={
                                            appServiceKeysMapping
                                        }
                                        fields={fields}
                                        page={page}
                                    />
                                    <div
                                        className="fa fa-plus hyper-addnew"
                                        onClick={() =>
                                            addHyperParameter()
                                        }></div>
                                </Row>
                            )}
                            {action?.link_type === "POST" && (
                                <>
                                    <Row className="mb-2">
                                        <Form.Group
                                            as={Col}
                                            sm="12"
                                            controlId="visibility_expression">
                                            <Form.Label className="d-flex justify-content-between">
                                                <span>Post Json</span>
                                                <span>
                                                    <RefreshButton
                                                        action={action}
                                                        handleInput={
                                                            handleInput
                                                        }
                                                    />
                                                </span>
                                            </Form.Label>
                                            <CodeMirror
                                                value={action?.post_json}
                                                height="100%"
                                                theme={"dark"}
                                                extensions={[
                                                    javascript({
                                                        jsx: true,
                                                    }),
                                                ]}
                                                onChange={(
                                                    value,
                                                    viewUpdate,
                                                ) => {
                                                    handleDesignJsonChange(
                                                        value,
                                                    );
                                                }}
                                            />
                                        </Form.Group>
                                    </Row>
                                </>
                            )}

                            <Row className="mb-2">
                                <Form.Group
                                    as={Col}
                                    sm="12"
                                    controlId="visibility_expression">
                                    <Form.Label>
                                        Visibility Expression
                                    </Form.Label>
                                    <Form.Control
                                        // required
                                        as="textarea"
                                        type="text"
                                        placeholder="visibility expression"
                                        name="visibility_expression"
                                        value={action?.visibility_expression}
                                        onChange={handleInput}
                                    />
                                </Form.Group>
                            </Row>
                            <Row className="mb-2">
                                <Form.Group
                                    as={Col}
                                    sm="12"
                                    controlId="confirmation_message">
                                    <div className="d-flex">
                                        <div className="enable-modal">
                                            <Form.Check
                                                className="form-check"
                                                type="checkbox"
                                                placeholder="enable_modal"
                                                name="enable_modal"
                                                value={action?.enable_modal}
                                                checked={action?.enable_modal}
                                                onChange={handleInput}
                                            />
                                        </div>
                                        <div className="confirmation-message">
                                            <Form.Label>
                                                Confirmation Message
                                            </Form.Label>
                                        </div>
                                    </div>
                                    {action?.enable_modal && (
                                        <Form.Control
                                            // required
                                            as="textarea"
                                            type="text"
                                            placeholder="Confirmation Message"
                                            name="confirmation_message"
                                            value={action?.confirmation_message}
                                            onChange={handleInput}
                                        />
                                    )}
                                </Form.Group>
                            </Row>
                        </>

                        <div className="custom-all-btn">
                            <div className="custom-btns">
                                <Button
                                    className="btn-sm button-theme me-2"
                                    type="submit">
                                    Ok
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    className="btn-sm button-theme">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

function HyperTargetField(props) {
    const {
        action,
        hyperTargetOptions,
        handleInput,
        modalSizes,
        asidePositions,
    } = props;

    return (
        <>
            <Form.Group
                as={Col}
                sm={action?.hyper_target === "dialog" ? "3" : "6"}
                controlId="HyperTarget">
                <Form.Label>Hyper Target</Form.Label>
                <Form.Select
                    aria-label="Hyper Target"
                    name="hyper_target"
                    required={
                        action?.link_type !== "POST" ||
                        action?.link_type !== "PROCESS"
                    }
                    value={action?.hyper_target}
                    onChange={handleInput}>
                    <option
                        key={0}
                        value="">
                        {/* disabled> */}
                        Default Option
                    </option>
                    {hyperTargetOptions.map(item => (
                        <>
                            {action.link_type == "URL" &&
                            item.code !== "dialog" ? (
                                <option
                                    key={item.code}
                                    value={item.code}>
                                    {item.title}
                                </option>
                            ) : action.link_type !== "URL" ? (
                                <option
                                    key={item.code}
                                    value={item.code}>
                                    {item.title}
                                </option>
                            ) : null}
                        </>
                    ))}
                </Form.Select>
            </Form.Group>
            {action?.hyper_target === "dialog" && action && (
                <Form.Group
                    as={Col}
                    sm="3"
                    controlId="HyperTargetSize">
                    <Form.Label>Hyper Target Size</Form.Label>
                    <Form.Select
                        aria-label="HyperTargetSize"
                        name="modal_size"
                        value={action?.modal_size}
                        onChange={handleInput}>
                        <option
                            key={0}
                            value="">
                            Default Option
                        </option>
                        {modalSizes.map(item => (
                            <option
                                key={item.code}
                                value={item.code}>
                                {item.title}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
            )}
            {/* {action?.hyper_target === "aside" && action && (
                <>
                    <Form.Group
                        as={Col}
                        sm="6"
                        controlId="aside_position">
                        <Form.Label>Aside Position</Form.Label>
                        <Form.Select
                            aria-label="aside_position"
                            name="aside_position"
                            value={action?.aside_position}
                            onChange={handleInput}>
                            <option
                                key={0}
                                value="">
                                Default Option
                            </option>
                            {asidePositions.map(item => (
                                <option
                                    key={item.code}
                                    value={item.code}>
                                    {item.title}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    {(action?.aside_position === "left" ||
                        action?.aside_position === "right") && (
                        <Form.Group
                            as={Col}
                            sm="6"
                            controlId="datalist_aside_width">
                            <Form.Label>Datalist inline width</Form.Label>
                            <Form.Select
                                aria-label="datalist_aside_width"
                                name="datalist_aside_width"
                                value={action?.datalist_aside_width}
                                onChange={handleInput}>
                                <option
                                    key={0}
                                    value="">
                                    Default Option
                                </option>
                                {[25, 50, 75].map(item => (
                                    <option
                                        key={item}
                                        value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                </>
            )} */}
        </>
    );
}

function RefreshButton(props) {
    const { action, handleInput } = props;
    return (
        <div className="d-flex">
            <span className="me-2">
                <Form.Check
                    aria-label="Hyper Target"
                    name="allow_refresh"
                    checked={action?.allow_refresh}
                    value={action?.allow_refresh}
                    onChange={handleInput}></Form.Check>
            </span>
            <span>Allow Refresh {action?.allow_refresh}</span>
        </div>
    );
}

CustomActionForForms.defaultProps = {
    linkType: [
        { code: "URL", title: "Url", selected: false },
        { code: "FORM", title: "Form", selected: false },
        { code: "POST", title: "Post", selected: false },
        { code: "PROCESS", title: "Process", selected: false },
    ],
    formList: [],
    processCategory: [],
    dataList: [],
};
