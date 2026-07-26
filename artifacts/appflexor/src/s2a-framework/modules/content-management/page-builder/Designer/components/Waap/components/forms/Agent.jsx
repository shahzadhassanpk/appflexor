import { useEffect, useState } from "react";
import useForm from "../../hooks/useForm";
import List from "../DropDown/List";
import SearchInput from "../SearchInput";
import LoadingButton from "../LoadingButton";
import { agentServices } from "../../services/agent";
import iconMap from "../DropDown/icons";
import { toastEmitter } from "../Toastify/Toastify";
import { leadServices } from "../../services/lead";

const Agents = props => {
    const { hideModal, getData, selectedLead } = props;
    const [agents, setAgents] = useState([]);
    const { values, errors, handleChange, handleSubmit, reset, setValues } =
        useForm({ initialValues: { search: "" } });

    useEffect(() => {
        (async () => {
            const response = await agentServices.get();
            if (response?.data?.C_STATUS === "SUCCESS") {
                setAgents(response?.data?.C_DATA?.agents);
            }
        })();
    }, []);

    const searchText = (values?.search || "").toLowerCase();

    const filteredAgents =
        agents?.filter(agent => {
            const username = (agent?.username || "").toLowerCase();
            const firstName = (agent?.first_name || agent?.firstname || "").toLowerCase();
            const lastName = (agent?.last_name || agent?.lastname || "").toLowerCase();
            const fullName = `${firstName} ${lastName}`.trim();
            return (
                username.includes(searchText) ||
                firstName.includes(searchText) ||
                lastName.includes(searchText) ||
                fullName.includes(searchText)
            );
        }) || [];

    const handleAssignedLeadToAgent = async agent => {
        try {
            // WAAP stores assignee as contact UUID; fallback to username for legacy rows.
            const assignee = agent?.id || agent?.username;
            if (!assignee || !selectedLead?.id) {
                toastEmitter("Agent assignment failed", true, "error");
                return;
            }
            const formData = {
                agent_assigned: assignee,
                id: selectedLead.id,
            };

            await leadServices.patch(formData);
            await getData();

            hideModal();
            toastEmitter("Agent assignment successfully", true);
        } catch (error) {
            console.log(error);
            toastEmitter("Agent assignment failed", true, "error");
        }
    };

    return (
        <>
            <label>Current Assignee {selectedLead?.agent_assigned}</label>
            <SearchInput
                name="search"
                value={values?.search}
                onChange={handleChange}
            />
            <ul className="list-group agent-list enable-scroll scroll-y">
                <List
                    items={filteredAgents}
                    renderItem={(agent, index) => {
                        return (
                            <li
                                key={agent?.id || index}
                                className="list-group-item d-flex justify-content-between">
                                <span>
                                    {agent?.first_name || agent?.firstname || ""}{" "}
                                    {agent?.last_name || agent?.lastname || ""}
                                    {agent?.username ? ` (${agent.username})` : ""}
                                </span>
                                <LoadingButton
                                    classes={{ btn: "btn-primary" }}
                                    label={
                                        <>
                                            <span className="me-2">
                                                {iconMap?.assigned}
                                            </span>
                                            <span>Assign</span>
                                        </>
                                    }
                                    fn={() => handleAssignedLeadToAgent(agent)}
                                />
                            </li>
                        );
                    }}
                />
            </ul>
        </>
    );
};

export default Agents;
