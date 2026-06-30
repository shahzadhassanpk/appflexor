export function FilesystemItem({
    node,
    onNodeSelection,
    onNodeExpansion,
    selectedDocumentType,
}) {
    return (
        <li
            key={node.name}
            className={`tree-node flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer ${
                !selectedDocumentType && node.isSelected
                    ? "node-selection-color"
                    : ""
            }`}
            style={{ minWidth: 200 }}>
            <span className={`d-flex align-items-center gap-1 mb-1  py-1 `}>
                <i
                    onClick={() => onNodeExpansion(node)}
                    class={`fas ${
                        node.isOpen ? "fa-chevron-down" : "fa-chevron-right"
                    } text-gray-400 text-xs mr-2`}></i>
                <i
                    onClick={() => onNodeExpansion(node)}
                    // style={{
                    //     fontSize: 22,
                    //     width: 25,
                    // }}
                    className={`fa-regular pointer ${
                        node.isOpen
                            ? "fas fa-folder-open mr-2"
                            : "fas fa-folder mr-2"
                    }   ${node.nodes?.length === 0 ? "ms-2" : "ms-2"}`}></i>

                <span
                    onClick={() => onNodeSelection(node)}
                    className="pointer inline-block node-label"
                    style={{
                        minWidth: 200,
                    }}>
                    {node.name} {node?.status}
                </span>
            </span>

            {node.isOpen && (
                <ul className="ps-4 list-unstyled">
                    {node.nodes?.map(
                        node =>
                            node.status !== "ARCHIVE" && (
                                <FilesystemItem
                                    node={node}
                                    key={node.name}
                                    onNodeSelection={onNodeSelection}
                                    onNodeExpansion={onNodeExpansion}
                                    selectedDocumentType={selectedDocumentType}
                                />
                            ),
                    )}
                </ul>
            )}
        </li>
    );
}
