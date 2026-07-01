import { useContext } from "react";
import { useState } from "react";
import FieldContext from "./FieldContext";
import { useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { SIDEBAR_ITEMS, componentList } from "../../Designer/ComponentRegistry";

export default function FieldForm(props) {
    const { handleClose, update, setUpdate } = props;
    const initailState = {
        id: "",
        title: "",
        type: "",
        icon: "",
    };
    const [input, setInput] = useState(initailState);
    const [validated, setValidated] = useState(false);
    const Types = Object.keys(componentList);
    const fieldContext = useContext(FieldContext);
    const { setItems, items, selectedItem } = fieldContext;

    useEffect(() => {
        if (update) {
            handleEdit();
        }
    }, [update]);

    const handleSubmit = event => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        if (form.checkValidity() === true) {
            if (update) {
                const _items = [...items];
                _items.forEach(item => {
                    if (item.id === input.id) {
                        item.component.title = input.title;
                        item.component.icon = input.icon;
                        item.component.type = input.type;
                    }
                });
                setItems(_items);
            } else {
                let item = SIDEBAR_ITEMS.find(
                    item => item.component.type === input.type,
                );
                let _item = structuredClone(item);
                if (_item) {
                    _item.component.icon = input.icon
                        ? input.icon
                        : _item.component.icon;
                    _item.component.title = input.title;
                    _item.id = items.length;
                    setItems([...items, _item]);
                }
            }
            handleClose();
        } else {
        }

        setValidated(true);
    };
    const handleInput = e => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
    };

    const handleEdit = () => {
        const obj = {
            id: selectedItem.id,
            title: selectedItem.component.title,
            icon: selectedItem.component.icon,
            type: selectedItem.component.type,
        };
        setInput(obj);
        // setUpdate(true);
    };

    return (
        <Form
            className="s2a-field-form"
            noValidate
            validated={validated}
            onSubmit={handleSubmit}>
            <Row className="mb-3">
                <Form.Group
                    as={Col}
                    sm="12"
                    controlId="1">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="Title"
                        name="title"
                        value={input.title}
                        onChange={handleInput}
                    />
                </Form.Group>
                <Form.Group
                    as={Col}
                    sm="12"
                    controlId="2">
                    <Form.Label>Types</Form.Label>
                    <Form.Select
                        required
                        name="type"
                        value={input.type}
                        onChange={handleInput}
                        aria-label="Default Type">
                        <option value={""}>select type</option>
                        {Types.map((type, i) => (
                            <option
                                value={type}
                                key={i}>
                                {type}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group
                    as={Col}
                    sm="12"
                    controlId="3">
                    <Form.Label>Icon</Form.Label>
                    <Form.Control
                        type="text"
                        name="icon"
                        value={input.icon}
                        onChange={handleInput}
                    />
                </Form.Group>
            </Row>
            <Button
                type="submit"
                className="btn btn-sm button-theme float-end">
                {update ? "Update" : "Save"}
            </Button>
        </Form>
    );
}
