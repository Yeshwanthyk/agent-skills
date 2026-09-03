# Product Analytics / Warehouse Playbook (Databricks SQL adapter example)

## What this source contains

The product-analytics and warehouse category provides the product/data view: what users did, which experiments ran, how feature usage evolved, where a threshold came from, and how data pipelines behaved. Databricks SQL is one adapter example and complements infrastructure observability.

- **Product analytics events.** User behavior such as feature invocations, clicks, accepts, rejects, submissions, and client-reported errors. Discover the available event models and their grain before querying.
- **Usage and billing events.** Cost, volume, request, or consumption records. Confirm their identifiers, units, and deduplication rules.
- **Experiment and feature-flag data.** Exposure and outcome records. Discover their schema before assuming names.
- **System tables.** Platform records that can answer whether a query was expensive, often run, or correlated with load. Their names and retention are adapter-specific.
- **Transformation lineage.** Curated models and their dependencies can reveal which pipelines depend on a table or field.
- **Warehouse notebooks.** Exploratory analyses engineers wrote before code changes may hold rationale. If the available query adapter cannot access notebooks, name that as a gap.

## How to search it

Use the read-only warehouse query tools exposed by the current harness. If the adapter is Databricks SQL, `execute_sql_read_only` and `poll_sql_result` are the corresponding operations; translate the sequence for Snowflake, BigQuery, ClickHouse, dbt, Redshift, or another available warehouse. If a query returns an asynchronous handle, poll it rather than re-running it.

**Orient before querying.** Catalogs, schemas, tables, and columns are environment-specific. Discover them before trusting a name:

```sql
SHOW TABLES IN <catalog>.<schema> LIKE '*<keyword>*';
DESCRIBE TABLE <catalog>.<schema>.<candidate_table>;
```

**Confirm the data contract.** Identify the event time, entity or request identifier, release or experiment key, measure fields, grain, deduplication rule, and retention before analysis.

**Time-bound every query.** Warehouse tables can be large. Use the confirmed event-time field and a window bracketing the ship date, typically about 30 days before and after, wider only for a stated reason.

**Prefer a validated curated model when one exists.** Confirm its grain, refresh lag, lineage, and field meanings. Use raw records only when the curated model lacks the required history or field, and deduplicate using the confirmed identifier.

### Investigation patterns that tend to pay off

Pick the table + column combination that matches the target:

1. **Event usage trajectory.** Daily counts on the relevant confirmed model across a window around the ship date. A step change is circumstantial evidence; check instrumentation changes before attributing it to user behavior.
2. **Guard-rail or defensive-check origin.** Distribution of the relevant confirmed measure before the change. A percentile matching the target threshold is a lead, not direct rationale.
3. **Experiment or feature-flag lookup.** Discover the exposure source, then compare bounded exposure and outcome counts by variant near the decision date.
4. **Query-history evidence for migrations, backfills, or performance rewrites.** Search the platform's confirmed query-history surface for the target table or symbol within a tight window, then summarize duration, bytes, or frequency using available fields.
5. **Transformation lineage.** If the target reads or writes a curated model, hand its repository history to the source-control investigator rather than crossing category boundaries silently.

## What good evidence looks like here

Beyond the pattern shapes above:

- An error-classifying event's count drops to near zero in the days after a defensive-code PR. Suggests the PR resolved that error class
- An exposure table row names the target's feature-flag key with a "shipped" / "concluded" decision around the PR ship date

## Common pitfalls

- **Instrumented ≠ caused.** An event's existence means someone cared enough to log it, not that the target code exists *because* of it. Pair with a PR/commit citation from the git investigator before claiming causation.
- **Silent instrumentation changes.** A step function in event volume may mean a new event started being logged, not that user behavior changed. Check for instrumentation PRs in the same window before reading the ramp as a feature-launch signal.
- **Schema drift.** Event properties evolve; a field on a curated model today may not have existed when the target was written. Older data may carry it only in a raw payload.
- **Transformation refresh lag.** Curated models rebuild on their own schedule. For recent events, use a confirmed raw source only when necessary and deduplicate with its documented identifier.
- **Company-specific tables.** Experiment, feature-flag, billing, and usage tables vary. Reporting a result from a table whose existence you never confirmed is a classic failure mode. Probe with `SHOW TABLES` / `DESCRIBE TABLE` first.
- **Retention cliff.** If the relevant window predates the table's retention or the dbt model's creation date, that's a *gap*, not a null result. Name it explicitly so the synthesizer doesn't read "no results" as "no activity."
- **Notebook access varies.** If the available query tools cannot see exploratory notebooks, return that as a gap when a notebook is a plausible lead.

## What to return

For each relevant finding:
- Type (product event / experiment exposure / usage or billing event / system-table row / dbt model)
- Fully-qualified table name and the exact query you ran
- Time window queried
- Compact numeric summary (counts, percentiles, first/last-seen timestamps). **Don't dump raw rows.**
- Temporal correlation with the target's ship date (e.g., "first row 2024-08-15; PR #49074 merged 2024-08-14")
- Relevance + strength: direct / circumstantial / weak
