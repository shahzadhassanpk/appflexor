/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

/**
 * Adds form-specific CSS from the persisted component data.
 * The marker is visible only in the designer so the component can be selected
 * and configured without adding content to preview or rendered forms.
 */
function CustomCSS({
    component,
    mode,
    modeType,
    setComponentPropsData,
}) {
    const css = component?.data?.css || "";
    const isDesignMode = mode === modeType?.design;
    const [showEditor, setShowEditor] = useState(false);
    const [draftCSS, setDraftCSS] = useState(css);

    useEffect(() => {
        setDraftCSS(css);
    }, [css]);

    const saveCSS = () => {
        setComponentPropsData(
            {
                ...component.data,
                css: draftCSS,
            },
            component,
        );
        setShowEditor(false);
    };

    return (
        <>
            {css && (
                <style
                    data-s2a-form-css={component.id}
                    type="text/css">
                    {css}
                </style>
            )}
            {isDesignMode && (
                <>
                    <div
                        className="d-flex align-items-center justify-content-between gap-3 py-2 px-3 mb-0"
                        role="status">
                        <div>
                            <span
                                className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                                onClick={() => setShowEditor(true)}></span>
                            <i
                                className="fa-brands fa-css3-alt me-2"
                                aria-hidden="true"
                            />
                            <span className="fw-semibold">Custom CSS</span>
                            <small className="d-block text-muted">
                                {css
                                    ? "Styles are active in the designer and rendered form."
                                    : "No custom CSS has been added yet."}
                            </small>
                        </div>
                        {/* <Button
                            type="button"
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => setShowEditor(true)}>
                            <i className="fa-solid fa-pen me-1" aria-hidden="true" />
                            Edit CSS
                        </Button> */}
                    </div>

                    <Modal
                        className="s2a-modal"
                        show={showEditor}
                        onHide={() => setShowEditor(false)}
                        size="lg"
                        centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Custom CSS</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId={`custom-css-${component.id}`}>
                                <Form.Label>CSS</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={14}
                                    value={draftCSS}
                                    onChange={event =>
                                        setDraftCSS(event.target.value)
                                    }
                                    placeholder={".my-form-class {\n    color: #212529;\n}"}
                                    spellCheck="false"
                                    className="font-monospace"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowEditor(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="button-theme"
                                onClick={saveCSS}>
                                Apply CSS
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </>
    );
}

export default CustomCSS;
