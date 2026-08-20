# Custom Reports and Analytics

## Purpose

Use **Custom Reports and Analytics** to deploy custom reports that analyze data streams and generate actionable insights for decision-making. The area lets teams define, deploy, and run reports and multidimensional analyses against business and process data without writing application code.

---

## Key Concepts

| Term | Description |
|---|---|
| **Custom Report** | A named report definition, typically based on a Jasper report template, that can be rendered on demand with optional parameters. |
| **Report Configuration** | A reusable set of parameters, filters, and data bindings that customizes how a report is generated. |
| **Analytic Cube** | A multidimensional data model that defines the dimensions and measures available for a dataset. |
| **Dimension** | An attribute used to slice and group data, such as Department, Month, or Status. |
| **Measure** | A numeric value to aggregate, such as Count, Total Cost, or Average Duration. |
| **Analytic Query** | A runtime query that uses an Analytic Cube’s dimensions, measures, and filters to produce a result set. |

---

## Custom Reports

### Deploy a Report Template

1. Open **Integrate → Custom Reports and Analytics**.
2. Select the **Custom Reports** tab.
3. Click **Add New**.
4. Upload the report template file, such as a Jasper `.jrxml` or compiled `.jasper` file.
5. Enter the report name and an optional description.
6. Click **Save**.

### Configure a Report

1. Select the **Reports Configurations** tab.
2. Click **Add New**.
3. Select the base report to configure.
4. Define parameter defaults, filter values, and display options.
5. Save the configuration.

---

## Analytic Cubes

1. Select the **Analytic Cubes** tab.
2. Click **Add New**.
3. Choose the data source or index for the cube.
4. Define the dimensions that users can group by.
5. Define the measures and any required formulas.
6. Save the cube.

Use business-friendly labels for dimensions and measures because these labels appear directly in the query experience.

---

## Analytic Queries

1. Select the **Analytic Queries** tab.
2. Choose an Analytic Cube.
3. Add search criteria, dimensions, and measures.
4. Run the query to review the results in a table or chart.
5. Refine filters and groupings as needed to answer the business question.

---

## Best Practices

- Design Analytic Cubes before building reports so teams can reuse the same dimensions and measures.
- Use clear business names instead of database column names.
- Apply sensible filters and result limits to avoid slow, unhelpful queries.
- Separate reporting data sources from operational databases where possible.