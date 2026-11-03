# CHANGELOG b43 — Task SLA & Next Action Intelligence

- Added explainable runtime SLA assessment for completed, breached, at-risk, on-track, and unscheduled tasks, including invalid deadline handling.
- Added rule-based next-action recommendations: start, schedule, follow up, escalate/review assignment, or archive/review outcome. Recommendations do not mutate records or claim background execution.
- Added an attention ranking helper that combines existing task score with SLA/action urgency; active tasks only.
- Integrated SLA state and the reasoned next action into each TaskCard so the task list surfaces operational urgency rather than only title/date/assignee.
- Added regression coverage for SLA states, next-action rules, and attention ordering.
- This is client-side/source-level intelligence. It does not replace server-side scheduler/escalation, audit persistence, notifications, or authorization enforcement.
