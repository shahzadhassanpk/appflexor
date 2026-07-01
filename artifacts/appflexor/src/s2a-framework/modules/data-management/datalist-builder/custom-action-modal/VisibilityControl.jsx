import { Table, Thead, Tbody, Tr, Th, Td } from "react-super-responsive-table";

export default function VisibilityControl(props) {
    const { items, setItems, setHyperParam, hyperParam, selectedItem } = props;

    const joinTypeArray = [
        { code: "&&", label: "And" },
        { code: "||", label: "Ors" },
    ];

    const operatorType = [
        { code: "===", label: "Equal" },
        { code: "!==", label: "Not Equal" },
        { code: ">", label: "Greater Than" },
        { code: ">=", label: "Greater Than Or Equal" },
        { code: "<=", label: "Less Than" },
        // { code: "", label: "Like" },
        // { code: "||", label: "Not Like" },
        // { code: "||", label: "In" },
        // { code: "||", label: "Not In" },
        { code: "||", label: "Is True" },
        { code: "||", label: "Is False" },
        { code: "||", label: "Is Empty" },
        // { code: "||", label: "Is Not Empty" },
        // { code: "||", label: "Regex" },
        // { code: "||", label: "Not Regex" },
    ];

    const handleInput = (e, index) => {
        const { name, value } = e.target;
        const _items = structuredClone(items);
        let selectedItem = { ..._items[index] };
        selectedItem = { ...selectedItem, [name]: value };
        let updateSelectedItem = { ...selectedItem };
        _items[selectedItem.index] = updateSelectedItem;
        setItems(prev => ({
            ...prev,
            visibility_control: _items,
        }));
    };

    const editItem = (item, index) => {
        const _items = structuredClone(items);
        let selectedItem = _items[item.index];
        setHyperParam(selectedItem);
    };

    const deleteItem = item => {
        const _items = structuredClone(items);
        setItems(prev => ({
            ...prev,
            visibility_control: _items.filter(
                element => element.index !== item.index,
            ),
        }));
    };

    return (
        <div className="col-sm-12 p-0 s2a-visibility-control">
            <Table className="s2a-table table-bordered table-hover mb-0">
                <Thead className="thead">
                    <Tr className="tableHeader">
                        <Th className="col-sm-2 table-row text-left">
                            Join Type
                        </Th>
                        <Th className="col-sm-2 table-row text-left">Field</Th>
                        <Th className="col-sm-2 table-row text-left">
                            Column Name
                        </Th>
                        <Th className="col-sm-2 table-row text-left">Value</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {items &&
                        items.map((item, index) => {
                            return (
                                <Tr key={item.id}>
                                    <Td className="col-sm-2 table-row text-left">
                                        <select
                                            className="form-select"
                                            name="join_type"
                                            value={item.join_type}
                                            onClick={item =>
                                                editItem(item, index)
                                            }
                                            onChange={e =>
                                                handleInput(e, index)
                                            }>
                                            <option value="">
                                                Default Option
                                            </option>
                                            {joinTypeArray.map(
                                                (field, index) => (
                                                    <option
                                                        key={index}
                                                        value={field.code}>
                                                        {field.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </Td>
                                    <Td className="col-sm-2 table-row text-left">
                                        <input
                                            className="form-control"
                                            name="field"
                                            value={item.field}
                                            onClick={item =>
                                                editItem(item, index)
                                            }
                                            onChange={e =>
                                                handleInput(e, index)
                                            }
                                        />
                                    </Td>
                                    <Td className="col-sm-2 table-row text-left">
                                        <select
                                            className="form-select"
                                            name="column_name"
                                            value={item.column_name}
                                            onClick={item =>
                                                editItem(item, index)
                                            }
                                            onChange={e =>
                                                handleInput(e, index)
                                            }>
                                            <option value="">
                                                Default Option
                                            </option>
                                            {operatorType.map(
                                                (field, index) => (
                                                    <option
                                                        key={index}
                                                        value={field.code}>
                                                        {field.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </Td>
                                    <Td className="col-sm-2 table-row text-left">
                                        <input
                                            className="form-control"
                                            name="value"
                                            value={item.value}
                                            onClick={item =>
                                                editItem(item, index)
                                            }
                                            onChange={e =>
                                                handleInput(e, index)
                                            }
                                        />
                                    </Td>
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
