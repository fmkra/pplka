# Compute and Request Optimization Notes

These are the optimization ideas intentionally not implemented yet.

## Exam Answer Persistence

Current behavior: every time the user moves away from an exam question, `sendAnswer()` can call `exam.answerQuestion`. A 50-question exam can therefore create up to about 50 write requests, plus retries or answer changes.

Possible future change: keep answers locally during the exam and persist in batches:

- after every 5-10 changed answers,
- every 30 seconds while dirty,
- when the user finishes the exam,
- when the page is hidden or unloaded, as a best-effort flush.

That would reduce database writes and function invocations, but it changes reliability semantics. The current design persists each answer quickly, which is safer if a tab crashes. A batching design should keep a visible "saving/saved" state and handle failed flushes carefully.

## Exam List Invalidation

Current behavior: `exam.answerQuestion` invalidates `utils.exam.getExams` after every successful answer mutation.

Invalidating does not always mean "fetch immediately", but if the invalidated query is currently mounted/observed, React Query will usually refetch it. So for an active exam flow, invalidating the exam list after every answer can effectively become "refetch the list after every answer".

Invalidating is fine when:

- the query is cheap,
- the query is inactive and will refetch later,
- the invalidation happens at coarse milestones such as exam finish, reset, or returning to the list.

For this app, invalidating the exam list after every answer is probably too eager. A better future change would be to update the relevant cached exam row optimistically, or invalidate only when the exam is finished.

## Learning Progress Indexes

I did not add additional `learning_progress` indexes yet because the best index depends on the actual query plans and table sizes.

The current unique index on `(userId, questionInstanceId)` is good for updating a single answered question. The heavier reads join `learning_progress` to `question_instance`, filter by user/category/attempt state, and order by `random`, `externalId`, and `id`.

Potential indexes to test with `EXPLAIN ANALYZE`:

- `learning_progress(userId, latestAttempt)` if the database first narrows by user and attempt state.
- `learning_progress(userId, random)` if ordered question fetching spends time sorting many rows.
- `question_instance(categoryId, id)` or relying on the new `question_instance(categoryId)` index if the planner starts from category.

The right choice depends on whether Postgres starts from `learning_progress` or `question_instance`, how many rows each user has, and whether sorting dominates.

## Global Session Provider

`SessionProvider` wraps the entire app. That is convenient, but any component that calls `useSession()` can cause `/api/auth/session` traffic on pages that otherwise could be mostly static.

Future options:

- Move `SessionProvider` lower, only around routes/components that need client-side session state.
- Pass server-known auth state into specific client components where possible.
- Replace global login checks with server-rendered auth state for pages that already render on the server.

The tradeoff is complexity: a global provider is easy and consistent, while scoped providers require more deliberate page structure.

## Static JSON / CDN Examples

Some public data changes rarely: licenses, categories, question database pages, explanations, and knowledge-base trees. Instead of fetching all of that through tRPC and the database, we could serve versioned static artifacts.

Examples:

- `/static-data/licenses.json`
- `/static-data/ppla/categories.v12.json`
- `/static-data/ppla/questions.v12.json`
- `/static-data/ppla/explanations.v12.json`

The client would fetch the JSON by license/version and store it in IndexedDB or the browser HTTP cache. A license `version` field can tell the client when to download a newer artifact.

This can cut database compute heavily for public browsing, but it adds a build/publish step for data changes and needs a clear invalidation/versioning story.
