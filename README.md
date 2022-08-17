# note-messenger
Send yourself messages, organize your notes, and sync them with all your devices in a freaking simple PWA


# Development

This mono repository contains the backend (Fastify API server) and frontend code (Vite+Svelte SPA). The project uses _npm workspaces_. See [their docs](https://docs.npmjs.com/cli/v8/using-npm/workspaces) for more info about the CLI commands.

### Install

In the root directory, run `npm ci --workspaces`.

### Run the API server

```
# Set the environment variables first
npm run start --workspace backend
```

### Run the Vite dev server

### Build the SPA

### Update

Run `npm update --workspaces --dry-run` for a dry run and check which packages would be updated. You can then check their changelog and make sure the update is desired. Remove the `--dry-run` flag to install the updated packages.
