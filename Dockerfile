# Fetch the LiteFS binary using a multi-stage build.
FROM flyio/litefs:0.2 AS litefs

# Build our application using a Go builder.
FROM node:16-alpine AS builder
WORKDIR /app
RUN apk add curl
RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" -o /bin/pnpm; chmod +x /bin/pnpm;
# RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
# COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm i
RUN pnpm build


# Our final Docker image stage starts here.
FROM node:16-alpine

WORKDIR /app

# Setup our environment to include FUSE & SQLite.
RUN apk add bash curl fuse

RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" -o /bin/pnpm; chmod +x /bin/pnpm;
# RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

# Copy binaries from the previous build stages.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=litefs /usr/local/bin/litefs /usr/local/bin/litefs

# Copy our LiteFS configuration.
ADD etc/litefs.yml /etc/litefs.yml

# Ensure our mount & data directories exists before mounting with LiteFS.
RUN mkdir -p /data /mnt/sqlite

# Run LiteFS as the entrypoint so it can execute "litefs-example" as a subprocess.
ENTRYPOINT "litefs"
