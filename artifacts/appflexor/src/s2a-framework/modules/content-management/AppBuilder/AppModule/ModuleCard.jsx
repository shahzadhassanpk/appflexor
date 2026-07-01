import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ModuleContext from "./ModuleContext";
import { useContext, useState } from "react";
import { handleDelete } from "../App/helpers";
import { API_URL } from "../../../../Config";
import AppBuilderContext from "../App/AppBuilderContext";
import ModalBox from "../../../../components/Modal/Modal";

function ModuleCard(props) {
    const { title, description, id, setChildInput, item } = props;

    const moduleContext = useContext(ModuleContext);

    const appBuilderContext = useContext(AppBuilderContext);

    const {
        setShowModuleConfig,
        breadCrumbs,
        setBreadCrumbs,
        setMissingExportNames,
    } = appBuilderContext;

    const { handleEdit, fetchModules } = moduleContext;

    const initialState = {
        item: {},
        show: false,
        message: "Are you sure to delete this item",
    };

    const [modalState, setModalState] = useState(initialState);

    const selectedItem = item => {
        handleEdit(item);
    };

    const deleteItem = async (item, condition) => {
        if (condition) {
            let arr = [];
            arr.push(item.id);
            const obj = {
                url: API_URL + `?service.key=update.formData`,
                entity: "app_builder_module",
                datasource: "",
                arr,
            };
            await handleDelete(obj);
            fetchModules();
            setMissingExportNames({});
        } else {
            setModalState({ ...modalState, show: true, item: item });
        }
    };

    const handleSwitch = item => {
        setShowModuleConfig(true);
        setChildInput(item);
        if (breadCrumbs && breadCrumbs.length > 1) {
            let _crumbs = [...breadCrumbs];
            _crumbs.pop();
            _crumbs.push(item);
            setBreadCrumbs(_crumbs);
        } else {
            let _crumbs = [...breadCrumbs];
            _crumbs.push(item);
            setBreadCrumbs(_crumbs);
        }
        // const _crumbs = [...breadCrumbs];
    };

    return (
        <>
            <ModalBox
                state={modalState}
                header={title}
                modalType="app_module"
                setState={setModalState}
                operation={deleteItem}
            />
            <Card className="module-card">
                <Card.Img
                    className="card-img"
                    variant="top"
                    src="https://tse1.mm.bing.net/th?id=OIP.9CogbbDTM9qJfB3cBCYphwHaE8&pid=Api&rs=1&c=1&qlt=95&w=177&h=118"
                />
                <Card.Body className="card-body">
                    <h6
                        className="title"
                        onClick={() => handleSwitch(item)}>
                        {title ? title : ""}
                    </h6>
                    <div
                        className="description enable-scroll"
                        onClick={() => handleSwitch(item)}>
                        {description ? description : ""}
                    </div>
                    <div className="mt-2 float-end">
                        <i
                            className="fa-regular fa-pen-to-square me-2"
                            onClick={() => selectedItem(item)}></i>
                        <i
                            className="fa-regular fa-trash-can table-del-font"
                            onClick={() => deleteItem(item)}></i>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
}

export default ModuleCard;
