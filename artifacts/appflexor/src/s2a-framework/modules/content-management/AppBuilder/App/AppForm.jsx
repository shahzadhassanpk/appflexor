import React, { forwardRef, useImperativeHandle } from "react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { getData, handleSave } from "./helpers";
import { API_URL } from "../../../../Config";
import { useContext } from "react";
import AppBuilderContext from "./AppBuilderContext";
import { useEffect } from "react";
import { toastEmitter } from "../../../../components/Toastify/Toastify";
const AppForm = props => {
    const appBuilderContext = useContext(AppBuilderContext);
    const {
        items,
        setItems,
        closeModal,
        selectedItem,
        setSelectedItem,
        selectedChannelId,
    } = appBuilderContext;
    const initialState = {
        id: "",
        title: "",
        description: "",
        site_id: selectedChannelId,
    };
    const [input, setInput] = useState(initialState);
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        if (selectedItem.update) {
            setInput(selectedItem.item);
            setSelectedItem({ item: {}, update: false });
        }
    }, [selectedItem?.update]);

    const handleSubmit = event => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        if (form.checkValidity() === false) {
        } else {
            saveApp();
            closeModal();
        }

        setValidated(true);
    };

    const handleInput = e => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    const saveApp = async () => {
        let saveObj = {
            entity: "app_builder",
            datasource: "",
            url: API_URL + `?service.key=update.formData`,
            formData: input,
        };
        var savedData = await handleSave(saveObj);
        if (savedData.status === 200) {
            let obj = savedData.data.C_DATA[0].formData;
            setInput(initialState);
            let _arr = [...items];
            let status = "";
            if (input.id === "" || input.id === "new") {
                status = "Save";
                _arr.push(obj);
            } else {
                status = "Update";

                let i = _arr.findIndex(item => item.id === obj.id);
                _arr[i] = obj;
            }
            setItems(_arr);
            toastEmitter(`App ${status} Successfully`, true);
        }
    };

    return (
        <Form
            noValidate
            validated={validated}
            onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Form.Group
                    className="mb-3"
                    as={Col}
                    md="12"
                    controlId="validationCustom01">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="Title"
                        name="title"
                        value={input.title}
                        onChange={handleInput}
                    />
                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                </Form.Group>
                <Form.Group
                    as={Col}
                    md="12"
                    controlId="validationCustom02">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        type="text"
                        placeholder="Description"
                        name="description"
                        value={input.description}
                        onChange={handleInput}
                    />
                    <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                </Form.Group>
            </Row>

            <Button
                className="btn btn-sm button-theme float-end"
                type="submit">
                Save
            </Button>
        </Form>
    );
};

export default AppForm;
