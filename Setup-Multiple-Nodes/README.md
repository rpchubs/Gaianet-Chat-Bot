# GaiaNet Node Setup & Management Guide

## 🚀 1. Modify the Number of Nodes Before Installation

Before running the installation script, you can modify the number of nodes by editing the `NUM_NODES` variable in the `install_gaianet_nodes.sh` file:


```sh
nano install_gaianet_nodes.sh
```

```sh
# Number of nodes to run
NUM_NODES=20  # Adjust this value as needed
```

Save the file before executing the script.

---

## 🔧 2. Install GaiaNet Nodes

Grant execution permission to the installation script:
```sh
chmod +x install_gaianet_nodes.sh
```

Then, execute the script:
```sh
source install_gaianet_nodes.sh
```

This script will:
✅ Create directories for each node in `/root/gaianet/`
✅ Install GaiaNet nodes in their respective directories
✅ Configure network ports for each node
✅ Initialize and start all nodes
✅ Verify and display node information

---

## 📋 3. Retrieve Node ID & Device ID

Once the nodes are installed, run the following command to extract `nodeID` and `deviceID`:
```sh
python3 get-nodes.py
```

📍 The script automatically locates nodes in `/root/gaianet/`.

🔹 It reads `nodeid.json` and `deviceid.txt` from each node and writes the data to `nodesList.txt` in the format:
```sh
nodeID|deviceID
```
Example:
```sh
0xc90fbbba3058ecab6409786d4f0eac4a72255848|device-3e830276d30a750bc277165a
0x0a8131348f9528ec182ba5ec9091364640e4d2e0|device-114e6f632b8493d2fda20522
```

---

## 🔗 4. Add Node ID & Device ID to `priv.txt`

Once you have the `nodeID` and `deviceID` list, bind them to your wallet by running:
```sh
node add-nodes.js
```

This script will:
✅ Read private keys from `priv.txt`
✅ Authenticate with the GaiaNet API
✅ Bind each `nodeID` and `deviceID` to your account

After execution, all nodes will be successfully registered.

---

## 🛠 5. Troubleshooting & Logs

If you encounter errors during installation or node operation, check logs with:
```sh
tail -f /var/log/syslog | grep gaianet
```

🔍 If API authentication fails, verify your `priv.txt` file to ensure valid private keys.

---

## 🔁 6. Restart Gaianet Nodes

Grant execution permission to the installation script:
```sh
chmod +x restart_gaianet_nodes.sh
```

Then, execute the script:
```sh
source restart_gaianet_nodes.sh
```

## 🎯 7. Conclusion

Following these steps, you can efficiently install and manage GaiaNet nodes. If you encounter any issues, review the steps or contact GaiaNet support.

🚀 **Happy Node Running!**

