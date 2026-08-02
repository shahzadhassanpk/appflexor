# AI Agent — Orchestrate

## Purpose

AI Agents in the Orchestrate stage apply LLM reasoning inside running workflows to drive smarter, context-aware decisions. Rather than hard-coding rules into process logic, an agent evaluates live transactional data and semantic knowledge to produce a grounded recommendation or decision that the workflow acts on.

---

## How It Works

1. An **AI Agent** is configured with a domain persona (e.g. "You are a compliance officer evaluating financial transactions").
2. An **AI Task** defines a SQL query to retrieve the relevant record and optionally a vector query to pull compliance rules from a knowledge base.
3. The caller includes a **required reference** (e.g. `transactionId`) so the agent retrieves the exact record before reasoning.
4. The agent combines the SQL result, vector context, and prompt, then calls the LLM.
5. The response — a classification, decision, or recommendation — is returned to the workflow for branching or further processing.

---

## Sample Request

```
POST /app/service?service.key=ai.agent.task
```

```json
{
  "agentKey": "finance-agent",
  "taskKey": "compliance-check",
  "payload": {
    "message": "Check compliance for this transaction",
    "transactionId": "TX-2026-045"
  }
}
```

**What happens:**
- `transactionId` is passed to the task's SQL query to retrieve the full transaction record.
- The vector query pulls the relevant compliance rules from the knowledge base.
- The agent applies the rules to the transaction context and returns a grounded compliance decision.
- The workflow reads the decision and branches accordingly (e.g. approve, flag, escalate).

---

## Setting Up an Orchestrate Agent

### 1. Configure the Provider

Navigate to **Administrate → AI Services → AI Providers** and add the LLM provider with its API key.

### 2. Create the Agent

Navigate to **Administrate → AI Services → AI Agents** and add an agent:

| Field | Example value |
|---|---|
| Name | Finance Compliance Agent |
| Agent Key | `finance-agent` |
| AI Provider | `openai` |
| System Prompt | "You are a compliance officer. Evaluate the transaction against the applicable rules and return a clear decision with justification." |
| Default Vector Query — Collection | `compliance_rules` |
| Default Vector Query — Search Text | `{{message}}` |
| Default Vector Query — Top K | `5` |

### 3. Create the Task

Navigate to **Administrate → AI Services → AI Tasks**, select your agent, and add a task:

| Field | Example value |
|---|---|
| Task Key | `compliance-check` |
| User Prompt | `Evaluate this transaction for compliance: {{message}}` |
| SQL Query | `SELECT * FROM transactions WHERE transaction_id = :transactionId` |

### 4. Call the Endpoint from Your Workflow

Trigger the endpoint from a service task or connector step in your BPMN process. Pass the required reference so the SQL query retrieves the correct record.

---

## Required References

| Reference | Purpose |
|---|---|
| `transactionId` | Retrieves the transaction record for financial checks |
| `caseId` | Retrieves a case record for approval or escalation decisions |
| `applicationId` | Retrieves a loan or application record for risk scoring |

---

## Resolution Order

When the endpoint is called, Appflexor follows this sequence:

1. Look up agent by `agentKey` → retrieve system prompt and AI provider.
2. Look up task by `taskKey` scoped to the agent → retrieve user prompt, SQL query, vector query.
3. Validate required references are present in the payload.
4. Execute SQL query → inject structured transaction data into context.
5. Run vector search → inject semantic compliance rules into context.
6. Call the LLM with the assembled prompt.
7. Return the grounded decision to the workflow.

---

## Tips

- **Pair SQL with vector search for the best results.** SQL gives the agent the exact record; vector search gives it the applicable rules. Together they ground the reasoning completely.
- **Return structured output.** Instruct the agent in its system prompt to respond in a consistent format (e.g. `{ "decision": "APPROVE" | "FLAG" | "ESCALATE", "reason": "..." }`) so the workflow can parse it reliably.
- **Use task-level vector queries to override defaults.** Different tasks within the same agent may need different rule sets — set the vector query at task level to target the right collection.
- **Keep system prompts decision-oriented.** Orchestrate agents should reason and decide — not classify or extract. Use Capture agents for intake enrichment.
