import os
import json

def extract_node_info(num_nodes):
    output_file = "nodesList.txt"  # Save file in the current directory
    
    with open(output_file, "w") as f_out:
        for i in range(1, num_nodes + 1):
            node_dir = os.path.join("/root/gaianet", f"node-{i}")  # Updated base path
            node_json_file = os.path.join(node_dir, "nodeid.json")
            device_file = os.path.join(node_dir, "deviceid.txt")
            
            if not os.path.isfile(node_json_file):
                print(f"Warning: Missing nodeid.json for node {i}")
                continue
            
            if not os.path.isfile(device_file):
                print(f"Warning: Missing deviceid.txt for node {i}")
                continue
            
            try:
                with open(node_json_file, "r", encoding="utf-8") as f_json:
                    node_data = json.load(f_json)
                    node_id = node_data.get("address", "").strip()
            
                with open(device_file, "r", encoding="utf-8") as f_dev:
                    device_id = f_dev.read().strip()
                
                if node_id and device_id:
                    f_out.write(f"{node_id}|{device_id}\n")
                    print(f"Saved Node {i}: {node_id}|{device_id}")
                else:
                    print(f"Warning: Empty Node ID or Device ID for node {i}")
            except json.JSONDecodeError:
                print(f"Error: Invalid JSON format in nodeid.json for node {i}")
            except KeyError:
                print(f"Error: 'address' key not found in nodeid.json for node {i}")
            except Exception as e:
                print(f"Error processing node {i}: {e}")

if __name__ == "__main__":
    num_nodes = int(input("Enter number of nodes: "))
    extract_node_info(num_nodes)
    print("Node information retrieval completed.")
