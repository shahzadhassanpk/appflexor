import { ToastContainer, toast } from "react-toastify";

function toastEmitter(message, autoClose = true, msgType) {
    let type = ["info", "warning", "success", "error"];
    let currentType = "";

    var arrayLength = type.length;
    var i = 0;
    for (i = 0; i < arrayLength; i++) {
        if (type[i] === msgType) {
            currentType = msgType;
        }
    }

    const options = {
        position: "bottom-right",
        autoClose: autoClose,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
    };
    const notify = () =>
        toast[currentType ? currentType : "success"](`${message}`, options);
    notify();
}

function ContainerToast() {
    return (
        <>
            <div>
                <ToastContainer />
            </div>
        </>
    );
}
export { ContainerToast, toastEmitter };
