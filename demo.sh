#!/bin/bash

set -e

docker network create quorum-external-net || true
docker network create ganache-external-net || true

docker-compose -f ./docker-compose-utils.yml build

rm ./quorum/configs/node/permission-config.json || true

echo "Starting quorum chain"
docker-compose -f ./docker-compose-quorum.yml up -d node1 node2

sleep 3

# echo "Deploying permissions contracts"
# docker-compose -f ./docker-compose-utils.yml up permissions-deploy

# echo "Stopping quorum nodes"
# docker-compose -f ./docker-compose-quorum.yml stop node

# echo "Writing permission config"
# cp ./permissions/permission-config.json ./quorum/configs/node/permission-config.json

# echo "Restarting quorum node"
# docker-compose -f ./docker-compose-quorum.yml up -d node

# sleep 3

# echo "Creating bridge organization"
# docker-compose -f ./docker-compose-utils.yml up create-bridge-org

# echo "Start cakeshop"
# docker-compose -f ./docker-compose-quorum.yml up -d cakeshop

echo "Starting ganache chain"
docker-compose -f ./docker-compose-ganache.yml up -d

sleep 3

echo "Deploying AMB bridge"
docker-compose -f ./docker-compose-utils.yml up bridge-deploy

echo "Deploying ERC20 token"
docker-compose -f ./docker-compose-utils.yml up token-deploy

echo "Deploying AMB_ERC_TO_NATIVE mediators"
docker-compose -f ./docker-compose-utils.yml up mediators-deploy

echo "Staring AMB oracle"
source .env.oracle
docker-compose -f ./docker-compose-oracle.yml up -d

echo "Wait for rabbit startup"
while [[ -z $(docker-compose -f ./docker-compose-oracle.yml logs rabbit | grep 'Server startup complete') ]]; do
    echo "Not ready yet"
    sleep 3
done;

echo "Running tests"
docker-compose -f ./docker-compose-utils.yml up test

# echo "Starting blockscout"
# cd blockscout/docker/
# docker kill postgres || true
# docker rm postgres || true
# ETHEREUM_JSONRPC_HTTP_URL="http://host.docker.internal:8545" ETHEREUM_JSONRPC_VARIANT="geth" make start

./stop.sh
