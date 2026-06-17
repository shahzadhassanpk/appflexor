import { useEffect, useState } from "react";
import useForm from "../../hooks/useForm";
import { agentServices } from "../../services/agent";
import LoadingButton from "../../components/LoadingButton";
import { handleSave } from "../CrudApiCall";
import { toastEmitter } from "../Toastify/Toastify";

const initialAgent = {
    first_name: "",
    last_name: "",
};

const validateFn = values => {
    return {
        firstname:
            values?.firstname?.length < 1
                ? "Please provide the first name"
                : "",
        lastname:
            values?.lastname?.length < 1 ? "Please provide the last name" : "",
    };
};

const EditAgent = props => {
    const { id, hideModal, getData,handleBack } = props;
    const [agent, setAgent] = useState("");
    const { setValues, values, errors, handleChange, handleSubmit } = useForm(
        initialAgent,
        validateFn,
    );

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                if (id) {
                    const response = await agentServices.getById(id);
                    if (response?.data?.C_STATUS === "SUCCESS") {
                        const fetchedData = response?.data?.C_DATA?.[id];

                        if (fetchedData.length > 0) {
                            setValues(fetchedData[0]);
                        } else {
                            setValues(initialAgent);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
                setValues(initialAgent);
            }
        };
        fetchAgent();
    }, [id]);

    const handleEditLead = async (values) => {
        try {
          const formData = {
            first_name: values.first_name,
            last_name: values.last_name,
            id: id,
          };
      
          await handleSave({
            entity: "waap_contact",
            formData,
          });
      
          await getData();
          handleBack();
          hideModal();
          toastEmitter("Data Updated Successfully", true);
        } catch (error) {
          console.log(error);
          toastEmitter("Data Update failed", true, "error");
        }
      };
      

    // return <>{JSON.stringify(agent, null, 2)}</>;
    return (
        <div className="container mt-4">
            <div>
                <div className="mb-3">
                    <label
                        htmlFor="first_name"
                        className="form-label">
                        First Name
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        name="first_name"
                        value={values.first_name}
                        onChange={handleChange}
                        required
                    />
                    <span className="text-danger">{errors?.first_name}</span>
                </div>

                <div className="mb-3">
                    <label
                        htmlFor="last_name"
                        className="form-label">
                        Last Name
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        name="last_name"
                        value={values.last_name}
                        onChange={handleChange}
                        required
                    />
                    <span className="text-danger">{errors?.last_name}</span>
                </div>

                <LoadingButton
                    classes={{ btn: "btn-primary" }}
                    label="Update"
                    fn={() => handleEditLead(values)}
                />
            </div>
        </div>
    );
};

export { EditAgent };
