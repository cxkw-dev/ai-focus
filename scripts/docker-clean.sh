#!/usr/bin/env bash
# Keep exactly one local ai-focus image (the ":latest" built by docker-compose).
# Removes any other tags for this repo (manual snapshots, commit-sha builds,
# etc.) so images don't quietly pile up on disk over time.
#
# Runs automatically as part of `npm run docker:build`. Can also be run
# standalone: `npm run docker:clean`.
set -euo pipefail

REPO="ai-focus"

extra_tags="$(docker images "${REPO}" --format '{{.Repository}}:{{.Tag}}' | grep -v ":latest$" || true)"

if [[ -n "${extra_tags}" ]]; then
  echo "Removing extra ${REPO} image tags:"
  echo "${extra_tags}"
  echo "${extra_tags}" | xargs -r docker rmi
else
  echo "No extra ${REPO} tags to clean up."
fi

remaining="$(docker images "${REPO}" --format '{{.Tag}}' | wc -l | tr -d ' ')"
echo "✓ ${REPO} has ${remaining} local image(s)."
