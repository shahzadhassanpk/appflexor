export default function ComponentsListing(props) {
    const {
        componentsListing,
        parent_index,
        item: data,
        item: { list },
        item: { selectedItems },
        setComponentsListing,
        setSelectedListing,
        selectedListing,
    } = props;

    const handleSelect = (item, i) => {
        let _data = { ...data };
        let _componentsListing = [...componentsListing];
        const _item = _data.selectedItems.find(_item => _item === item.id);
        if (!_item) {
            _data.selectedItems.push(item.id);
        } else {
            _data.selectedItems = _data.selectedItems.filter(
                _item => _item !== item.id,
            );
        }
        _componentsListing[parent_index] = _data;
        setComponentsListing(_componentsListing);
        setSelectedListing({
            ...selectedListing,
            [_data.code]: _data.selectedItems,
        });
    };
    const getNameById = id => {
        let _length = list.length;
        for (let i = 0; i < _length; i++) {
            if (list[i].id == id) {
                return list[i].name;
            }
        }
    };
    if (selectedItems && selectedItems.length)
        return (
            <ul className="list-group enable-scroll pe-1">
                {selectedItems?.map((item, i) => (
                    <li
                        key={item}
                        className="list-group-item module-listings">
                        <label htmlFor={item}>{getNameById(item)}</label>
                    </li>
                ))}
            </ul>
        );
}
