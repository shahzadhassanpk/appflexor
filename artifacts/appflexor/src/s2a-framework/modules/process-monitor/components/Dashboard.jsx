/* eslint-disable react/prop-types */

function Metric({ icon, label, value, tone }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><i className={icon} aria-hidden="true" /></span>
            </div>
            <p className="mb-0 mt-3 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function RingMetric({ label, value, color = "border-indigo-600" }) {
    return <div className="flex flex-col items-center p-4 text-center"><div className={`grid h-24 w-24 place-items-center rounded-full border-[14px] ${color} bg-white text-2xl font-bold text-indigo-700`}>{value}</div><p className="mb-0 mt-3 text-sm font-medium text-slate-700">{label}</p></div>;
}

export default function Dashboard({ definitions, instances, tasks, jobs, history, tenantId }) {
    const failedJobs = jobs.filter(job => job.exceptionMessage || job.retries === 0).length;
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
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-slate-900">Deployed</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className="mb-1 text-sm text-slate-500">Process Definitions</p><p className="mb-0 text-2xl font-bold text-indigo-600">{definitions.length}</p></div><div><p className="mb-1 text-sm text-slate-500">Deployments</p><p className="mb-0 text-2xl font-bold text-indigo-600">{deployments}</p></div><div><p className="mb-1 text-sm text-slate-500">Running Instances</p><p className="mb-0 text-2xl font-bold text-indigo-600">{instances.length}</p></div><div><p className="mb-1 text-sm text-slate-500">Overdue Tasks</p><p className="mb-0 text-2xl font-bold text-indigo-600">{overdue}</p></div></div>
            </div>
        </section>
    );
}
