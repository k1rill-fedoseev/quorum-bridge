#!/bin/bash

set -e

docker-compose -f docker-compose-quorum.yml down
docker-compose -f docker-compose-ganache.yml down
docker-compose -f docker-compose-oracle.yml down
