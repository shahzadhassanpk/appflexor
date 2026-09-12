/* eslint-disable react/prop-types */
export default function TabButton({ active, icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`process-dashboard__tab inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}>
            <i className={icon} aria-hidden="true" />
            {label}
        </button>
    );
}
