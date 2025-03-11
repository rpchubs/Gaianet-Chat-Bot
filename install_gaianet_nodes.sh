#!/bin/bash

# Create directories for each node
mkdir -p $HOME/gaianet/node-{1..50}

echo "Directories for nodes have been created."

# Install GaiaNet node for each directory
for i in {1..50}; do
    echo "Installing GaiaNet node $i..."
    curl -sSfL 'https://raw.githubusercontent.com/GaiaNet-AI/gaianet-node/main/install.sh' | bash -s -- --base $HOME/gaianet/node-$i
    echo "Installation of node $i completed."
done

echo "Installation of all nodes completed."

# Load environment variables again
source /root/.bashrc

# Configure ports for each node
for i in {1..50}; do
    gaianet config --base $HOME/gaianet/node-$i --port $((10000 + i))
    echo "Configured port $(($i + 10000)) for node $i."
done

echo "Port configuration completed."

# Initialize each node
for i in {1..50}; do
    gaianet init --base $HOME/gaianet/node-$i
    echo "Initialized node $i."
done

echo "All nodes initialized."

# Start all nodes
for i in {1..50}; do
    gaianet start --base $HOME/gaianet/node-$i
    echo "Started node $i."
done

echo "All nodes have been started."

# Check information after starting
for i in {1..50}; do
    gaianet info --base $HOME/gaianet/node-$i
    echo "Node $i information:"
done

echo "Installation and verification process completed."
