# Subscription Management

## Purpose

The **Subscription** area lets tenant administrators view their current Appflexor plan, understand what features and services are included, manage the number of licensed users, switch between subscription packages, and cancel their subscription. Billing is handled securely through **Stripe** — Appflexor does not store payment card details directly.

---

## Key Concepts

| Term | Description |
|---|---|
| **Package** | A named subscription tier (e.g., Starter, Professional, Enterprise) with a defined set of features, services, and a base user count. |
| **Feature** | A specific product capability included in a Package (e.g., Process Automation, Custom Reports). |
| **Service** | A platform-level service allocated to a Package (e.g., API calls, storage quota). |
| **Base Users** | The number of user accounts included in the Package base price. |
| **User Limit** | The total maximum number of active users allowed under your current subscription (base + any additional users purchased). |
| **Active Users** | The count of user accounts currently active in your tenant — must stay within your User Limit. |
| **Price per User** | The incremental cost added on top of the base package price for each user above the base count (calculated as `base_price + (additional_users × margin)`). |
| **Subscription ID** | The Stripe subscription identifier for your tenant's current billing record. |
| **Client Reference ID** | An internal identifier linking your Appflexor tenant to your Stripe customer record. |

---

## Step-by-Step Usage

### View Your Current Subscription

1. Navigate to **Administrate → Subscription**.
2. The page shows:
   - Your **Current Package** name and included features/services.
   - **Active Users** — how many user accounts are currently active.
   - **User Limit** — the maximum users allowed under your plan.
   - **Subscription ID** — your Stripe billing reference.

---

### Change Your User Limit

If your team is growing and you need more users, you can increase your User Limit without switching packages:

1. Go to **Administrate → Subscription**.
2. Under **User Limit**, select the new limit from the dropdown (options: Up to 2 / 5 / 10 / 25 / 50 / 100 / 250 users).
3. The **calculated price** updates to reflect the new total (base price + per-user margin × additional users).
4. Click **Update User Limit**.
5. The change is processed via Stripe immediately and the page refreshes to confirm the new limit.

> ℹ️ You cannot set a User Limit lower than your current **Active Users** count. Deactivate user accounts first if you need to downgrade.

---

### Switch Subscription Package

To move to a different tier (upgrade or downgrade):

1. Go to **Administrate → Subscription**.
2. Review the available packages and their included features and services.
3. Select the target **Package**.
4. Choose your desired **User Limit** for the new package.
5. Review the new calculated price.
6. Click **Switch Package**.
7. Appflexor initiates a Stripe subscription change. The page reloads after Stripe confirms the switch.

> ⚠️ **Downgrading** to a package with fewer features will immediately remove access to those features for all users in your tenant. Review the feature list carefully before downgrading.

---

### Cancel Your Subscription

1. Go to **Administrate → Subscription**.
2. Click **Cancel Subscription**.
3. Confirm the cancellation in the confirmation prompt.
4. The subscription is cancelled in Stripe. Access to paid features will continue until the end of the current billing period, after which the tenant will revert to a free/inactive state.

> ⚠️ Cancellation is irreversible through the self-service UI. If you cancelled by mistake, contact Appflexor support immediately.

---

### Understanding the Pricing Calculation

Your monthly charge is calculated as:

```
Total = Base Price + (max(0, User Limit − Base Users) × Per-User Margin)
```

**Example:**
- Package base price: $99/month, includes 5 users, $15/user margin.
- You set a User Limit of 10.
- Additional users: 10 − 5 = 5
- Total: $99 + (5 × $15) = **$174/month**

The current calculated price is always shown on the subscription page before you confirm any change.

---

## Best Practices

- **Monitor Active Users regularly.** Check your Active Users count monthly against your User Limit — approaching the limit should prompt you to review inactive accounts or upgrade.
- **Deactivate unused accounts before downgrading.** User Limit can only be reduced to at or above your Active Users count. Clean up stale accounts first.
- **Review the feature list before switching packages.** Downgrading removes feature access immediately — communicate the change to your team before confirming.
- **Keep billing contact details current in Stripe.** Stripe manages invoicing and payment retry — ensure your payment method and billing email are up to date to avoid service interruption.
- **Use the Subscription ID for support enquiries.** When contacting Appflexor support about billing issues, always quote your Subscription ID to speed up resolution.
- **Plan upgrades before you hit the limit.** Trying to onboard new users when you are at your User Limit will block their access. Upgrade the limit a few users ahead of actual headcount.
