#!/bin/bash

# Number of nodes to run
NUM_NODES=20

# Base directory where nodes are located
BASE_DIR="/root/gaianet"

# Step 1: Create directories for nodes
for i in $(seq 1 $NUM_NODES); do
    mkdir -p "$BASE_DIR/node-$i"
done
echo "Directories for $NUM_NODES nodes have been created."

# Step 2: Install GaiaNet nodes
for i in $(seq 1 $NUM_NODES); do
    echo "Installing GaiaNet node $i..."
    curl -sSfL 'https://raw.githubusercontent.com/GaiaNet-AI/gaianet-node/main/install.sh' | bash -s -- --base "$BASE_DIR/node-$i"
    echo "Installation of node $i completed."
done
echo "Installation of all $NUM_NODES nodes completed."

# Load environment variables
source /root/.bashrc
echo "Loaded environment variables"

# Step 3: Configure ports for each node
for i in $(seq 1 $NUM_NODES); do
    gaianet config --base "$BASE_DIR/node-$i" --port $((10000 + i))
    echo "Configured port $(($i + 10000)) for node $i."
done
echo "Port configuration completed."

# Step 4: Initialize each node
for i in $(seq 1 $NUM_NODES); do
    gaianet init --base "$BASE_DIR/node-$i"
    echo "Initialized node $i."
done
echo "All $NUM_NODES nodes initialized."

# Step 5: Start all nodes
for i in $(seq 1 $NUM_NODES); do
    gaianet start --base "$BASE_DIR/node-$i"
    echo "Started node $i."
done
echo "All $NUM_NODES nodes have been started."

# Step 6: Wait for the nodes to fully start
echo "Waiting for processes to initialize..."
sleep 5  # Give some time for the nodes to generate their PID files

# Step 7: Refresh PID files and set priority
for i in $(seq 1 $NUM_NODES); do
    PID_FILE="$BASE_DIR/node-$i/llamaedge.pid"
    
    # Find the latest process ID if the file doesn't exist or contains an old PID
    if [ ! -f "$PID_FILE" ] || ! kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        NEW_PID=$(pgrep -f "gaianet.*node-$i")
        if [ -n "$NEW_PID" ]; then
            echo "$NEW_PID" > "$PID_FILE"
            echo "Updated PID for node-$i: $NEW_PID"
        else
            echo "Skipping node-$i (no running process found)"
            continue
        fi
    fi

    # Apply priority
    sudo renice -n -19 $(cat "$PID_FILE")
    echo "Increased priority for node-$i"
done
echo "Priority setting completed for all nodes."

# Step 8: Display node information
for i in $(seq 1 $NUM_NODES); do
    echo "Node $i information:"
    gaianet info --base "$BASE_DIR/node-$i"
done
echo "Installation, setup, and priority adjustment process for $NUM_NODES nodes completed."
