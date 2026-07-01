import { noFormat } from "../../../../../../../utils/utils";
import * as colorPalette from "../ChartColorPalette/colorPicker";

const colorMaker = (index, props) => {
    let colors = [];
    if (colorPalette[props?.data?.color_palette]) {
        let arrOfColor = colorPalette[props?.data?.color_palette];
        arrOfColor.forEach(item => colors.push(item.value));
        props.chartData.data.forEach(item => {
            colors.push(item);
        });
    }
    return colors[index % 10];
};

const subTypes = [
    { type: "basis", chartType: "linechart" },
    { type: "basisClosed", chartType: "linechart" },
    { type: "basisOpen", chartType: "linechart" },
    { type: "bumpX", chartType: "linechart" },
    { type: "bumpY", chartType: "linechart" },
    { type: "bump", chartType: "linechart" },
    { type: "linear", chartType: "linechart" },
    { type: "linearClosed", chartType: "linechart" },
    { type: "natural", chartType: "linechart" },
    { type: "monotoneX", chartType: "linechart" },
    { type: "monotoneY", chartType: "linechart" },
    { type: "monotoneY", chartType: "linechart" },
    { type: "monotone", chartType: "linechart" },
    { type: "step", chartType: "linechart" },
    { type: "stepBefore", chartType: "linechart" },
    { type: "stepAfter", chartType: "linechart" },
    { type: "Function", chartType: "linechart" },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label} :`}</p>
                {payload.map((entry, index) => {
                    const value = parseInt(entry.value);
                    return (
                        <div
                            key={index}
                            className="tooltip-item">
                            <p className="tooltip-text">{`${entry.name} : `}</p>
                            <p className="value">{value}</p>
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
};

const CustomizeLegend = props => {
    const { payload } = props;
    return (
        <ul className="legend__list">
            {payload?.map((entry, index) => (
                <li
                    key={`item-${index}`}
                    className="customize__legend">
                    <i
                        style={{
                            fontSize: 8,
                            color: entry.color,
                        }}
                        className="fa-solid fa-circle me-1"></i>
                    {entry["dataKey"]}
                </li>
            ))}
        </ul>
    );
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius = 40,
    outerRadius,
    percent,
    index,
}) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="var(--font-color)"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export {
    colorMaker,
    subTypes,
    CustomTooltip,
    CustomizeLegend,
    renderCustomizedLabel,
};
