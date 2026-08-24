/* eslint-disable react/prop-types */

function Metric({ icon, label, value, tone }) {
    const cardTone = tone.includes("emerald")
        ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300"
        : tone.includes("amber")
            ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300"
            : tone.includes("red")
                ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300"
                : tone.includes("sky")
                    ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300"
                    : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white hover:border-indigo-300";
    return (
        <div className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardTone}`}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}><i className={icon} aria-hidden="true" /></span>
            <div className="min-w-0">
                <p className="mb-0 text-xl font-bold leading-none text-slate-900">{value}</p>
                <span className="mt-1 block truncate text-xs font-semibold text-slate-600">{label}</span>
            </div>
        </div>
    );
}

export default function Dashboard({ definitions, instances, tasks }) {
    const overdue = tasks.filter(task => task.due && new Date(task.due) < new Date()).length;
    const deployments = new Set(definitions.map(item => item.deploymentId).filter(Boolean)).size;
    return (
        <section aria-labelledby="monitor-overview">
            
            {/* <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric icon="fa-solid fa-play" label="Running" value={instances.length} tone="bg-indigo-50 text-indigo-600" />
                <Metric icon="fa-solid fa-list-check" label="Open tasks" value={tasks.length} tone="bg-sky-50 text-sky-600" />
                <Metric icon="fa-solid fa-clock" label="Overdue" value={overdue} tone="bg-amber-50 text-amber-600" />
                <Metric icon="fa-solid fa-triangle-exclamation" label="Failed jobs" value={failedJobs} tone="bg-red-50 text-red-600" />
            </div> */}
            {/* <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4"><h2 className="mb-0 text-lg font-bold text-slate-900">Right Now</h2></div>
                <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <RingMetric label="Running Process Instances" value={instances.length} />
                    <RingMetric label="Open Incidents" value={failedJobs} color={failedJobs ? "border-red-500" : "border-slate-300"} />
                    <RingMetric label="Open Human Tasks" value={tasks.length} />
                </div>
            </div> */}
            <div className="mt-4">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Metric icon="fa-solid fa-diagram-project" label="Process Definitions" value={definitions.length} tone="bg-indigo-100 text-indigo-700" />
                    <Metric icon="fa-solid fa-rocket" label="Deployments" value={deployments} tone="bg-sky-100 text-sky-700" />
                    <Metric icon="fa-solid fa-play" label="Running Instances" value={instances.length} tone="bg-emerald-100 text-emerald-700" />
                    <Metric icon="fa-solid fa-clock" label="Overdue Tasks" value={overdue} tone={overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"} />
                </div>
            </div>
        </section>
    );
}
