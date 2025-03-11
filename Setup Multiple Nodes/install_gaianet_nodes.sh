#!/bin/bash

# Number of nodes to run
NUM_NODES=20

# Create directories for each node
for i in $(seq 1 $NUM_NODES); do
    mkdir -p "$HOME/gaianet/node-$i"
done

echo "Directories for $NUM_NODES nodes have been created."

# Install GaiaNet node for each directory
for i in $(seq 1 $NUM_NODES); do
    echo "Installing GaiaNet node $i..."
    curl -sSfL 'https://raw.githubusercontent.com/GaiaNet-AI/gaianet-node/main/install.sh' | bash -s -- --base $HOME/gaianet/node-$i
    echo "Installation of node $i completed."
done

echo "Installation of all $NUM_NODES nodes completed."

# Load environment variables
source /root/.bashrc
echo "Load environment variable"

# Configure ports for each node
for i in $(seq 1 $NUM_NODES); do
    gaianet config --base $HOME/gaianet/node-$i --port $((10000 + i))
    echo "Configured port $(($i + 10000)) for node $i."
done

echo "Port configuration completed."

# Initialize each node
for i in $(seq 1 $NUM_NODES); do
    gaianet init --base $HOME/gaianet/node-$i
    echo "Initialized node $i."
done

echo "All $NUM_NODES nodes initialized."

# Start all nodes
for i in $(seq 1 $NUM_NODES); do
    gaianet start --base $HOME/gaianet/node-$i
    echo "Started node $i."
done

echo "All $NUM_NODES nodes have been started."

# Check information after starting
for i in $(seq 1 $NUM_NODES); do
    echo "Node $i information:"
	gaianet info --base $HOME/gaianet/node-$i
done

echo "Installation and verification process for $NUM_NODES nodes completed."
