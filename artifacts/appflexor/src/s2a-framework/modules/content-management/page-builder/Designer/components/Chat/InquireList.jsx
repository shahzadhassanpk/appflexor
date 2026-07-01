import React, { useContext, useRef, useState } from "react";
import ChatContext from "./ChatContext";
import ReactSelect from "../../../../../../components/ReactSelect/ReactSelect";
import ChildrenModal from "../../../../../../components/ChildrenModal/ChildrenModal";
import FormViewer from "../../../../../data-management/form-builder/Forms/FormViewer";
import SearchField from "../../../../../../components/SearchField";
import { AppContext } from "../../../../../../../AppContext";
import { FILE_URL } from "../../../../../../Config";

const InquireList = () => {
    const {
        inquires,
        organizations,
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedInquiryId,
        activeTab,
        sentMessage,
        getInquiriesAndOrganizationsAndCounts,
    } = useContext(ChatContext);
    const { profile } = useContext(AppContext);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState(false);
    const filters = [
        { name: "All", code: "ALL" },
        { name: "Unread", code: "UNREAD" },
        { name: "Favorites", code: "FAVORITES" },
    ];
    const inquireModalRef = useRef(null);

    const options = organizations.map(organization => ({
        label: organization.name,
        value: organization.id,
    }));
    const selectedOrganizationIndex = organizations.findIndex(
        organization => organization?.id === selectedOrganizationId,
    );

    const filterClass = selectedOrganizationId ? "filter-item-icon" : "";

    const handleSearch = event => {
        setSearch(event.target.value);
    };

    const handleOrganizationChange = organization => {
        setSelectedOrganizationId(organization?.value);
    };

    const addNew = () => {
        inquireModalRef.current.show();
    };

    const handleActions = async (...params) => {
        inquireModalRef.current.close();
        await sentMessage(params[1], "INITIAL-MESSAGE");
    };

    return (
        <div className="chat-left-panel">
            <ChildrenModal
                header="Add New Inquire"
                ref={inquireModalRef}>
                <FormViewer
                    formKey="im_inquiry"
                    handleActions={handleActions}
                    formVars={{ from_org: profile?.organizationid }}
                />
            </ChildrenModal>
            <div className="inquire-header">
                <div>
                    <span className="fw-bold fs-5">Inquiries </span>
                </div>
                <div>
                    <SearchField
                        classes={{
                            input_parent: "mt-2 search-input-parent",
                        }}
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search"
                    />
                </div>
                <div className="d-flex gap-2">
                    <i
                        onClick={getInquiriesAndOrganizationsAndCounts}
                        className="fa-solid fa-arrows-rotate"></i>
                    <i
                        onClick={() => setFilter(prev => !prev)}
                        className={`fa-solid fa-filter ${filterClass}`}></i>
                    <i
                        className="fa-solid fa-plus"
                        onClick={addNew}></i>
                </div>
            </div>
            {filter && (
                <div className="organization-select px-3">
                    <ReactSelect
                        placeholder="Select Organization"
                        options={options}
                        selectedOption={options?.[selectedOrganizationIndex]}
                        handleChange={handleOrganizationChange}
                    />
                </div>
            )}
            {/* <div className="search-parent px-3">
                <SearchField
                    classes={{
                        input_parent: "mt-2 search-input-parent",
                    }}
                    value={search}
                    onChange={handleSearch}
                    placeholder="Search"
                />
            </div> */}
            {/* <div className="px-3 mb-3 d-flex gap-2">
                {filters.map(filter => (
                    <Pill item={filter} />
                ))}
            </div> */}
            <ul className="chat-inquiries scroll-chat list-group list-group-flush">
                {Array.isArray(inquires) &&
                    inquires
                        .filter(item => {
                            const searchResult = item?.title?.includes(search);

                            if (!selectedOrganizationId && searchResult) {
                                return true;
                            }
                            if (
                                activeTab === "SENT" &&
                                item.to_org !== selectedOrganizationId
                            ) {
                                return false;
                            }

                            if (
                                activeTab === "RECEIVED" &&
                                item.from_org !== selectedOrganizationId
                            ) {
                                return false;
                            }

                            return searchResult;
                        })
                        .map(item => {
                            return (
                                <Inquirey
                                    key={item?.id}
                                    item={item}
                                />
                            );
                        })}
            </ul>
        </div>
    );
};

export default InquireList;

const Inquirey = props => {
    const { item } = props;
    const {
        countUnreadMessages,
        selectedInquiryId,
        setSelectedInquiryId,
        organizationImagesMap,
        activeTab,
    } = useContext(ChatContext);
    const { profile } = useContext(AppContext);
    const username = profile?.username;
    const count =
        countUnreadMessages[`username:${username}|inquiryid:${item?.id}`] || "";

    const organizationImage =
        activeTab === "SENT"
            ? organizationImagesMap[item?.to_org]
            : organizationImagesMap[item?.from_org];

    const organizationId = activeTab === "SENT" ? item?.to_org : item?.from_org;

    const organizationImageUrl = `${FILE_URL}/dir_organization/${organizationId}/${organizationImage}`;

    return (
        <li
            className={`list-group-item p-0 ${
                selectedInquiryId === item?.id ? "selected-inquiry" : "inquiry"
            }`}
            onClick={() => setSelectedInquiryId(item?.id)}>
            {/* <div className="px-2 pt-2">{item?.id}</div> */}
            {/* <div className="px-2 pt-2">from {item?.from_org}</div>
            <div className="px-2 pt-2">to {item?.to_org}</div> */}
            {/* <div className="ps-2">orgid:{profile.organizationid}</div> */}
            {/* <div className="ps-2">inqId:{item?.id}</div> */}
            <div className="row">
                <div className="ms-3 col-sm-2 p-0 d-flex justify-content-center align-items-center">
                    <img
                        className="chat-organization-image"
                        src={organizationImageUrl}
                    />
                </div>
                <div className="col p-0">
                    <div className="pt-2 d-flex justify-content-between align-items-center">
                        <span className="chat-title">{item?.title}</span>
                        {selectedInquiryId !== item.id && count && (
                            <span className="chat-count-pill me-5">
                                {count}
                            </span>
                        )}
                    </div>
                    {/* <div className="pb-2">{item?.id}</div> */}
                    <div className="chat-bottom">
                        {item?.product}
                        {" | "}
                        {item?.organization_name}
                    </div>
                </div>
            </div>
        </li>
    );
};

const Pill = ({ item, handleFilterChange }) => {
    return (
        <span
            className="chat-filter"
            onClick={() => handleFilterChange(item)}>
            {item?.name}
        </span>
    );
};
