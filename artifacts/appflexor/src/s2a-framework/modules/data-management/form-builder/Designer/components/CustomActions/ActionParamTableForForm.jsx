import { useState, useEffect } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";

export default function ActionParamTableForForm(props) {
    const {
        items,
        setItems,
        setHyperParam,
        selectedItem,
        action,
        appServiceKeysMapping,
        fields,
        page,
    } = props;
    const [selectedFieldsData, setSelectedFieldsData] = useState(fields);

    useEffect(() => {
        if (fields && fields.length > 0) {
            let _noAction = fields.filter(function (el) {
                return el.type!=='action' && el.type !== "imageview";
              })
            if (selectedItem?.type === "FORM") {
                let id = {
                    id: -1,
                    db_column: "id",
                    label: "id",
                    selected: false,
                    disabled: false,
                    include: true,
                    isHtml: false,
                    isFilter: false,
                    serviceParam: false,
                    expression: "",
                    type: "text",
                };
                let arr = [..._noAction, id];
                setSelectedFieldsData(arr);
            } else {
                setSelectedFieldsData(_noAction);
            }
        }
    }, [fields]);

    const handleInput = (e, index, item) => {
        const { name, value } = e.target;
        const _items = structuredClone(items);
        let selectedItem = { ..._items[index] };
        selectedItem = { ...selectedItem, [name]: value };
        let updateSelectedItem = { ...selectedItem };
        _items[selectedItem.index] = updateSelectedItem;
        setItems(prev => ({
            ...prev,
            hyper_parameters: _items,
        }));
    };

    const editItem = (e, item, index) => {
        const _items = structuredClone(items);
        let selectedItem = _items[item.index];
        setHyperParam(selectedItem);
    };

    const deleteItem = item => {
        const _items = structuredClone(items);
        const filteredItems = _items.filter(
            element => element.index !== item.index,
        );
        filteredItems.map((item, index) => {
            item.index = index;
            return item;
        });
        if (action && action.api_service === "APPSERVICE") {
            var jsonData =
                action.post_json && typeof action.post_json === "string"
                    ? JSON.parse(action.post_json)
                    : action.post_json;

            jsonData.data[0].formData =
                typeof jsonData.data[0].formData === "string"
                    ? JSON.parse(jsonData.data[0].formData)
                    : jsonData.data[0].formData;
            let obj = {};
            filteredItems.forEach(parameter => {
                if (action.method === "post") {
                    obj[parameter.parameter_name] = parameter.column_name;
                    obj["id"] = "new";
                    jsonData.data[0].id = "new";
                } else if (action.method === "update") {
                    obj[parameter.parameter_name] = parameter.column_name;
                } else {
                    jsonData.data[0].id = parameter.column_name;
                }
            });
            jsonData.data[0].formData = obj;
        }
        if (action.api_service === "APPSERVICE") {
            if (filteredItems && filteredItems.length > 0) {
                setItems(prev => ({
                    ...prev,
                    hyper_parameters: filteredItems,
                    post_json: JSON.stringify(jsonData, null, 2),
                }));
            } else {
                const defaultJson =
                    appServiceKeysMapping[action.method].operation();
                setItems(prev => ({
                    ...prev,
                    hyper_parameters: filteredItems,
                    post_json: JSON.stringify(defaultJson, null, 2),
                }));
            }
        } else {
            setItems(prev => ({
                ...prev,
                hyper_parameters: filteredItems,
            }));
        }
    };

    const handleJsonFormat = () => {
        let jsonData = jsonCreate(action, items);
        setItems({
            ...action,
            post_json: JSON.stringify(jsonData, null, 2),
        });
    };

    function jsonCreate(action, items) {
        let jsonData =
            action.post_json && typeof action.post_json === "string"
                ? JSON.parse(action.post_json)
                : action.post_json;

        jsonData.data[0].formData =
            typeof jsonData.data[0].formData === "string"
                ? JSON.parse(jsonData.data[0].formData)
                : jsonData.data[0].formData;
        items.forEach(parameter => {
            if (action.method === "post") {
                jsonData.data[0].formData[parameter.parameter_name] =
                    parameter.column_name;
                jsonData.data[0].formData["id"] = "new";
                jsonData.data[0].id = "new";
            } else if (action.method === "update") {
                jsonData.data[0].formData[parameter.parameter_name] =
                    parameter.column_name;
            } else {
                jsonData.data[0].id = parameter.column_name;
            }
        });
        return jsonData;
    }

    return (
        <div className="col-sm-12 px-1 s2a-action-param">
            <Table className="s2a-table table-bordered table-hover mb-0">
                <Thead className="thead">
                    <Tr className="tableHeader">
                        <Th className="col-sm-5 table-row text-left">
                            PARAMETER NAME
                        </Th>
                        <Th className="col-sm-5 table-row text-left">
                            COLUMN NAME
                        </Th>
                        <Th className="col-sm-2 table-row text-left"></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {items &&
                        items.map((item, index) => {
                            return (
                                <Tr key={item.id}>
                                    <Td className="col-sm-5 table-row text-left">
                                        <input
                                            className="form-control"
                                            name="parameter_name"
                                            value={item.parameter_name}
                                            onClick={e =>
                                                editItem(e, item, index)
                                            }
                                            onChange={e =>
                                                handleInput(e, index, item)
                                            }
                                        />
                                    </Td>
                                    {!page ? (
                                        <Td className="col-sm-5 table-row text-left">
                                            <select
                                                className="form-select"
                                                name="column_name"
                                                value={item.column_name}
                                                onClick={e =>
                                                    editItem(e, item, index)
                                                }
                                                onBlur={() =>
                                                    handleJsonFormat(item)
                                                }
                                                onChange={e =>
                                                    handleInput(e, index, item)
                                                }>
                                                <option value="">
                                                    Default Option
                                                </option>
                                                {selectedFieldsData.map(
                                                    (field, index) => {
                                                        let notInclude = {
                                                            datecreated: false,
                                                            datemodified: false,
                                                            createdby: false,
                                                            modifiedby: false,
                                                        };
                                                        let notRequired =
                                                            notInclude[
                                                                field.db_column
                                                            ];
                                                        if (
                                                            notRequired ===
                                                            undefined
                                                        )
                                                            return (
                                                                <option
                                                                    key={index}
                                                                    value={
                                                                        field.db_column
                                                                    }>
                                                                    {
                                                                        field.label
                                                                    }{" "}
                                                                    {`(${field.db_column})`}
                                                                </option>
                                                            );
                                                    },
                                                )}
                                            </select>
                                        </Td>
                                    ) : (
                                        <Td>
                                            <input
                                                className="form-control"
                                                name="column_name"
                                                value={item.column_name}
                                                onClick={e =>
                                                    editItem(e, item, index)
                                                }
                                                onChange={e =>
                                                    handleInput(e, index, item)
                                                }
                                            />
                                        </Td>
                                    )}
                                    <Td className="col-sm-2 table-row text-left">
                                        <span
                                            className="table-del-font"
                                            title="Delete"
                                            onClick={() => deleteItem(item)}>
                                            <i className="fa-regular fa-trash-can"></i>
                                        </span>
                                    </Td>
                                </Tr>
                            );
                        })}
                </Tbody>
            </Table>
        </div>
    );
}

ActionParamTableForForm.defaultProps = {
    selectedItem: [],
    fields: [],
};
