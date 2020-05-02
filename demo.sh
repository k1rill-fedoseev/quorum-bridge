#!/bin/bash

set -e

docker network create quorum-external-net || true
docker network create ganache-external-net || true

docker-compose -f ./docker-compose-deploy.yml build
docker-compose -f ./docker-compose-test.yml build

echo "Starting two chains"
docker-compose -f ./docker-compose-quorum.yml up -d
docker-compose -f ./docker-compose-ganache.yml up -d

healthy=$(docker-compose -f docker-compose-quorum.yml ps | grep '(healthy)' | wc -l | tr -d ' ')
while [[ "$healthy" != "4" ]]; do
    echo "Waiting for quorum to be alive"
    sleep 3
    healthy=$(docker-compose -f docker-compose-quorum.yml ps | grep '(healthy)' | wc -l | tr -d ' ')
done;


echo "Deploying AMB bridge"
docker-compose -f ./docker-compose-deploy.yml run bridge-deploy ./deploy.sh

echo "Staring AMB oracle"
source .env.oracle
docker-compose -f ./docker-compose-oracle.yml up -d

sleep 5
echo "Wait for rabbit startup"
docker-compose -f ./docker-compose-oracle.yml exec rabbit rabbitmqctl await_startup

echo "Running tests"
docker-compose -f ./docker-compose-test.yml up
