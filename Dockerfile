FROM node:18 AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY ./frontend/package*.json ./frontend/
RUN npm ci --workspace frontend
COPY ./frontend ./frontend/
RUN npm run build -w frontend

FROM node:18 AS prod
ENTRYPOINT [ "node", "backend/src/index.js" ]
EXPOSE 8080
ENV PORT=8080 LOG_LEVEL=warn COOKIE_SECURE=true COOKIE_SECRET=SET_THIS_WHEN_BUILDING!!!
WORKDIR /app
COPY package*.json ./
COPY ./backend/package*.json ./backend/
RUN npm ci --omit=dev -w backend
COPY ./backend ./backend/
COPY --from=frontend-builder /app/frontend/dist ./backend/src/www/
