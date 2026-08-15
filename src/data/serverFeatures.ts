import type { Feature } from './types'

export const serverFeatures: readonly Feature[] = [
  {
    id: 'rest-api',
    title: 'REST API',
    description:
      'Register repos, trigger indexing, and query search/callers/explore endpoints via a clean JSON REST API. Interactive Swagger UI at /docs and OpenAPI spec for codegen.',
  },
  {
    id: 'git-webhooks',
    title: 'Git Webhooks',
    description:
      'GitHub, GitLab, and Bitbucket webhooks with HMAC-SHA256 signature validation trigger instant incremental re-indexing on every push.',
  },
  {
    id: 'background-scheduler',
    title: 'Background Scheduler',
    description:
      'Automatic stale lock cleanup and periodic re-indexing. Tunable via POLL_INTERVAL_SECS, MAX_INDEX_AGE_SECS, and STALE_LOCK_TIMEOUT_SECS in docker-compose.',
  },
  {
    id: 'cluster-ha',
    title: 'Cluster & HA',
    description:
      'Horizontal scale-out with file-based distributed locking. Deploy multiple instances sharing an NFS/EFS workspace or a Kubernetes RWX PVC.',
  },
  {
    id: 'container-native-k8s-ready',
    title: 'Container-Native & K8s Ready',
    description:
      'Official raultov/knot-server image on Docker Hub. Tune CPU and memory via environment variables to match any pod resource limit — from a lightweight 2-core sidecar to a full-cluster deployment.',
  },
  {
    id: 'interactive-graph-viewer',
    title: 'Interactive Graph Viewer',
    description:
      'Explore your indexed codebase visually at /graph. Filter by entity kind, toggle relationship types, focus at any depth, color-coded by language and kind.',
  },
  {
    id: 'agent-skills-index',
    title: 'Agent Skills & /index',
    description:
      '9 per-topic skills auto-install for Claude Desktop, Cursor, OpenCode and Copilot. The /index slash command registers and indexes the current repo end-to-end from your editor.',
  },
  {
    id: 'local-remote-repos',
    title: 'Local & Remote Repos',
    description:
      'Index Git URLs or local working trees. Idempotent re-registration via POST /api/repos. Build outputs (target/, node_modules/, .gradle/, dist/) auto-excluded.',
  },
  {
    id: 'metrics-distributed-tracing',
    title: 'Metrics & Distributed Tracing',
    description:
      'Prometheus /metrics endpoint exposes HTTP, indexing pipeline, queue, and process metrics — Grafana-ready. Opt-in OpenTelemetry tracing exports spans via OTLP gRPC with W3C traceparent propagation.',
  },
]
