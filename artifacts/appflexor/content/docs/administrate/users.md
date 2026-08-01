# Users, Groups & Organisations

## Purpose

The **Users, Groups & Organisations** area is the central control panel for managing who can access Appflexor and what they are allowed to do. Here you create and maintain user accounts, organise them into **Groups** (for permission assignment), and structure them into **Organisations** (for reporting lines, multi-tenancy, and site association). Access to this area is restricted to system administrators.

---

## Key Concepts

| Term | Description |
|---|---|
| **User** | An individual person with a login account. A user has a username, email, role, and optional organisation membership. |
| **Group** | A named collection of users used for access control. Permissions on processes, sites, and content are granted to Groups, not individual users. |
| **Security Group** | A specialised group type that controls access to specific system features or modules. |
| **Organisation** | A structural entity representing a company, department, or team. Organisations can have multiple users and are associated with specific sites. |
| **Associated Site** | A website or channel linked to an Organisation, controlling which application environment that organisation's users can access. |
| **Role** | A system-level label assigned to a user (e.g., administrator, standard user) that governs broad access rights. |
| **Feature Subscription** | The set of modules and features a tenant has purchased, which gates visibility of admin tabs and capabilities. |

---

## Step-by-Step Usage

### Managing Users

#### Create a User

1. Navigate to **Administrate System → Users**.
2. Click **Add New**.
3. Fill in:
   - **Username** — the login identifier (cannot be changed after creation).
   - **Email** — used for notifications and password reset.
   - **First Name / Last Name**.
   - **Role** — assign the appropriate system role.
   - **Organisation** *(optional)* — link the user to an organisation.
   - **Password** — set an initial password (the user should change it on first login).
4. Click **Save**.

#### Edit a User

1. Find the user in the list using the search bar.
2. Click the **Edit** icon.
3. Update permitted fields (email, name, role, organisation).
4. Click **Save**.

#### Deactivate or Delete a User

- **Deactivate** — edit the user and toggle **Active** to off. The user cannot log in but their history is preserved.
- **Delete** — click the **Delete** icon and confirm. Deleted users cannot be recovered. Prefer deactivation for audit trail purposes.

#### Reset a User Password

1. Open the user record.
2. Click **Reset Password** — a reset email is sent to the user's registered address.

---

### Managing Groups

#### Create a Group

1. Go to **Administrate System → Security Groups**.
2. Click **Add New**.
3. Enter a **Group Name** and optional **Description**.
4. Click **Save**.

#### Add Members to a Group

1. Open the Group.
2. Click **Add Member**.
3. Search for and select users to add.
4. Click **Save**.

#### Assign a Group to a Process or Site

Groups control who can see and start processes:
- In **Process Map** configuration, add the relevant Groups to restrict or grant process access.
- In **Site Administration → Authorization**, assign Groups to control page and content access.

---

### Managing Organisations

#### Create an Organisation

1. Go to **Administrate System → Organisations**.
2. Click **Add New**.
3. Fill in the Organisation **Name**, **Code**, and optional **Description**.
4. Click **Save**.

#### Add Users to an Organisation

1. Open the Organisation record.
2. Go to the **Users** tab.
3. Click **Add User** and search for the user to link.
4. Click **Save**.

#### Associate a Site with an Organisation

1. Open the Organisation record.
2. Go to the **Associated Sites** tab.
3. Select the site(s) this organisation's users should access.
4. Click **Save**.

---

## Best Practices

- **Use Groups for all access control — never grant access to individual users.** Assigning permissions to groups makes onboarding and offboarding fast — just add or remove the user from the relevant groups.
- **Follow the principle of least privilege.** Assign the minimum role and group memberships required for a user to perform their job. Review quarterly.
- **Deactivate rather than delete.** Deactivated users retain their history and audit trail. Delete only test or duplicate accounts.
- **Name Groups by function, not person.** Use `HR Managers` not `John's Group` — groups should outlive any individual member.
- **Use Organisations to mirror your structure.** If your company has departments or subsidiaries that access different sites, model each as a separate Organisation with its own site associations.
- **Audit regularly.** Use the user list and group membership views to review who has access. Remove users who have left the organisation promptly.
- **Enforce strong passwords.** Set a password policy appropriate for your security requirements and use the password-reset flow rather than sharing passwords verbally.
