FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Build-time Vite env (compile-time)
ARG VITE_NORMALISER_BASE_URL
ARG VITE_NORMALISER_BEARER_TOKEN
ARG VITE_TRANSCRIBE_BASE_URL
ARG VITE_PACKET_BASE_URL

ENV VITE_NORMALISER_BASE_URL=$VITE_NORMALISER_BASE_URL
ENV VITE_NORMALISER_BEARER_TOKEN=$VITE_NORMALISER_BEARER_TOKEN
ENV VITE_TRANSCRIBE_BASE_URL=$VITE_TRANSCRIBE_BASE_URL
ENV VITE_PACKET_BASE_URL=$VITE_PACKET_BASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm -C apps/web build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
