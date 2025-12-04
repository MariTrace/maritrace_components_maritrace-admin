#!/usr/bin/env zsh
set -e

if [ -f "$HOME/.zshrc" ]; then
  echo "Loading .zshrc"
  source "$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  echo "Loading .bashrc"
  source "$HOME/.bashrc"
fi

# local-name() is a way discarding the namespace for a given xml node
version="0.2.7.1"

NAMESPACE="default"
KUBE_ALIAS="mercury_pipe"

IMAGE_NAME="maritrace-3"
LOCAL_TAG="${IMAGE_NAME}:${version}"
REMOTE_TAG="678939288571.dkr.ecr.eu-west-1.amazonaws.com/${IMAGE_NAME}:${version}"

echo "🔐 Fetching tokens from Kubernetes..."

NPM_TOKEN=$($KUBE_ALIAS get secret maritrace-npm-token \
  -n "$NAMESPACE" \
  -o jsonpath="{.data.npm-token}" | base64 --decode)

FONTAWESOME_TOKEN=$($KUBE_ALIAS get secret maritrace-fa-token \
  -n "$NAMESPACE" \
  -o jsonpath="{.data.fa-token}" | base64 --decode)

if [ -z "$NPM_TOKEN" ] || [ -z "$FONTAWESOME_TOKEN" ]; then
  echo "❌ Error: One or more tokens are empty. Aborting. Please check your kubectl Alias - Zoho Learn (Development -> Kubernetes) has instructions to set this up."
  exit 1
fi

echo "🐳 Building Docker image..."
docker buildx build \
  -t "$LOCAL_TAG" \
  --platform linux/amd64 \
  --build-arg NPM_TOKEN="$NPM_TOKEN" \
  --build-arg FONTAWESOME_TOKEN="$FONTAWESOME_TOKEN" \
  .

echo "🏷 Tagging image for ECR..."
docker tag "$LOCAL_TAG" "$REMOTE_TAG"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region eu-west-1 \
  | docker login --username AWS --password-stdin 678939288571.dkr.ecr.eu-west-1.amazonaws.com

echo "🚀 Pushing image to ECR..."
docker push "$REMOTE_TAG"

echo "📦 Image pushed: $REMOTE_TAG"

# ---------- Git Auto-update ----------
project_path="maritrace-3"

cd "$(git rev-parse --show-toplevel)" || exit 1
current_branch=$(git symbolic-ref --short HEAD)

if ! git diff --quiet "$project_path"; then
  git add "$project_path"
  git commit -m "Automated update for $project_path (version $version)"
  git push origin "$current_branch"
else
  echo "[${current_branch}] No changes in '${project_path}'. Nothing to commit."
fi