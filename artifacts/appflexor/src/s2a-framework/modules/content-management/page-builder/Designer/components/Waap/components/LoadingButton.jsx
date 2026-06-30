import { useState } from "react";

const LoadingButton = (props) => {
  const { fn, label = null, classes = {} } = props;
  const [loading, setLoading] = useState(false);

  return (
    <button
      className={`btn btn-sm ${classes.btn}`}
      type="button"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await fn();
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading && (
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
      )}
      {loading ? "Loading..." : label}
    </button>
  );
};

export default LoadingButton;
