# WhatsNote
Send yourself messages, organize your notes, and sync them with all your devices in a freaking simple PWA


# Development

This mono repository contains the backend (Fastify API server) and frontend code (Vite+Svelte SPA). The project uses _npm workspaces_. See [their docs](https://docs.npmjs.com/cli/v8/using-npm/workspaces) for more info about the CLI commands.

### Install

In the root directory, run `npm ci --workspaces`.

### Run the API server

```
# Navigate to the backend/src dir and set the
# environment variables before starting the server
COOKIE_SECRET=xxx node index.js

# If you start the server through the npm script,
# you won't be able to gracefully shutdown the server
npm run start --workspace backend
```

### Run the Vite dev server

```
npm run dev --workspace frontend
```

### Build the SPA

### Update

Run `npm update --workspaces --dry-run` for a dry run and check which packages would be updated. You can then check their changelog and make sure the update is desired. Remove the `--dry-run` flag to install the updated packages.
