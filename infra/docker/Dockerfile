FROM node:24.21.0-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile

ARG APP
ARG BUILD_SITE_URL=http://localhost:3000
ARG BUILD_API_URL=http://localhost:3003
ARG BUILD_CMS_URL=http://localhost:3001
ARG BUILD_MEDIA_URL=http://localhost:9001/cera-media
ENV NEXT_PUBLIC_SITE_URL=${BUILD_SITE_URL} \
    NEXT_PUBLIC_API_URL=${BUILD_API_URL} \
    CMS_URL=${BUILD_CMS_URL} \
    S3_PUBLIC_URL=${BUILD_MEDIA_URL} \
    NODE_ENV=production
# Dashboard configuration is evaluated during compilation but must never
# receive production credentials. These build-only values are not copied to the
# runtime image; Compose injects the real environment when a container starts.
RUN if [ "$APP" = commerce ]; then \
      export DB_HOST=postgres DB_NAME=build_only DB_USERNAME=build_only DB_PASSWORD=build_only \
        VALKEY_HOST=valkey SUPERADMIN_USERNAME=build_only SUPERADMIN_PASSWORD=build_only \
        COOKIE_SECRET=build_only CERA_ENV=production STORAGE_DRIVER=local; \
    fi; \
    bash infra/docker/prepare.sh "$APP" /out

FROM node:24.21.0-bookworm-slim
WORKDIR /app
RUN groupadd --system --gid 10001 cera && useradd --system --uid 10001 --gid cera cera
COPY --from=build --chown=cera:cera /out/ /app/
COPY --chown=cera:cera infra/docker/run.sh /usr/local/bin/cera-run
ENV NODE_ENV=production
USER cera
ENTRYPOINT ["bash", "/usr/local/bin/cera-run"]
