#!/bin/bash

# Number of nodes to restart and set priority
NUM_NODES=20

# Base directory where nodes are located
BASE_DIR="/root/gaianet"

# Load environment variables
source /root/.bashrc
echo "Loaded environment variables"

# Restart each node
for i in $(seq 1 $NUM_NODES); do
    NODE_DIR="$BASE_DIR/node-$i"
    
    if [ -d "$NODE_DIR" ]; then
        echo "Restarting GaiaNet node $i..."
        
        # Stop the node if running
        gaianet stop --base "$NODE_DIR"
        sleep 2  # Wait before restarting
        
        # Start the node again
        gaianet start --base "$NODE_DIR"
        echo "Node $i restarted successfully."
    else
        echo "Warning: Node directory $NODE_DIR does not exist. Skipping node $i."
    fi
done

echo "All GaiaNet nodes have been restarted."

# Set priority for each node
for i in $(seq 1 $NUM_NODES); do
    PID_FILE="$BASE_DIR/node-$i/llamaedge.pid"
    
    if [ -f "$PID_FILE" ]; then
        sudo renice -n -19 $(cat "$PID_FILE")
        echo "Increased priority for node-$i"
    else
        echo "Skipping node-$i (no PID file found)"
    fi
done

echo "Priority setting completed for all nodes."
