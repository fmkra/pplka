# Repository guidance

## Public page modification dates

When changing meaningful user-visible or indexable copy in a public page, also
update the corresponding value in `src/content/static-page-updated-at.ts`.

Do not change these dates for styling-only work, dependency updates,
refactoring, instrumentation, or infrastructure changes. Database-driven
content changes must update `content_revision` through the relevant importer or
mutation flow instead of changing a static date.

When adding a public indexable route, add its static content date and decide
which database revisions affect its sitemap `lastModified` value.

## Database-driven content revisions

Content importers and mutations must keep `updatedAt` accurate and record every
affected public path in `content_revision`. Direct question, explanation,
knowledge-base node, category, and licence updates have database triggers that
maintain their row timestamp. Relationship changes still require explicit page
revisions because a deleted relationship has no remaining row timestamp.

In particular, trace changes to question/explanation links, knowledge-base
node/explanation links, question/category assignments, category configuration,
and licence assignments to every affected sitemap path. Use an idempotent
source revision so retrying an unchanged import does not advance `updatedAt`.
Revalidate `/sitemap.xml` whenever page revisions or sitemap membership change.
