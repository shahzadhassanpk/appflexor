export default function OrderFields(props) {
    const { selectedItem, handleInputField, orders, pages } = props;
    return (
        <div className="s2a-orderfields">
            <div>
                <label className="fw-bold">Order By</label>
                <select
                    className="form-select mb-3"
                    name="orderbyfield"
                    title="Select fields first"
                    value={selectedItem && selectedItem.orderbyfield}
                    onChange={handleInputField}>
                    <option value="id">Select Option</option>
                    {selectedItem &&
                        selectedItem.layout &&
                        selectedItem.layout.selected_fields &&
                        selectedItem.layout.selected_fields.map(
                            (item, index) =>
                                item?.type !== "datalist" && (
                                    <option
                                        value={item?.db_column}
                                        key={index}>
                                        {item?.label}
                                    </option>
                                ),
                        )}
                </select>
            </div>
            <div>
                <label className="fw-bold">Order</label>
                <select
                    className="form-select mb-3"
                    name="orderby"
                    title="Select fields first"
                    value={selectedItem && selectedItem.orderby}
                    onChange={handleInputField}>
                    <option value="">Select Option</option>
                    {orders.map((item, index) => (
                        <option
                            value={item.code}
                            key={index}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="fw-bold">Default Page Size</label>
                <select
                    className="form-select mb-3"
                    name="defaultpage"
                    title="Select fields first"
                    value={selectedItem && selectedItem.defaultpage}
                    onChange={handleInputField}>
                    {pages.map((item, index) => (
                        <option
                            value={item}
                            key={index}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
