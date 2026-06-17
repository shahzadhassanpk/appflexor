import { mode } from "../../Config";

const jsLogger = item => {
    mode === "DEV" && console.log(item, `*******${item}*******`);
};

export default jsLogger;
