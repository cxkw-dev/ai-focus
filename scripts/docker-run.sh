#!/bin/bash

# Run PostgreSQL with Docker (without docker-compose)

set -e

CONTAINER_NAME="ai-dashboard-db"
POSTGRES_USER="aidashboard"
POSTGRES_PASSWORD="aidashboard_secret_2024"
POSTGRES_DB="aidashboard"
PORT="5433"

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container ${CONTAINER_NAME} exists."

    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✓ Container is already running."
    else
        echo "Starting existing container..."
        docker start ${CONTAINER_NAME}
        echo "✓ Container started."
    fi
else
    echo "Creating new PostgreSQL container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -e POSTGRES_USER=${POSTGRES_USER} \
        -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
        -e POSTGRES_DB=${POSTGRES_DB} \
        -p ${PORT}:5432 \
        --restart unless-stopped \
        postgres:16-alpine

    echo "✓ Container created and started."
fi

echo ""
echo "PostgreSQL is running on port ${PORT}"
echo "Connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}"
