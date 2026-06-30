import React from "react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { handleSave } from "../App/helpers";
import { useContext } from "react";
import ModuleContext from "./ModuleContext";
import { API_URL } from "../../../../Config";

function ModuleForm() {
    const moduleContext = useContext(ModuleContext);
    const { items, setItems, input, setInput, initialState, handleClose } =
        moduleContext;
    const [validated, setValidated] = useState(false);

    const handleSubmit = event => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        if (form.checkValidity() === false) {
        } else {
            saveApp(input);
            handleClose();
        }

        setValidated(true);
    };

    const handleInput = e => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    const saveApp = async input => {
        let saveObj = {
            entity: "app_builder_module",
            datasource: "",
            url: API_URL + `?service.key=update.formData`,
            formData: input,
        };
        var savedData = await handleSave(saveObj);
        if (savedData.status === 200) {
            let obj = savedData.data.C_DATA[0].formData;
            setInput(initialState);
            let _arr = [...items];
            if (input?.id === "" || input?.id === "new") {
                _arr.push(obj);
            } else {
                let i = _arr.findIndex(item => item.id === obj.id);
                _arr[i] = obj;
            }
            setItems(_arr);
        }
    };

    const handleImage = e => {
        const { name, value, files } = e.target;
        const fileLoad = files[0];
        const fileReader = new FileReader();

        fileReader.onload = loadedFile => {
            let result = loadedFile.target.result;
        };
    };

    return (
        <div>
            <Form
                noValidate
                validated={validated}
                onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Form.Group
                        className="mb-3"
                        as={Col}
                        sm="12"
                        controlId="validationCustom01">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder="Title"
                            name="title"
                            value={input?.title}
                            onChange={handleInput}
                        />
                        <Form.Control.Feedback>
                            Looks good!
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group
                        className="mb-3"
                        as={Col}
                        sm="12"
                        controlId="validationCustom02">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            required
                            as="textarea"
                            type="text"
                            placeholder="Description"
                            name="description"
                            value={input?.description}
                            onChange={handleInput}
                        />
                        <Form.Control.Feedback>
                            Looks good!
                        </Form.Control.Feedback>
                    </Form.Group>
                    {/* <Form.Group
                        as={Col}
                        md="12"
                        controlId="validationCustom03">
                        <Form.Label>Image</Form.Label>
                        <Form.Control
                            type="file"
                            placeholder="Select Image"
                            name="module_img"
                            value={input.module_img}
                            onChange={e => handleImage(e)}
                        />
                        <Form.Control.Feedback>
                            Looks good!
                        </Form.Control.Feedback>
                    </Form.Group> */}
                </Row>
                <Button
                    type="submit"
                    className="btn btn-sm button-theme float-end">
                    Save
                </Button>
            </Form>
        </div>
    );
}

export default ModuleForm;
