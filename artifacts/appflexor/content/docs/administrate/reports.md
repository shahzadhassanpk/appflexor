# Custom Reports & Analytics

## Purpose

The **Custom Reports & Analytics** area gives administrators the tools to define, deploy, and run reports and multidimensional analyses against your business and process data — without writing application code. You can deploy pre-built report templates, configure dynamic reports with custom parameters, design **Analytic Cubes** that model your data dimensions and measures, and run ad-hoc queries with filtering, grouping, and chart visualisation.

---

## Key Concepts

| Term | Description |
|---|---|
| **Custom Report** | A named report definition (typically a Jasper report template) that can be rendered on demand with optional parameters. |
| **Report Configuration** | A set of parameters, filters, and data bindings that customise how a report is generated and what data it shows. |
| **Analytic Cube** | A multidimensional data model that defines the **Dimensions** (categories to group by) and **Measures** (numeric values to aggregate) for a dataset. |
| **Dimension** | An attribute used to slice and group data (e.g., Department, Month, Status). |
| **Measure** | A numeric value to aggregate (e.g., Count, Total Cost, Average Duration). Can include **Formulas** and **Percentile** calculations. |
| **Analytic Query** | A runtime query run against an Analytic Cube where the user selects dimensions, measures, and filters to produce a result set. |
| **Index** | The data source backing an Analytic Cube — a named connection to a PostgreSQL data source or API key. |
| **Search Criteria** | Runtime filter inputs on an Analytic Query — supports text fuzzy search and between (range) filters. |

---

## Step-by-Step Usage

### Custom Reports

#### Deploy a Report Template

1. Navigate to **Administrate Custom Reports → Custom Reports**.
2. Click **Add New**.
3. Upload the report template file (Jasper `.jrxml` or compiled `.jasper`).
4. Set:
   - **Report Name** — the display label in the report catalogue.
   - **Description** *(optional)*.
5. Click **Save**. The report is now available to run.

#### Search and Run Reports

1. Use the search bar in the **Custom Reports** list to find reports by name.
2. Click a report to open it.
3. Fill in any required parameter fields.
4. Click **Run** to generate the report output.

#### Edit or Delete a Report

- Click **Edit** to update the template file or report settings.
- Click **Delete** to remove a report. Confirm before deleting — this is permanent.

---

### Report Configuration

Report configurations allow you to define reusable parameter sets for a report — so the same base template can produce different outputs (e.g., a monthly HR report vs. a weekly operations report).

1. Go to **Administrate Custom Reports → Report Configurations**.
2. Click **Add New**.
3. Select the **Base Report** to configure.
4. Define parameter defaults, filter values, and display options.
5. Click **Save**. The configured report appears as a distinct item in the report catalogue.

---

### Analytic Cubes

#### Create an Analytic Cube

1. Go to **Administrate Custom Reports → Analytic Cubes**.
2. Click **Add New**.
3. Fill in the **Index** settings:
   - **Name** — the cube's display name (e.g., `Leave Analytics`).
   - **Data Source** — select a connected PostgreSQL database or API key.
   - **Data Source Name** *(optional)* — a label for the data connection.
4. Define **Dimensions** — click **Add Dimension** for each attribute to group by:
   - Set the **Label** (display name) and **Reference** (database column or field name).
5. Define **Measures** — click **Add Measure** for each numeric value to aggregate:
   - Set the **Label**, **Reference** (column/expression), and optional **Formula** (e.g., `SUM`, `AVG`, `COUNT`).
   - Optionally enable **Percentile** calculation and set the percentage.
6. Click **Save**.

#### Edit an Analytic Cube

1. Find the cube in the Analytic Cubes list.
2. Click **Edit** to add, remove, or rename dimensions and measures.
3. Click **Save**. Changes take effect immediately for new queries.

---

### Analytic Queries

Analytic Queries let you run ad-hoc analysis against a configured Analytic Cube.

1. Go to **Administrate Custom Reports → Analytic Queries**.
2. Select the **Analytic Cube** to query.
3. **Search Criteria** — add filters:
   - **Text / Fuzzy** — free-text search across selected fields.
   - **Between** — date or numeric range filter.
4. **Dimensions (Rows)** — select which dimensions to include as row groupings.
5. **Measures** — select which measures to calculate and display as columns.
6. Click **Run** to execute the query.
7. Results display as:
   - **Table** — rows and columns with pagination (First / Previous / Next / Last page).
   - **Line Chart** — trend visualisation for time-based dimensions.
8. Adjust filters, dimensions, or measures and re-run as needed for exploratory analysis.

---

## Best Practices

- **Design Analytic Cubes before building reports.** A well-structured cube with the right dimensions and measures makes ad-hoc analysis fast — users can self-serve without requesting new reports.
- **Name dimensions and measures in business terms.** Use "Department" not "dept_id", "Total Cost" not "sum_amt" — these labels appear directly in the query UI.
- **Use Formulas for derived metrics.** Rather than creating a new column in your database for calculated values, express them as Measure Formulas (e.g., average handling time from start and end timestamps).
- **Add Search Criteria defaults for common filters.** If most users always filter by the current month or their own department, configure those as default filter values on the Analytic Cube.
- **Limit unconstrained queries.** Analytic queries that return millions of rows without filters are slow and unhelpful. Add required filters or sensible result limits in the cube configuration.
- **Use Report Configurations for scheduled outputs.** Create a Report Configuration for each recurring reporting need (weekly, monthly, by-department) rather than having users re-enter parameters each time.
- **Separate reporting data sources from operational ones.** Connect Analytic Cubes to a read replica or reporting database rather than the live operational database, to avoid impacting application performance.
