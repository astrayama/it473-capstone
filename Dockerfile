# syntax=docker/dockerfile:1
# Two images come out of this file:
#   default target  -> the Next.js web server (Cloud Run service)
#   --target migrator -> same code with the Prisma CLI, used by the Cloud Run Job
#                        that runs `prisma migrate deploy` before each deploy.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- migrator: runs database migrations ------------------------------------
FROM deps AS migrator
WORKDIR /app
COPY --from=builder /app/src/generated ./src/generated
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: the web app ----------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
