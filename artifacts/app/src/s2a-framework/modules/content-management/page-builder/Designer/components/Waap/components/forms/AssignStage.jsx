import { useEffect, useState } from "react";
import LoadingButton from "../LoadingButton";
import { handleSave } from "../CrudApiCall";
import { toastEmitter } from "../Toastify/Toastify";

const STAGE_OPTIONS = [
  { title: "New", code: "NEW" },
  { title: "Quoted", code: "QUOTED" },
  { title: "Booked", code: "BOOKED" },
  { title: "Lost", code: "LOST" },
];

const AssignStage = props => {
  const { id, hideModal, getData, handleBack, selectedLead } = props;

  const [stage, setStage] = useState("NEW");

  useEffect(() => {
    if (selectedLead?.stage && STAGE_OPTIONS.some(opt => opt.code === selectedLead.stage)) {
      setStage(selectedLead.stage);
    } else {
      setStage("NEW");
    }
  }, [selectedLead]);

  const handleSaveProducts = async () => {
    try {
      const formData = {
        id,
        stage,
      };

      await handleSave({
        entity: "waap_lead",
        formData,
      });

      await getData();
      handleBack();
      hideModal();
      toastEmitter("Stage updated successfully", true);
    } catch (error) {
      console.error(error);
      toastEmitter("Failed to update stage", true, "error");
    }
  };

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <label className="form-label">Select Stage</label>
        <div className="form-check-group">
          {STAGE_OPTIONS.map(opt => (
            <div className="form-check" key={opt.code}>
              <input
                className="form-check-input"
                type="radio"
                name="stage"
                id={`stage_${opt.code}`}
                value={opt.code}
                checked={stage === opt.code}
                onChange={e => setStage(e.target.value)}
              />
              <label className="form-check-label" htmlFor={`stage_${opt.code}`}>
                {opt.title}
              </label>
            </div>
          ))}
        </div>
      </div>

      <LoadingButton
        classes={{ btn: "btn-primary" }}
        label="Update"
        fn={handleSaveProducts}
      />
    </div>
  );
};

export { AssignStage };
