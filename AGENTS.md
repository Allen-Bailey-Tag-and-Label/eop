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

- Reuse components from `src/lib/components` first.
- If a suitable component is not available there, use `sveltewind/components`
  from the npm package.
- Follow existing component usage and styling patterns.

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

- Maintain `changelog.md` as the commit message history, newest entries first.
- To use the VS Code Source Control Commit button, first run
  `npm run changelog -- "Commit message"`. It records the message and stages
  `changelog.md` without committing. Use that same message in Source Control.
- Alternatively, run the VS Code task `Commit staged changes with changelog`
  and enter the message once. It runs `npm run commit -- "Commit message"`,
  which updates the changelog and commits the staged files together.
- Stage all intended changes before running the command; it does not stage
  unrelated files automatically. Multiline commit messages are supported as a
  single argument.
- Agents set up and maintain this workflow but do not run the commit command
  unless the user explicitly requests a commit.

## Current technical conventions

- SvelteKit with Svelte 5 and TypeScript.
- Tailwind CSS for styling.
- npm with the existing package-lock.json.
- Follow the repository's Prettier and ESLint configuration. Prettier uses tabs,
  single quotes, no trailing commas, and a print width of 100.
- In addition to required linting and type checking for code changes, use
  `npm test` and `npm run build` when appropriate to the affected behavior.
