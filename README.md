# WhatsNote
Send yourself messages, organize your notes, and sync them with all your devices in a freaking simple PWA


# Development

This mono repository contains the backend (Fastify API server) and frontend code (Vite+Svelte SPA). The project uses _npm workspaces_. See [their docs](https://docs.npmjs.com/cli/v8/using-npm/workspaces) for more info about the CLI commands.

### Install

In the root directory, run `npm ci --workspaces`.

### Run the API server

```
# Set the environment variables before starting the server
COOKIE_SECRET=xxx node backend/src/index.js

# If you start the server through the npm script,
# you won't be able to gracefully shutdown the server
npm run start --workspace backend
```

### Run the Vite dev server

```
npm run dev --workspace frontend
```

### Run a reverse proxy

```
docker run --rm --network host --name caddy -v $PWD/Caddyfile:/etc/caddy/Caddyfile caddy
```

### Build the SPA
```
npm run build -w frontend
```

### Build and run the production container
```
docker build -t whatsnote .

docker run --name whatsnote -d -p 8099:8080 -e COOKIE_SECRET=... whatsnote
```

### Update dependencies

Run `npm outdated` or `npm update --workspaces --dry-run` to check which packages would be updated. You can then check their changelog and make sure the updates are desired. Remove the `--dry-run` flag (and optionally set a workspace) to install updates.
