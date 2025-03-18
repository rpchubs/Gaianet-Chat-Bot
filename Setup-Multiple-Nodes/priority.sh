#!/bin/bash

# Number of nodes to run
NUM_NODES=20

for i in $(seq 1 $NUM_NODES); do
  if [ -f "/root/gaianet/node-$i/llamaedge.pid" ]; then
    sudo renice -n -19 $(cat /root/gaianet/node-$i/llamaedge.pid)
    echo "Increased priority for node-$i"
  fi
done
