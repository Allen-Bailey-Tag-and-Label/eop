# Project guidance

## Purpose and priorities

EOP stands for Employee Online Portal. It provides tools for the team at
Allen-Bailey Tag & Label and is already in production.

Prioritize reliability, accuracy, and conformance to project standards. Review
existing implementations and repository configuration before introducing new
patterns. Follow the existing code as the source of project standards. Preserve
existing behavior outside the requested change.

## Scope of work

- Keep changes within the scope of the user's prompt.
- Update dependent files when necessary to complete the requested change.
- Do not expand the task into unrelated fixes, refactoring, or formatting changes.

## Permissions

The application has an extensive user and role permission structure. Roles are
assigned to users in the database, and permissions are enforced centrally in
`src/hooks.server.ts`. Routes and features do not need duplicate route or
permission checks. Follow the existing centralized enforcement pattern.

## UI components

- Import UI components through `src/lib/components`, which re-exports Sveltewind.
- Prefer Sveltewind implementations. Keep a local override only when it has
  materially different behavior that the package cannot preserve.
- When application defaults or props differ, prefer a thin adapter around the
  Sveltewind component (for example, Button with `type="button"`) rather than
  duplicating its native element. Preserve app-specific composition where needed.
- Preserve the existing appearance through the application theme bridge in
  `src/lib/theme/sveltewind.ts` rather than duplicating simple library components.
- Follow existing component usage and styling patterns.
- Use the shared `Tabs` component with its `tabs` options for switching between
  sibling views or sections. Keep tab styling uniform site-wide: selected tabs
  use the site's primary Button with white text; inactive tabs use its ghost
  variant. Keep sizing, spacing, and colors in the shared theme/adapter, not in
  individual screens. Do not build tab selectors from standalone buttons.
- Put reusable application components in `src/lib/components/<Name>/<Name>.svelte`
  and export them through `src/lib/components/index.ts`. Keep feature-specific
  editors and configuration outside the shared component directory.
- Follow the Sveltewind component architecture: typed `Props`, Svelte 5 `$props()`
  and `$bindable()` where needed, forwarded native/library props and snippets,
  `class`/`variants` composed with `twMerge`, and defaults in the shared theme.
  Review a comparable component before adding one; prefer thin library adapters
  that preserve the underlying library's capabilities.
- Before adding or changing UI, inspect a comparable existing screen and the
  application theme. Reuse its components and variants instead of inventing a
  separate visual treatment.
- Use the themed `Card` component for panel surfaces and grouped list entries,
  including nested configuration sections. Use `Div` for layout, not as a
  replacement Card with custom borders, backgrounds, shadows, or corner radii.
  Keep layout/spacing utilities local; let the shared component theme provide
  appearance. Do not add ad hoc `border-gray-*` panel outlines. Any necessary
  shared appearance change belongs in the theme bridge.
- Every icon-only dialog close button must use `Button` with the `icon` variant
  and an accessible `aria-label`. Combine `ghost` with `icon` when the existing
  dialog style calls for it; `ghost` alone does not size an icon button. Do not
  replace or override the variant's sizing with manual width, height, or padding
  utilities. Apply this rule to all new and modified dialogs.
- Dialog titles must use `H2` with `class="text-lg"`, matching existing dialogs.
  Do not use page-sized headings inside dialogs; use `text-base` or smaller
  headings for nested sections.
- Keep CRUD operations separate from collection lists. Show the list and an Add
  button in the collection view; open create/edit forms and delete confirmations
  in separate dialogs. Never place a create/edit form above or beside its list.
- Keep `export * from 'sveltewind/components';` in `src/lib/components/index.ts`
  so new library exports are available automatically. Explicit local exports
  override matching names. Consumers that enumerate components must exclude
  noncomponent helpers exported by the library.

## Database changes

Schema changes and migrations needed for the requested task are authorized.
Include them in the staged changes for local review. The user reviews changes
locally before committing or publishing.

## Review and delivery

- Code changes must pass linting (`npm run lint`) and type checking
  (`npm run check`). Report failures and distinguish existing issues from issues
  introduced by the change.
- Stage the files changed for the task. Do not stage unrelated user changes.
- Do not commit, push, or publish changes. The user reviews staged changes and
  handles committing and publishing to GitHub after approval.
- Summarize the changes, verification results, and any unresolved issues.
- At the end of every prompt, provide a suggested commit message covering all
  currently changed files, including existing staged and unstaged changes.
  Inspect those changes before writing the message.

## Changelog and commits

- Prefix every suggested commit message with `fix: `, `feat: `, or `refactor: `,
  choosing the prefix that best describes the complete change.
- The user keeps using VS Code Source Control: enter the supplied message and
  click Commit. Do not require a terminal command or VS Code task from the user.
- At the end of each task with file changes, assume the current changes will be
  approved for purposes of preparing `changelog.md`. This does not authorize
  agents to commit, push, or publish.
- Inspect all staged and unstaged changes and prepare one commit message covering
  the complete current diff. Run `npm run changelog -- "Commit message"` on the
  user's behalf and stage `changelog.md` with the task changes. Supply the same
  message in the final response.
- Before preparing the entry, reconcile the changelog with actual Git history.
  The helper rebuilds committed entries from first-parent history starting with
  the commit that introduced the changelog. Git's actual commit messages and
  dates are authoritative, including when the user changes the proposed message.
- Present the latest message under a normal date heading, assuming the user will
  commit the presented changes. Never use a Pending heading or status label.
- Keep exactly one dated entry for all current uncommitted changes. Replace
  prior uncommitted proposals instead of accumulating them. Remove stale or
  rejected messages that do not correspond to committed history; do not treat
  approval assumptions as evidence that a commit happened.
- After the user commits, reconcile the entry's date and message with the actual
  commit on the next update. No hooks, automatic commits, or history rewriting
  are used.

## Current technical conventions

- SvelteKit with Svelte 5 and TypeScript.
- Tailwind CSS for styling.
- npm with the existing package-lock.json.
- Follow the repository's Prettier and ESLint configuration. Prettier uses tabs,
  single quotes, no trailing commas, and a print width of 100.
- In addition to required linting and type checking for code changes, use
  `npm test` and `npm run build` when appropriate to the affected behavior.
