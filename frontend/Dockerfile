FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

COPY . .

# Variables VITE_* inyectadas en tiempo de build por Railway
ARG VITE_API_URL
ARG VITE_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY

RUN pnpm build

# ── Imagen de producción ──────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist

RUN pnpm install --prod --no-frozen-lockfile

EXPOSE 3000

CMD ["sh", "-c", "PORT=${PORT:-3000} node dist/index.js"]
