# Data Intake AI Agent — Capture

## Purpose

AI Agents in the Capture stage enrich incoming events and API payloads at the point of intake. Rather than passing raw data into your workflow, an agent reads the payload, fetches live context via SQL or vector search, and returns a structured, enriched response — ready for downstream processing.

---

## How It Works

1. An **AI Agent** is configured with a system prompt that defines its intake persona (e.g. "You are a support intake assistant that classifies and summarises incoming tickets").
2. An **AI Task** within that agent defines the user prompt template for this specific capture scenario.
3. The caller includes a **required reference** in the payload (e.g. `orderRef`, `customerId`) so the agent can retrieve live contextual data via the task's SQL query before reasoning.
4. The agent assembles the prompt with the enriched context and calls the LLM.
5. The enriched response is returned for use in forms, API responses, or workflow triggers.

---

## Sample Request

```
POST /app/service?service.key=ai.agent.task
```

```json
{
  "agentKey": "customer-support",
  "taskKey": "summarise-ticket",
  "payload": {
    "message": "My order hasn't arrived",
    "orderRef": "ORD-2026-12345"
  }
}
```

**What happens:**
- `orderRef` is passed to the task's SQL query to retrieve the live order record.
- The agent summarises the ticket with full order context injected into the prompt.
- The enriched summary is returned — ready to be stored, routed, or displayed.

---

## Setting Up a Capture Agent

### 1. Configure the Provider

Navigate to **Administrate → AI Services → AI Providers** and add the LLM provider (e.g. OpenAI, Anthropic, Groq) with its API key.

### 2. Create the Agent

Navigate to **Administrate → AI Services → AI Agents** and add an agent:

| Field | Example value |
|---|---|
| Name | Customer Support |
| Agent Key | `customer-support` |
| AI Provider | `openai` |
| System Prompt | "You are a support intake assistant. Summarise the issue clearly and extract key facts." |

### 3. Create the Task

Navigate to **Administrate → AI Services → AI Tasks**, select your agent, and add a task:

| Field | Example value |
|---|---|
| Task Key | `summarise-ticket` |
| User Prompt | `Summarise this support request: {{message}}` |
| SQL Query | `SELECT * FROM orders WHERE order_ref = :orderRef` |

The `:orderRef` parameter is bound automatically from the `orderRef` value in the incoming payload.

### 4. Call the Endpoint

Post the request from your form submission handler, API webhook, or external event source. Include the required reference fields so the SQL query can retrieve the correct record.

---

## Required References

Required references are payload fields (besides `message`) that the agent's SQL query or vector query depends on. Always include every reference the task needs — omitting one causes the SQL to return no data, which degrades the agent's answer quality.

| Reference | Purpose |
|---|---|
| `orderRef` | Retrieves the order record for order-related queries |
| `customerId` | Retrieves customer profile and history |
| `ticketId` | Retrieves an existing support ticket record |

---

## Tips

- **Keep system prompts focused on intake.** A capture agent should classify, summarise, and extract — not make decisions. Decisions belong in Orchestrate agents.
- **Use SQL to ground every response.** A prompt enriched with live data produces dramatically more accurate summaries than one relying on the caller's raw message alone.
- **Validate references before calling the endpoint.** If a required reference is missing from the payload, the SQL query returns nothing and the agent's answer will lack context.
