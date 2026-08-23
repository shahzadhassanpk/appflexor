/* eslint-disable react/prop-types */
import { formatRemaining, urgencyClasses } from "../utils/sla";

export default function SlaBadge({ sla, compact = false }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${urgencyClasses[sla.urgency]}`}
            title={`Fixed thresholds: high at ${sla.thresholds.highMinutes}m, medium at ${sla.thresholds.mediumMinutes}m`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {sla.urgency.toUpperCase()}{compact ? "" : ` · ${formatRemaining(sla.remainingMinutes)}`}
        </span>
    );
}
