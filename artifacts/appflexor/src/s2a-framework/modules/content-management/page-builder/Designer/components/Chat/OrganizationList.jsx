import React, { useContext, useState } from "react";
import ChatContext from "./ChatContext";
import TextField from "../../../../../../components/Textfield";
import useInput from "../../../../../../hooks/useInput";

const OrganizationList = () => {
    const { organizations } = useContext(ChatContext);
    const { values, handleOnChange } = useInput({ search: "" });

    return (
        <div className="chat-organizations">
            <div className="header">Organizations</div>
            <TextField
                classes={{
                    input_parent: "mt-2",
                }}
                value={values?.search}
                onChange={handleOnChange}
                placeholder="Search"
            />
            <OrganizationList.List items={organizations}>
                <OrganizationList.List.ListItem />
            </OrganizationList.List>
        </div>
    );
};

export default OrganizationList;

OrganizationList.List = props => {
    const { items } = props;

    return (
        <ul className="list-group list-group-flush organization-list">
            {items.map(item => (
                <OrganizationList.List.ListItem item={item} />
            ))}
        </ul>
    );
};

OrganizationList.List.ListItem = props => {
    const { item } = props;
    const { selectedOrganizationId, setSelectedOrganizationId } =
        useContext(ChatContext);

    return (
        <li
            className={
                selectedOrganizationId === item.id
                    ? "selected-organization list-group-item"
                    : "list-group-item"
            }
            onClick={() => setSelectedOrganizationId(item.id)}>
            <span>{item.name}</span>
        </li>
    );
};
