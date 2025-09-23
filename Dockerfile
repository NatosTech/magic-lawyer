# syntax=docker/dockerfile:1.6

# 1) Dependências
FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc* ./
RUN npm ci --include=dev

# 2) Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera Prisma Client antes do build
RUN npx prisma generate

# Build de produção do Next.js (gera standalone)
RUN npm run build

# 3) Runtime
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copia artefatos necessários do build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Porta padrão do Next.js no container
EXPOSE 3000

CMD ["node", "server.js"]
