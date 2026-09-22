# ADR-008: SeaweedFS as the local S3 stand-in, not MinIO

- **Status:** Accepted
- **Date:** 2026-09-21
- **Phase:** 01 Foundation
- **Supersedes:** the MinIO reference in the Phase 01 work packages
- **PRD references:** section 8.3 (media storage on Cloudflare R2), section 22 (prerequisites), INF-901

## Context

The platform stores media in Cloudflare R2 through the S3 API. Staging and production use R2 directly;
local development needs an S3-compatible service so `@payloadcms/storage-s3` and the worker's
`StoragePort` exercise a real S3 code path rather than a mock.

MinIO was the planned choice and is the conventional one. It no longer works:

```
$ docker compose up -d
minio Error pull access denied for minio/minio, repository does not exist
      or may require 'docker login'
```

Verified by pulling each candidate directly:

| Image                                              | Result                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| `minio/minio:latest`                               | pull access denied                                                     |
| `quay.io/minio/minio:RELEASE.2025-04-22T22-12-26Z` | not found                                                              |
| `bitnami/minio:latest`                             | pull access denied - Bitnami moved its catalogue behind a subscription |
| `chainguard/minio:latest`                          | pulls, but the free tier publishes only `latest`                       |
| `chrislusf/seaweedfs:3.97`                         | pulls                                                                  |
| `dxflrs/garage:v2.1.0`                             | pulls                                                                  |
| `localstack/localstack:4.9`                        | pulls                                                                  |
| `adobe/s3mock:4.9.0`                               | pulls                                                                  |

MinIO's community images are no longer publicly distributed. Chainguard's mirror pulls, but only as
`latest`, which is incompatible with the pinned-version requirement in PRD 10 - a floating tag means
two developers can run different storage backends on the same commit.

## Decision

**Use `chrislusf/seaweedfs:3.97` as the local S3 stand-in.**

Reasons, in the order they mattered:

1. **Pinnable.** Immutable version tags, so PRD 10 is satisfiable.
2. **Apache 2.0.** No licensing question for a development dependency.
3. **Sufficient S3 fidelity.** It implements the operations this platform actually uses - PutObject,
   GetObject, multipart upload for large media, presigned URLs, and anonymous read. Fidelity matters
   more than feature breadth here: the point is to exercise the real AWS SDK signing path.
4. **Anonymous read reproduces an R2 public bucket.** The `anonymous` identity with `Read` in
   `infra/seaweedfs/s3.json` makes local media URLs behave like R2 behind a custom domain, so the CMS
   generates the same shape of URL in every environment.

Two configuration details are load-bearing and are commented in the Compose file, because both cost
time to diagnose:

- **`-ip.bind=0.0.0.0` is mandatory.** By default SeaweedFS binds to loopback inside the container.
  Docker forwards published ports to the container's bridge IP, so the S3 endpoint is unreachable
  from the host while the container logs look entirely healthy. The failure presents as an
  application connection error, not a storage error.
- **The health probe targets `127.0.0.1:9333/cluster/healthz`.** The master does not answer on the
  container hostname before the bind flag is set.

Buckets are created by a one-shot `seaweedfs-init` service via `weed shell`, so apps can gate on
`condition: service_completed_successfully` and never race an absent bucket.

## Consequences

- **No production impact.** Staging and production use R2. This decision covers local development
  only, and the `STORAGE_DRIVER` switch means the change is environmental, not structural.
- **A conformance suite becomes necessary rather than optional.** Because the local backend is no
  longer the same product as an S3 service CERA might otherwise run, Phase 10 runs one shared
  `StoragePort` test suite against both SeaweedFS and R2. A passing local test then means something.
- **Behaviours to watch.** SeaweedFS is not byte-for-byte MinIO. Bucket policy syntax, CORS
  configuration, and object-versioning semantics differ. None are on this platform's critical path,
  and the conformance suite is what catches it if that changes.
- **Documented differences from R2 remain documented.** R2 requires `region: 'auto'`, and presigned
  URLs do not work on an R2 custom domain. Neither is reproducible locally on any backend, so both
  are called out in `.env.example` and the storage runbook instead.

## Alternatives considered

**Garage `v2.1.0`.** A genuine contender: small, S3-compatible, actively developed. Rejected on setup
friction - it needs a TOML config plus `garage key create` and `garage bucket allow` after start,
which makes first-run setup a multi-step choreography instead of one `up -d`. AGPL is also a
consideration a client may reasonably ask about, even for a dev dependency.

**LocalStack `4.9`.** Strong S3 emulation, but it is a full AWS emulator: slow to start and far more
than needed for one bucket. Rejected on weight.

**`adobe/s3mock`.** An in-memory test double with no persistence. Fine inside a test run, wrong as the
development storage backend - media would vanish between restarts.

**`chainguard/minio:latest`.** Closest to the original intent, and rejected only on the pinning
constraint. Worth revisiting if Chainguard publishes versioned tags on the free tier.

**Keep MinIO and require `docker login`.** Rejected: it puts a registry credential between a new
developer and a working checkout, and PRD 22 is explicit that onboarding must not depend on accounts
CERA has not supplied.
