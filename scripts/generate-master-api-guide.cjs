const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MASTER_APIS_PATH = path.join(
    ROOT,
    "artifacts",
    "appflexor",
    "sql-scripts",
    "Master_APIs.json"
);
const GUIDE_PATH = path.join(
    ROOT,
    "artifacts",
    "appflexor",
    "docs",
    "master-api-guide.md"
);

function normalizeCell(value) {
    return String(value || "")
        .replace(/\r?\n/g, " ")
        .replace(/\|/g, "\\|")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeModuleList(value) {
    const raw = String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    return raw.length ? raw : ["unknows"];
}

function groupRowsByAppAndModule(rows) {
    const appMap = new Map();

    for (const row of rows) {
        const appName = normalizeCell(row.app) || "unknown";
        if (!appMap.has(appName)) {
            appMap.set(appName, new Map());
        }

        const moduleMap = appMap.get(appName);
        for (const moduleName of normalizeModuleList(row.module)) {
            if (!moduleMap.has(moduleName)) {
                moduleMap.set(moduleName, []);
            }
            moduleMap.get(moduleName).push(row);
        }
    }

    return [...appMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([appName, moduleMap]) => ({
            appName,
            modules: [...moduleMap.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([moduleName, moduleRows]) => ({
                    moduleName,
                    rows: [...moduleRows].sort((a, b) =>
                        String(a.servicekey || "").localeCompare(String(b.servicekey || ""))
                    ),
                })),
        }));
}

function buildGuide(rows) {
    const groups = groupRowsByAppAndModule(rows);
    const lines = [
        "# Master API Guide",
        "",
        `Generated from \`Master_APIs.json\` on ${new Date().toISOString()}.`,
        "",
        "This guide groups master APIs by app and module, then lists each API with its service key, SQL, and description.",
    ];

    for (const group of groups) {
        lines.push("");
        lines.push(`## App: ${normalizeCell(group.appName)}`);

        for (const moduleGroup of group.modules) {
            lines.push("");
            lines.push(`### Module: ${normalizeCell(moduleGroup.moduleName)}`);

            for (const row of moduleGroup.rows) {
                lines.push("");
                lines.push(`#### ${normalizeCell(row.servicekey)}`);
                lines.push("");
                lines.push(`**Service Key:** \`${normalizeCell(row.servicekey)}\``);
                lines.push("");
                lines.push(`**Description:** ${normalizeCell(row.description)}`);
                lines.push("");
                lines.push("**SQL:**");
                lines.push("");
                lines.push("```sql");
                lines.push(String(row.sql || "").replace(/\r?\n/g, "\r\n"));
                lines.push("```");
            }
        }
    }

    if (!groups.length) {
        lines.push("");
        lines.push("No APIs found.");
    }

    return lines.join("\r\n") + "\r\n";
}

function main() {
    const rows = JSON.parse(fs.readFileSync(MASTER_APIS_PATH, "utf8"));
    const markdown = buildGuide(rows);
    fs.writeFileSync(GUIDE_PATH, markdown, "utf8");
    console.log(
        JSON.stringify(
            {
                guidePath: GUIDE_PATH,
                total: rows.length,
            },
            null,
            2
        )
    );
}

main();
