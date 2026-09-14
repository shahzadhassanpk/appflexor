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
const MODULES_ROOT = path.join(
    ROOT,
    "artifacts",
    "appflexor",
    "src",
    "s2a-framework",
    "modules"
);

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, files);
            continue;
        }
        if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function normalizeWhitespace(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function toTitleCase(value) {
    return value
        .split(" ")
        .filter(Boolean)
        .map((word) => {
            if (/^[A-Z0-9]+$/.test(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

function humanizeTableName(tableName) {
    if ((tableName || "").toLowerCase() === "pg_catalog.pg_tables") {
        return "PostgreSQL Tables";
    }

    return toTitleCase(
        tableName
            .replace(/"/g, "")
            .replace(/\bpublic\./gi, "")
            .replace(/\bpg_catalog\./gi, "PostgreSQL ")
            .replace(/^app_fd_/i, "")
            .replace(/^dir_/i, "directory ")
            .replace(/^dim_/i, "")
            .replace(/^fact_/i, "")
            .replace(/^vw_/i, "")
            .replace(/[.]/g, " ")
            .replace(/_/g, " ")
    );
}

function humanizeServiceKey(serviceKey) {
    return toTitleCase(
        (serviceKey || "")
            .replace(/[._-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
    );
}

function extractTables(sql) {
    const matches = [];
    const patterns = [
        /\bfrom\s+([a-zA-Z0-9_."-]+)/gi,
        /\bjoin\s+([a-zA-Z0-9_."-]+)/gi,
        /\bupdate\s+([a-zA-Z0-9_."-]+)/gi,
        /\binto\s+([a-zA-Z0-9_."-]+)/gi,
        /\bdelete\s+from\s+([a-zA-Z0-9_."-]+)/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(sql))) {
            const value = match[1]
                .replace(/[;,]+$/g, "")
                .replace(/^\(+/, "")
                .replace(/\)+$/g, "");
            matches.push(value);
        }
    }

    return unique(matches);
}

function extractWhereHints(sql) {
    const hints = [];
    const lowerSql = sql.toLowerCase();

    if (/\bid\s*=\s*\?/i.test(sql)) hints.push("by ID");
    if (/\busername\s*=\s*\?/i.test(sql)) hints.push("by username");
    if (/\bemail\s*=\s*\?/i.test(sql)) hints.push("by email");
    if (/\bc_post_id\s*=\s*\?/i.test(sql)) hints.push("for a post");
    if (/\bc_content_id\s*=\s*\?/i.test(sql)) hints.push("for a content item");
    if (/\bc_page_id\s*=\s*\?/i.test(sql)) hints.push("for a page");
    if (/\bc_channel_id\s*=\s*\?/i.test(sql)) hints.push("for a channel");
    if (/\bc_menu_id\s*=\s*\?/i.test(sql)) hints.push("for a menu");
    if (/\bc_site_id\s*=\s*\?/i.test(sql)) hints.push("for a site");
    if (/like\s+\?\s*\|\|\s*'%'/.test(lowerSql) || /like\s+\?/i.test(sql)) {
        hints.push("matching the provided pattern");
    }
    if (/count\s*\(/i.test(sql)) hints.push("with an aggregate count");
    if (/group\s+by/i.test(sql)) hints.push("grouped in SQL");
    if (/order\s+by/i.test(sql)) hints.push("ordered in SQL");
    if (/interval\s+'7 days'/i.test(sql)) hints.push("older than 7 days");

    return unique(hints);
}

function buildDescription(entry) {
    if (normalizeWhitespace(entry.description)) {
        return {
            description: entry.description,
            desc:
                normalizeWhitespace(entry.desc) ||
                normalizeWhitespace(entry.description) ||
                entry.description ||
                "",
        };
    }

    const rawSql = entry.sql || "";
    const sql = normalizeWhitespace(rawSql);
    const tables = extractTables(sql);
    const tableLabel = tables.length
        ? tables.map(humanizeTableName).join(", ")
        : humanizeServiceKey(entry.servicekey);
    const hints = extractWhereHints(sql);
    const lowerSql = sql.toLowerCase();

    let description = "";

    if (!sql) {
        description = `Handles ${humanizeServiceKey(entry.servicekey)} operations.`;
    } else if (lowerSql.startsWith("select")) {
        description = `Retrieves ${tableLabel} records`;
    } else if (lowerSql.startsWith("delete")) {
        description = `Deletes ${tableLabel} records`;
    } else if (lowerSql.startsWith("update")) {
        description = `Updates ${tableLabel} records`;
    } else if (lowerSql.startsWith("insert")) {
        description = `Creates ${tableLabel} records`;
    } else {
        description = `Executes the ${humanizeServiceKey(entry.servicekey)} SQL operation`;
    }

    if (hints.length) {
        description += ` ${hints.join(", ")}.`;
    } else {
        description += ".";
    }

    description = description
        .replace(/\s+,/g, ",")
        .replace(/\s+\./g, ".")
        .replace(/\.\./g, ".")
        .trim();

    const desc = normalizeWhitespace(entry.desc) || description;
    return { description, desc };
}

function buildModuleMap() {
    const files = walk(MODULES_ROOT);
    const moduleMap = new Map();
    const patterns = [
        /serviceKey\s*:\s*"([^"]+)"/g,
        /service_key\s*:\s*"([^"]+)"/g,
        /\?service\.key=([A-Za-z0-9_.-]+)/g,
    ];

    for (const filePath of files) {
        const relative = path.relative(MODULES_ROOT, filePath);
        const moduleName = relative.split(path.sep)[0];
        const source = fs.readFileSync(filePath, "utf8");

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(source))) {
                const serviceKey = (match[1] || "").trim();
                if (!serviceKey) continue;
                if (!moduleMap.has(serviceKey)) {
                    moduleMap.set(serviceKey, new Set());
                }
                moduleMap.get(serviceKey).add(moduleName);
            }
        }
    }

    return moduleMap;
}

function main() {
    const rows = JSON.parse(fs.readFileSync(MASTER_APIS_PATH, "utf8"));
    const moduleMap = buildModuleMap();

    let unknownCount = 0;
    let multiModuleCount = 0;

    for (const row of rows) {
        const modules = moduleMap.has(row.servicekey)
            ? [...moduleMap.get(row.servicekey)].sort()
            : [];
        const moduleValue = modules.length ? modules.join(", ") : "unknows";
        if (!modules.length) unknownCount += 1;
        if (modules.length > 1) multiModuleCount += 1;

        const { description, desc } = buildDescription(row);

        row.module = moduleValue;
        row.description = description;
        row.desc = desc;
    }

    fs.writeFileSync(
        MASTER_APIS_PATH,
        JSON.stringify(rows, null, 4) + "\r\n",
        "utf8"
    );

    console.log(
        JSON.stringify(
            {
                total: rows.length,
                unknownModules: unknownCount,
                multiModuleApis: multiModuleCount,
            },
            null,
            2
        )
    );
}

main();
