#!/usr/bin/env bash
# Piano Professor — deploy the OMR service to Google Cloud Run.
#
# One command from "code in backend/omr" to "an HTTPS address the app can
# use". Cloud Run builds the Dockerfile for you (--source), so there is no
# local docker build, no registry to push to, and it scales to zero when idle.
# The image bakes the homr model weights in, so a cold start is a container
# start, not a model download.
#
# Usage:
#   backend/omr/deploy.sh [PROJECT] [REGION]
#
#   PROJECT   Google Cloud project id. First argument, or the PROJECT /
#             GOOGLE_CLOUD_PROJECT environment variable. Required.
#   REGION    Cloud Run region. Second argument or the REGION environment
#             variable. Default: us-central1.
#
# Afterwards, paste the printed serverUrl line into src/omr/omrConfig.ts and
# rebuild the app. See docs/OMR_SETUP.md.
set -euo pipefail

SERVICE="pp-omr"

usage() {
  sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

case "${1:-}" in
  -h|--help|help) usage; exit 0 ;;
esac

PROJECT="${1:-${PROJECT:-${GOOGLE_CLOUD_PROJECT:-}}}"
REGION="${2:-${REGION:-us-central1}}"

if [ -z "$PROJECT" ]; then
  usage >&2
  echo >&2
  echo "error: PROJECT is required (argument or PROJECT env var)." >&2
  exit 2
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud is not installed. Get it from https://cloud.google.com/sdk/docs/install," >&2
  echo "       then run 'gcloud auth login' once." >&2
  exit 2
fi

# --source needs the directory with the Dockerfile; run from there so the
# script works from any cwd.
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Deploying $SERVICE to Cloud Run (project $PROJECT, region $REGION)..."
echo "The first deploy builds the image, including the model weights — allow 10-15 minutes."
echo

# 4 vCPU / 4 GiB: homr runs on onnxruntime CPU; more cores = faster pages.
# 900 s timeout: a page is roughly a minute on CPU, and /omr/score takes a
# whole song in one request.
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 4 \
  --timeout 900 \
  --project "$PROJECT"

URL="$(gcloud run services describe "$SERVICE" \
  --region "$REGION" \
  --project "$PROJECT" \
  --format 'value(status.url)')"

if [ -z "$URL" ]; then
  echo "error: deployed, but could not read the service URL. Try:" >&2
  echo "  gcloud run services describe $SERVICE --region $REGION --project $PROJECT" >&2
  exit 1
fi

echo
echo "=================================================================="
echo "Service URL:  $URL"
echo
echo "Paste this into src/omr/omrConfig.ts (OMR_CONFIG):"
echo
echo "  serverUrl: '$URL',"
echo
echo "Health check:"
echo
echo "  curl -s $URL/health"
echo "=================================================================="
echo

if curl -fsS --max-time 60 "$URL/health"; then
  echo
  echo "Health check passed."
else
  echo
  echo "warning: health check did not answer yet (cold start?). Re-run the curl above in a moment." >&2
fi
