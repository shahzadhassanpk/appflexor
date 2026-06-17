import { useEffect } from "react";

const Modal = (props) => {
  const { id, title, modalRef, children } = props;

  useEffect(() => {
    const modal = document.getElementById(id);

    if (!modalRef.current) {
      const bsModal = new window.bootstrap.Modal(modal);
      modalRef.current = bsModal;
    }
  }, [id]);

  return (
    <div
      className="modal fade"
      id={id}
      tabIndex="-1"
      aria-labelledby={id}
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id={id}>
              {title}
            </h1>
            <button
              type="button"
              className="btn-close"
              onClick={() => modalRef?.current?.hide()}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
