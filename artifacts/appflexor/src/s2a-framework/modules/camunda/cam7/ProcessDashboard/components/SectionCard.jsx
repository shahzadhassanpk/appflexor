/* eslint-disable react/prop-types */
export default function SectionCard({ title, subtitle, icon, children }) {
    return (
        <section className="process-dashboard__section overflow-hidden rounded-2xl border shadow-sm">
            <header className="process-dashboard__section-header border-b border-slate-100 px-4 py-3">
                <div className="flex items-start gap-3">
                    <span className="process-dashboard__section-icon mt-0.5 text-indigo-600">
                        <i className={icon} aria-hidden="true" />
                    </span>
                    <div className="process-dashboard__section-copy min-w-0">
                        <h3 className="process-dashboard__section-title mb-1 text-sm font-bold">{title}</h3>
                        <p className="process-dashboard__meta mb-0 text-xs">{subtitle}</p>
                    </div>
                </div>
            </header>
            <div className="process-dashboard__section-body p-4">{children}</div>
        </section>
    );
}
