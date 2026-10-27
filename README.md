# sv

## Committing changes

Keep using VS Code Source Control: review the staged changes, enter the suggested
commit message, and click **Commit**. Include the staged `changelog.md` file.
No task or terminal command is required from the user.

At the end of a task, the agent prepares and stages one dated changelog entry
covering all current changes, assuming they will be committed as presented. There
is no Pending heading. If more work happens before committing, the agent
replaces that proposal with the updated message rather than adding another entry.

Before each update, the agent reconciles the changelog with Git's first-parent
history, starting with the commit that introduced the changelog. Actual commit
messages and dates replace stale proposals, including when the user edits the
message before committing. Commits made without updating the changelog are also
included on the next reconciliation. The latest entry's date and message are
reconciled with the actual commit during the next task.

The agent's helper is `npm run changelog -- "Proposed commit message"`. It only
writes the changelog; it never stages files, commits, or rewrites Git history.
Agents stage the result as part of their normal handoff. Reconciliation requires
the local Git history; shallow clones can only reflect the history available.

Test reconciliation with `node --test scripts/update-changelog.test.js`.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
