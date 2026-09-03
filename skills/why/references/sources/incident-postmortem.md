# Incident and Postmortem Context

This is a cross-cutting angle, not a separate evidence category. Use it when the target looks defensive: null checks, retries, timeout handling, rate limits, feature flags, egress guards, OOM handlers, or corrective fallbacks.

Search the incident record in each available category using the target file, feature, error string, commit/PR date, and known identifiers:

- **Long-form documents:** postmortems, action items, incident reviews, and runbooks.
- **Issue or ticket tracking:** incident, severity, postmortem-action-item, and reliability labels plus linked tickets.
- **Real-time team chat:** incident or severity channels and threads around the target's change window.
- **Source control:** commits mentioning an incident, defensive check, revert, or re-apply, plus the linked review record.
- **Infrastructure observability:** formal incidents, monitor changes, dashboards, logs, and traces around the target's change window.
- **Error tracking:** first-seen/last-seen windows, stack traces through the target, release boundaries, and issue comments.
- **Product analytics / warehouse:** client-reported failures, user-visible retries, error-classified events, and pre/post change counts.

If an incident link appears, fetch the full record and its action items. Report the incident timeline, exact linkage to the target, and any competing changes. Cross-category corroboration strengthens confidence, but a spike before a change or a drop after it is circumstantial until a source explicitly connects the two.

If no incident record is found, report the bounded searches and null result. If a plausible postmortem lives in a notebook, private channel, unavailable system, or expired retention window, report that as a source gap rather than treating it as evidence that no incident existed.
