import React, { useContext, useEffect, useState } from "react";
import CustomActionForForms from "./CustomActions";
import { getData } from "../../../../../../components/CrudApiCall";
import useLogger from "../../../../../../components/hooks/useLogger";
import {
    checkObject,
    returnPageParams,
    returnParams,
} from "../../../../../content-management/page-builder/datalist-viewer/datalist-helper/DatalistHelpers";
import RenderCustomActions from "../../../../../content-management/page-builder/datalist-viewer/custom-actions-renderer/RenderCustomActions";
import { v4 as uuid } from "uuid";
import { AppContext } from "../../../../../../../AppContext";

const CustomActionsPropEditer = props => {
    const [forms, setForms] = useState([]);
    const [datalists, setDatalists] = useState([]);
    const [processCategorys, setProcessCategorys] = useState([]);
    const [instances, setInstances] = useState([]);
    const [selectedItem, setSelectedItem] = useState({});
    const [show, setShow] = useState({
        showModal: false,
        selectedItem: {},
        mode: "addNew",
    });
    const [components, setComponents] = useState([]);
    const selectedAction = props.component.data;
    const data = props.formData;
    const [linkTypes, setLinkTypes] = useState([
        { code: "URL", title: "Url", selected: false },
        { code: "FORM", title: "Form", selected: false },
        { code: "POST", title: "Post", selected: false },
        { code: "PROCESS", title: "Process", selected: false }
    ]);
    const keys = [
        {
            serviceParams: "",
            dataKey: "formList",
            serviceKey: "sys.datalist.forms",
            mode: "formData",
        },
        {
            serviceParams: "",
            dataKey: "dataList",
            serviceKey: "sys.datalist.list",
            mode: "formData",
        },
        {
            serviceParams: "",
            dataKey: "instance",
            serviceKey: "sys.module.instances",
            mode: "formData",
        },
        {
            serviceParams: "",
            dataKey: "processCategory",
            serviceKey: "process.category",
            mode: "formData",
        },
    ];
    const appContext = useContext(AppContext);
    const page = props?.component?.props[0] === "page";

    useEffect(() => {
        const comps = props?.components;
        if (comps) {
            const newComps = [];
            for (let id in comps) {
                const comp = comps[id];
                const data = comp.data;
                const newComp = {
                    id: comp.id,
                    type: comp.type,
                    label: data.label,
                    db_column: data.db_column,
                };
                newComps.push(newComp);
            }
            newComps.push({
                id: -1,
                type: "textfield",
                label: "id",
                db_column: "id",
            });
            setComponents(newComps);
        }
    }, [props?.components]);

    useEffect(() => {
        if (show.showModal) {
            fetchData();
            const component = props.component;
            if (component.data) {
                setSelectedItem(component.data);
                setShow({ ...show, mode: "edit" });
            }
        }
    }, [show.showModal]);

    useEffect(() => {
        const component = props.component;
        if (checkObject(selectedItem)) {
            props.setComponentPropsData(selectedItem, component);
        }
    }, [selectedItem]);

    async function fetchData() {
        const res = await getData({ keys });
        if (res.data.C_STATUS === "SUCCESS") {
            const data = res.data.C_DATA;
            setForms(data.formList);
            setDatalists(data.dataList);
            setProcessCategorys(data.processCategory);
            setInstances(data.instance);
            // setForm(data.form);
        }
    }

    // const handleActions = () => {
    //     setShow(false);
    // };

    useEffect(() => {
        const component = props.component;
        if (checkObject(selectedItem)) {
            props.setComponentPropsData(selectedItem, component);
        }
    }, [selectedItem]);

    if (props.mode === props.modeType.design)
        return (
            <>
                {show.showModal && (
                    <CustomActionForForms
                        show={show}
                        setShow={setShow}
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        formList={forms}
                        linkType={linkTypes}
                        processCategory={processCategorys}
                        dataList={datalists}
                        fields={components}
                        page={page}
                    />
                )}
                <div className="d-flex justify-content-center align-items-center h-100">
                    <span
                        className="m-2 fa-regular fa-pen-to-square mx-1 pointer"
                        onClick={() =>
                            setShow({ ...show, showModal: true })
                        }></span>
                    {props?.component?.data?.title
                        ? props?.component?.data?.title
                        : "Create Action"}
                </div>
            </>
        );
    else if (
        props.mode === props.modeType.render ||
        props.mode === props.modeType.preview
    )
        return (
            <>
                <label></label>
                <RenderCustomActions
                    item={selectedAction}
                    params={
                        page
                            ? returnPageParams(selectedAction, appContext)
                            : returnParams(selectedAction, data, appContext)
                    }
                    record={data}
                    handleActions={() => setShow(false)}
                    i={uuid()}
                    getData={getData}
                    page={page}
                />
            </>
        );
};

export default CustomActionsPropEditer;
