# Quorum-to-ethereum bridge demo

## Running the demo
```
git clone https://github.com/k1rill-fedoseev/quorum-bridge.git
git submodule update --init

./demo.sh
```

## What happens
* Quorum chain consisting of a single node, without transaction manager is started.
* Quorum permission contracts (from [enhanced permission model](http://docs.goquorum.com/en/latest/Permissioning/Enhanced%20Permissions%20Model/Overview/)) are deployed in the quorum chain.
* Quorum chain is restarted with valid `permission-config.json`.
* Bridge sub-org `ADMINORG.BRIDGEORG` is created. Admin, validator and user account are also added to the sub-org.
* Ganache testnet is started.
* Bridge admin deploys and initializes AMB(Arbitrary Message Bridge) contracts.
* Single bridge oracle is started.
* Test case verifies that AMB processes passed messages correctly for both direction.
* All docker containers are stopped.
