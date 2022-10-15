# WhatsNote 📝
Send yourself messages, cache your notes, and sync them with all your devices

<details>
<summary><b>Click me</b> to read why I have developed this app</summary>

**Background story**

I have tried numerous note apps but none of them convinced me in the long run. For example, they gave me too much structure, were too bloated, or I couldn't write down random things fast enough. A simple text file that I used like a large cache, on the other hand, worked relatively well. The only problems with this file, however, were that I still tried to separate things structurally with markers and did not synchronise the file between my devices. I resolved the latter by sending myself messages on WhatsApp while away from keyboard, which I then later manually synchronised in the text file.

For a few years now, I've been sending myself messages on WhatsApp with all kinds of things that come to mind, things I have to do, things I should remember and things I want to read later. The advantage is that I can send anything easily and super fast and it is directly synchronised with all devices. However, it's easy to lose track of things and "tagging" with prefixes and the search function is cumbersome. In addition, WhatsApp or other messengers can be quite distracting. Examples are when you open the web client during an intensive work session because you want to search for a message and are then confronted with new messages from friends, or when you compose a longer message while brainstorming and receive messages.

WhatsNote focuses only on the use case of sending, tagging and checking off messages quickly and distraction-free. In addition, the scratchpads make it easy to collect ideas and organise thoughts.
</details>

## Features
- Tiny, installable, [progressive web app](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) that works offline
- Chat with yourself
  - Tag and send a message in one click
  - Super quickly filter messages by tag
  - Check off, edit, or delete messages
  - Hide checked off messages
  - Search messages with a fuzzy search
- Quickly organize your thoughts in plain text scratchpads
- Live sync with all your devices
- No distractions - only pure functionality

## Shortcuts
- Just start typing and the chat input focuses automatically
- <kbd>Ctrl</kbd> + <kbd>Space</kbd> to focus the chat input
- <kbd>Tab</kbd> to focus the send button and cycle through the message tags
- <kbd>Esc</kbd> to leave the focus of the send buttons and focus the input field again
- <kbd>Ctrl</kbd> + <kbd>z</kbd> or <kbd>Ctrl</kbd> + <kbd>y</kbd> to undo/redo

## Deployment
The production release of WhatsNote runs in a single Node.js-based Docker container. You can find the [Dockerfile here](./Dockerfile). You can run the container with the following environment variables:

- PORT (default=8080, `integer`, port at which the server should listen)
- LOG_LEVEL (default=warn, `string`, one of trace, debug, info, warn, error, or fatal)
- COOKIE_SECURE (default=true, `boolean`, send cookie only on secure connection)
- COOKIE_MAX_AGE (default=30 days, `integer`, number of milliseconds until the session cookie expires)
- COOKIE_SECRET (required and minimum 32 characters long, `string`, to sign the cookie)

### Build and run the production container
```
git clone git@github.com:bttger/whats-note.git
cd whats-note
docker build -t bttger/whatsnote:<tag> .
docker run --name whatsnote -d -p 8080:8080 -e COOKIE_SECRET=... whatsnote
```

The container runs a simple Node.js server without TLS termination. When running it in production, you should always run a TLS termination proxy in front of it to encrypt the communication between client and server. Look into [Certbot](https://certbot.eff.org/), [Caddy](https://caddyserver.com/docs/getting-started), or other tools that provide simple TLS termination. The following command starts a Caddy proxy which automatically provisions a TLS certificate to encrypt traffic. But keep in mind that you need to open port 80 and 443, and you need to link your public domain name to the IP address of your server.

```
caddy reverse-proxy --from MY-DOMAIN.xyz --to localhost:8080
```

This repository also contains a half-baked Helm chart to deploy a single container to a Kubernetes cluster. I solely created it because I already had a cluster running and wanted to quickly deploy it for some friends. Usually Kubernetes is totally overkill for this app.

```
# Create a values.local.yaml file in the ~/chart/whats-note directory to save the cookie.secret value
# Install the chart:
helm upgrade whatsnote-prod . --install --namespace whatsnote --create-namespace --atomic --timeout 2m -f ./values.local.yaml   
```

## Development
This mono repository contains the backend (Fastify API server) and frontend code (Vite+Svelte SPA). The project uses _npm workspaces_. See [their docs](https://docs.npmjs.com/cli/v8/using-npm/workspaces) for more info about the CLI commands. But don't worry, once the project structure is set up, you don't really need to care about workspaces.

### Open features
- e2e encryption (I am not a cryptography expert so help is very welcome. Everything should already be in place, we would just need to implement the encryption and decryption of the `data` field of events.)
- litestream backups/replication
- export and import client data as JSON file
- tabs and tags customization
- abort editing a message
- send photo
- send file
- send audio message
- fastify request and response validation
- tests
- remind me notifications
- link title previews (would imply privacy issues because of the PWA nature)
- state bar (not sure about this one, maybe show some visual state if there are events unsynced or if it is disconnected)
- UI design overhaul

### Install the dependencies

In the root directory, run `npm ci --workspaces`.

### Update the dependencies
Run `npm outdated` or `npm update --workspaces --dry-run` to check which updates are available. You can then check the package's changelog and make sure the updates are desired. Remove the `--dry-run` flag (and optionally set a workspace) to install updates.

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
To prevent CORS errors, you must run the API and vite dev server under the same host. This repository contains a simple Caddyfile with the right reverse proxy configuration for local development.

```
docker run --rm --network host --name caddy -v $PWD/Caddyfile:/etc/caddy/Caddyfile caddy
```

Now with the backend, frontend, and reverse proxy running, you can start developing.

### Build the SPA
The following command builds all artifacts and saves them in the `./frontend/dist` directory.

```
npm run build -w frontend
```

