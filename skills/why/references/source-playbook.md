# Source playbooks

The `why` skill runs one bounded investigator per available evidence category. Each investigator reads the single category playbook below, then adapts its query vocabulary and result handling to the evidence tools exposed by the current harness. The named providers are adapter examples, not requirements.

| Category | Playbook | Adapter example |
|---|---|---|
| Source control history | [`code-archaeology.md`](./sources/code-archaeology.md) | git and a hosted PR tool |
| Issue / ticket tracker | [`linear.md`](./sources/linear.md) | Linear, Jira, GitHub Issues, Plane, or Shortcut |
| Long-form documents | [`notion.md`](./sources/notion.md) | Notion, Confluence, Google Docs, or Coda |
| Real-time team chat | [`slack.md`](./sources/slack.md) | Slack, Discord, Microsoft Teams, or Mattermost |
| Infrastructure observability | [`datadog.md`](./sources/datadog.md) | Datadog, New Relic, Honeycomb, Grafana, or Splunk |
| Error / exception tracking | [`sentry.md`](./sources/sentry.md) | Sentry, Rollbar, Bugsnag, or Airbrake |
| Product analytics warehouse | [`databricks.md`](./sources/databricks.md) | Databricks SQL, Snowflake, BigQuery, ClickHouse, dbt, or Redshift |

Cross-cutting:

- [`incident-postmortem.md`](./sources/incident-postmortem.md). Add this to the relevant investigator when the target is defensive: null checks, retries, timeouts, rate limits, feature flags, egress guards, or OOM handlers.
