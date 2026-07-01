import React from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "react-super-responsive-table";
import { TablePagination } from "../../../../components/TablePagination/TablePagination";

export default function ContentList(props) {
    const {
        inputReference,
        handleSearch,
        getPaginateData,
        tags,
        handlePostAndTags,
        content,
        size,
        setSize,
        current,
        setCurrent,
        contentList,
        Tags,
    } = props;

    return (
        <div
            id="link-post-modal"
            className="modal-body">
            <div className="row">
                <div className="col-sm-3">
                    <div className="search-input input-group mb-2">
                        <i className="input-search-icon fa-solid fa-magnifying-glass"></i>
                        <input
                            ref={inputReference}
                            type="text"
                            className="form-control"
                            onChange={handleSearch}
                            placeholder="Search..."
                        />
                        <span className="input-group-text fs-6">Ctrl + /</span>
                    </div>
                </div>
            </div>
            <div className="post-list">
                <div className="row">
                    <div className="table col-sm-9">
                        <div className="row">
                            <div className="col-sm-12">
                                <Table className="s2a-table table-bordered table-hover mb-0">
                                    <Thead className="thead">
                                        <Tr className="tableHeader">
                                            <Th className="col-sm-2 table-row text-left">
                                                Title
                                            </Th>
                                            <Th className="col-sm-2 table-row text-left">
                                                Tags
                                            </Th>
                                            <Th className="col-sm-2 table-row text-left"></Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {getPaginateData(current, size).map(
                                            item => {
                                                console.log(content, "post id");
                                                console.log(item, "post id");
                                                return (
                                                    <Tr
                                                        key={item.id}
                                                        className={` ${
                                                            content &&
                                                            item &&
                                                            item["id"] ===
                                                                content["id"]
                                                                ? "selected-cell"
                                                                : " "
                                                        }`}>
                                                        <Td className="col-sm-1 table-row text-left">
                                                            {item.name}
                                                        </Td>

                                                        <Td className="col-sm-3 table-row text-left">
                                                            <Tags
                                                                tag={item.tags}
                                                                content_id={
                                                                    item.id
                                                                }
                                                            />
                                                        </Td>
                                                        <Td className="col-sm-3 table-row text-left">
                                                            <a
                                                                type="button"
                                                                className="link-post-btn btn btn-sm btn-link text-decoration-none col-sm-2">
                                                                {content &&
                                                                item["id"] ===
                                                                    content[
                                                                        "id"
                                                                    ] ? (
                                                                    <i
                                                                        className="fa-solid fa-link-slash"
                                                                        title="Unlink Web Page"
                                                                        onClick={() =>
                                                                            handlePostAndTags(
                                                                                item,
                                                                                "unlink",
                                                                            )
                                                                        }></i>
                                                                ) : (
                                                                    <i
                                                                        className="fa-solid fa-link"
                                                                        title="Link Web Page"
                                                                        onClick={() =>
                                                                            handlePostAndTags(
                                                                                item,
                                                                            )
                                                                        }></i>
                                                                )}
                                                            </a>
                                                        </Td>
                                                    </Tr>
                                                );
                                            },
                                        )}
                                    </Tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-12">
                        <div className="col-sm-12 p-0 d-flex flex-row-reverse">
                            <TablePagination
                                size={size}
                                setSize={setSize}
                                current={current}
                                setCurrent={setCurrent}
                                tableData={contentList}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
