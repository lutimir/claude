# Build kontext = koreň monorepa:
#   docker build -f apps/worker/Dockerfile .
FROM node:22-alpine
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter @app0/worker...

COPY packages ./packages
COPY apps/worker ./apps/worker

CMD ["pnpm", "--filter", "@app0/worker", "start"]
