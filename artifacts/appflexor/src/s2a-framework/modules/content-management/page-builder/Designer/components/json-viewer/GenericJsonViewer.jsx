import React, { useState } from "react";
import { Card, Form, Row, Col } from "react-bootstrap";

const GenericJsonViewer = props => {
    const {
        data = {},
        label = "JSON Viewer",
        onChange,
        fieldTypeMap = {},
    } = props;
    const [jsonData, setJsonData] = useState(data || {});

    const handleChange = (path, value) => {
        const newData = { ...jsonData };
        let obj = newData;
        const keys = path.split(".");

        // Traverse the object to update nested field
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;

        setJsonData(newData);
        if (onChange) onChange(newData);
    };

    const renderField = (key, value, path = "") => {
        const fieldPath = path ? `${path}.${key}` : key;

        if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        ) {
            // Render nested object
            return (
                <Card
                    className="mb-3"
                    key={fieldPath}>
                    <Card.Header className="fw-bold">{key}</Card.Header>
                    <Card.Body>
                        {Object.entries(value).map(([k, v]) =>
                            renderField(k, v, fieldPath),
                        )}
                    </Card.Body>
                </Card>
            );
        }

        // Determine input type
        const inputType = fieldTypeMap[key] || "text";

        return (
            <Form.Group
                as={Row}
                className="mb-2"
                key={fieldPath}>
                <Form.Label
                    column
                    sm={4}
                    className="text-capitalize">
                    {key.replace(/_/g, " ")}
                </Form.Label>
                <Col sm={8}>
                    <Form.Control
                        type={inputType}
                        value={value || ""}
                        onChange={e => handleChange(fieldPath, e.target.value)}
                    />
                </Col>
            </Form.Group>
        );
    };

    return (
        <Card className="shadow-sm mb-4">
            <Card.Header className="fw-bold">{label}</Card.Header>
            <Card.Body>
                <Form>
                    {Object.keys(jsonData).map(([key, value]) =>
                        renderField(key, value),
                    )}
                </Form>
            </Card.Body>
        </Card>
    );
};

export default GenericJsonViewer;
