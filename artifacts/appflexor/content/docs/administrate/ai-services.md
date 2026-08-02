# AI Services

## Purpose

**AI Services** is the configuration hub for all AI-powered automation in Appflexor. It lets administrators define the AI providers, agents, and task definitions that are consumed by N8N webhook workflows at runtime. No code changes are needed to add new AI capabilities — everything is driven by the records stored here.

---

## Key Concepts

| Term | Description |
|---|---|
| **AI Provider** | A connection to an external LLM service (e.g. OpenAI, Anthropic, Groq). Stores the provider key and API credentials. |
| **AI Agent** | A named agent that pairs a system prompt with a specific AI provider. Agents define the persona and behaviour of an AI responder. |
| **AI Task** | A task definition scoped to an agent. Tasks hold the user prompt template, an optional SQL query for data retrieval, and optional vector search parameters. |
| **Agent Key** | A short identifier (e.g. `customer-support`) used by N8N webhooks to look up the agent at runtime. |
| **Task Key** | A short identifier (e.g. `summarise-ticket`) used by N8N to select the correct task within an agent. |
| **System Prompt** | The base instruction sent to the LLM for every request routed to this agent. Defines scope, persona, and constraints. |
| **Vector Query** | Optional semantic search parameters (collection, search text, top-K) used to inject context from a vector store before the LLM call. |

---

## AI Providers

AI Providers register the external LLM services your agents will use.

### Add a Provider

1. Navigate to **Administrate → AI Services → AI Providers**.
2. Click **Add Provider**.
3. Fill in:
   - **Provider Name** — display name shown in dropdowns (e.g. `OpenAI`).
   - **Provider Key** — short lowercase identifier referenced in agent configs (e.g. `openai`). Must be unique.
   - **API Key** — the secret key from the provider's dashboard (e.g. `sk-…`). Stored server-side and never re-displayed.
4. Click **Save**.

### Edit a Provider

1. Click the **Edit** (pencil) icon on the provider row.
2. Update the fields as needed.
3. Click **Save**.

> **Note:** Changing a Provider Key after agents have been configured against it will break those agents. Update agent records to match the new key before changing it here.

### Delete a Provider

1. Click the **Delete** (trash) icon and confirm.
2. Any agents referencing the deleted provider key will no longer be able to resolve the LLM connection.

---

## AI Agents

AI Agents combine a system prompt with an AI provider to create a reusable AI responder.

### Add an Agent

1. Navigate to **Administrate → AI Services → AI Agents**.
2. Click **Add Agent**.
3. Fill in:
   - **Name** — human-readable label shown in the UI (e.g. `Customer Support`).
   - **Agent Key** — unique identifier used in N8N webhooks (e.g. `customer-support`). Use lowercase with hyphens.
   - **AI Provider** — select from the configured providers list.
   - **System Prompt** — the instruction that defines the agent's behaviour for every request.
   - **Default Vector Query** *(optional)* — pre-fill the collection, search text template, and top-K result count to use when no task-level vector query is defined.
4. Click **Save**.

### Edit an Agent

1. Click the **Edit** icon on the agent row.
2. Modify any fields.
3. Click **Save**.

### Open Agent Tasks

Click the **Tasks** (checklist) icon on an agent row to jump to the AI Tasks tab pre-filtered to that agent's tasks.

### Export Agent Definition

Click the **JSON** (code) icon to preview the full agent definition, or **Download JSON** to export it as a file. Useful for sharing configurations across environments.

### Delete an Agent

Click the **Delete** icon and confirm. Deleting an agent removes the agent record. Ensure any N8N workflows referencing its `agentKey` are updated or disabled first.

---

## AI Tasks

AI Tasks define what an agent should do for a specific use case. Each task belongs to one agent and is referenced by its `taskKey` in N8N.

### Add a Task

1. Navigate to **Administrate → AI Services → AI Tasks**.
2. Select an agent from the **Agent** dropdown at the top of the tab.
3. Click **Add Task**.
4. Fill in:
   - **Task Key** — unique identifier within this agent (e.g. `summarise-ticket`). Used by N8N to select this task.
   - **User Prompt** — the prompt template sent to the LLM. Use `{{variableName}}` placeholders for dynamic values injected by N8N at runtime.
   - **SQL Query** *(optional)* — a SQL statement executed before the LLM call. Results are injected into the prompt context (e.g. to ground the AI answer with live data).
   - **Vector Query** *(optional)* — override the agent-level vector query with task-specific parameters (collection, search text, top-K).
5. Click **Save**.

### Edit a Task

1. Select the agent whose task you want to edit.
2. Click the **Edit** icon on the task row.
3. Make changes and click **Save**.

### Delete a Task

Click the **Delete** icon on the task row and confirm.

---

## N8N Webhook Integration

At runtime, an N8N workflow sends a webhook request to Appflexor containing:

```json
{
  "agentKey": "customer-support",
  "taskKey": "summarise-ticket",
  "variables": {
    "ticketId": "12345",
    "userMessage": "My order hasn't arrived"
  }
}
```

Appflexor resolves the agent and task, executes any SQL query, runs vector search if configured, assembles the full prompt, and calls the LLM via the agent's AI provider. The result is returned to N8N for downstream processing.

### Resolution Order

1. Look up agent by `agentKey` → retrieve system prompt and AI provider.
2. Look up task by `taskKey` scoped to the agent → retrieve user prompt, SQL query, vector query.
3. Execute SQL (if defined) → inject results into prompt context.
4. Run vector search (if defined) — task-level overrides agent-level defaults.
5. Call the LLM with assembled context.
6. Return response to N8N.

---

## Tips

- **Keep Agent Keys stable.** N8N workflows are wired to `agentKey` values. Renaming a key requires updating every N8N node that references it.
- **Use SQL queries for grounding.** Injecting live data (e.g. the current ticket record) before the LLM call dramatically improves answer accuracy.
- **Use vector search for knowledge bases.** Set up a vector collection with your product docs or FAQs and reference it in tasks to give the AI relevant context without embedding it all in the system prompt.
- **Test prompts iteratively.** Export an agent's JSON definition, test it against the LLM API directly, then update the system prompt or user prompt template once the output is satisfactory.
