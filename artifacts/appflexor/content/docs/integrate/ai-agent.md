# AI Agent — Integrate

## Purpose

AI Agents in the Integrate stage strengthen external connectors with contextual intelligence. Rather than relying on static field mappings or rigid transformation rules, an agent reads schema documentation from a vector store and proposes contextually accurate mappings, transformations, or suggestions — making integrations faster to configure and more resilient to change.

---

## How It Works

1. An **AI Agent** is configured with an integration persona (e.g. "You are an integration specialist that maps fields between systems accurately").
2. An **AI Task** defines a vector query against schema documentation, API specs, or field dictionaries stored in a vector collection.
3. The caller includes **required references** (e.g. `sourceField`, `targetSystem`) so the agent retrieves the correct schema context before reasoning.
4. The agent combines the vector context and prompt, then calls the LLM.
5. The response — a field mapping, transformation rule, or integration suggestion — is returned to the connector or calling system.

---

## Sample Request

```
POST /app/service?service.key=ai.agent.task
```

```json
{
  "agentKey": "integration-agent",
  "taskKey": "suggest-mapping",
  "payload": {
    "message": "Suggest mapping for customer email",
    "sourceField": "customer_email",
    "targetSystem": "Salesforce"
  }
}
```

**What happens:**
- `sourceField` and `targetSystem` are used by the vector query to retrieve relevant schema entries and field definitions for Salesforce.
- The agent evaluates the source field against the target system's schema context.
- A contextually grounded field mapping suggestion is returned to the connector.

---

## Setting Up an Integrate Agent

### 1. Configure the Provider

Navigate to **Administrate → AI Services → AI Providers** and add the LLM provider with its API key.

### 2. Create the Agent

Navigate to **Administrate → AI Services → AI Agents** and add an agent:

| Field | Example value |
|---|---|
| Name | Integration Agent |
| Agent Key | `integration-agent` |
| AI Provider | `openai` |
| System Prompt | "You are an integration specialist. Analyse the source field and suggest the most accurate mapping to the target system's schema. Be specific and concise." |
| Default Vector Query — Collection | `schema_docs` |
| Default Vector Query — Search Text | `{{message}}` |
| Default Vector Query — Top K | `5` |

### 3. Create the Task

Navigate to **Administrate → AI Services → AI Tasks**, select your agent, and add a task:

| Field | Example value |
|---|---|
| Task Key | `suggest-mapping` |
| User Prompt | `Map this field to the target system: source field is {{sourceField}}, target system is {{targetSystem}}. {{message}}` |
| Vector Query — Collection | `schema_docs` |
| Vector Query — Search Text | `{{sourceField}} {{targetSystem}}` |
| Vector Query — Top K | `5` |

### 4. Call the Endpoint from Your Connector

Trigger the endpoint from an Appflexor External Worker or connector step. Pass the required references so the vector query retrieves the right schema context.

---

## Required References

| Reference | Purpose |
|---|---|
| `sourceField` | Identifies the field being mapped from the source system |
| `targetSystem` | Scopes the vector search to the target system's schema docs |
| `sourceSystem` | Narrows context when both source and target schemas are indexed |
| `dataType` | Helps the agent handle type coercion and format differences |

---

## Common Use Cases

| Task Key | Purpose |
|---|---|
| `suggest-mapping` | Propose a field mapping between two systems |
| `validate-payload` | Check an incoming payload against expected schema |
| `transform-format` | Suggest a data transformation (e.g. date format, currency) |
| `resolve-error` | Diagnose an integration error using schema context |

---

## Tips

- **Index your schema docs into a vector collection first.** The agent's quality depends entirely on what's in the vector store. Upload API specs, field dictionaries, and data models to the collection referenced in the task.
- **Include both `sourceField` and `targetSystem` as references.** Using both as the vector search text retrieves the most relevant schema entries for the mapping.
- **Use task-level vector queries.** Different integration tasks (mapping vs. validation vs. error resolution) should each target a specific vector query to retrieve the right context.
- **Keep the system prompt integration-specific.** An integration agent should focus on schema understanding and field relationships — not business logic or compliance decisions.
