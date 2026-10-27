# sv

## Committing changes

To use VS Code's Source Control Commit button, stage your intended files and run:

```bash
npm run changelog -- "Describe the changes"
```

This records the message and stages `changelog.md` without committing. Enter
the same message in Source Control and click Commit.

To avoid typing a terminal command or entering the message twice, stage files
in Source Control, open the Command Palette, choose **Tasks: Run Task**, and
select **Commit staged changes with changelog**. Enter your message once when
prompted. The task updates the changelog and commits all staged changes.

You can also run the complete workflow directly:

```bash
npm run commit -- "Describe the changes"
```

This command prepends a UTC timestamp and the complete commit message to
`changelog.md`, stages the changelog, and commits it with your already staged
files. Other unstaged files remain outside the commit. Use a single quoted
argument for the message; it can include multiple lines.

If a commit fails, the changelog entry remains staged for review. Retry with the
same message to reuse that entry. Review and stage any manual changelog edits
before using the command.

Test the commit workflow in temporary repositories with
`node --test scripts/commit.test.js`.

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
