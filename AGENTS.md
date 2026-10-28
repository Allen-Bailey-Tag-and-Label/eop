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
