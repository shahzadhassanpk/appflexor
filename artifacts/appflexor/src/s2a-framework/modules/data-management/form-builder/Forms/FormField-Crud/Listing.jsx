import { useContext } from "react";
import { ListGroup } from "react-bootstrap";
import FieldContext from "./FieldContext";

export default function Listing() {
    const fieldContext = useContext(FieldContext);
    const { items, updateModal, setSelectedItem, setItems } = fieldContext;

    const handleEdit = (item, index) => {
        setSelectedItem(item);
        updateModal();
    };

    const handleDelete = id => {
        const _items = items.filter(item => item.id !== id);
        setItems(_items);
    };
    return (
        <div className="s2a-formfield-listing">
            <ListGroup>
                {items.map((item, i) => (
                    <ListGroup.Item key={i}>
                        <div className="d-flex justify-content-between">
                            <span>
                                <span
                                    className={`${item?.component?.icon} me-2`}></span>
                                <label>{item.component.title}</label>
                            </span>
                            <span>
                                <i className="fa-solid fa-gear me-2"></i>
                                <i
                                    className="fa-regular fa-pen-to-square me-2 button-theme"
                                    onClick={() => handleEdit(item, i)}></i>

                                <i
                                    className="fa-regular fa-trash-can"
                                    onClick={() => handleDelete(item.id)}></i>
                            </span>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
}
