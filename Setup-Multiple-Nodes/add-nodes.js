import fs from "fs/promises";
import fetch from "node-fetch";
import { Web3 } from "web3";
import { colors } from "../config/colors.js";
import { displayBanner } from "../config/banner.js";
import { logger } from "../config/logger.js";
import path from "path";
import { fileURLToPath } from "url";

// 1) General Configuration
const API_CONFIG = {
  GET_AUTH: "https://api.gaianet.ai/api/v1/users/connect-wallet/",
  BIND_NODE: "https://api.gaianet.ai/api/v1/users/bind-node/",
  ORIGIN: "https://www.gaianet.ai",
  REFERER: "https://www.gaianet.ai/",
};

// 2) Initialize Web3
const w3 = new Web3("https://1rpc.io/base");

// 3) Read priv.txt file
async function getAllPrivateKeys() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, "..", "priv.txt");  // Move one level up
  const content = await fs.readFile(filePath, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// 4) Read nodesList.txt file (each line: node_id|device_id)
async function readNodesList(filename = "nodesList.txt") {
  try {
    const content = await fs.readFile(filename, "utf8");
    const lines = content
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    return lines.map(line => {
      const [node_id, device_id] = line.split("|").map(x => x.trim());
      return { node_id, device_id };
    });
  } catch (error) {
    logger.error(`${colors.error}Cannot read nodesList.txt: ${error}${colors.reset}`);
    return [];
  }
}

// 5) Mask address
function maskAddress(address) {
  if (address.length <= 10) return address;
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

// 6) Sign message to get access_token (auth step)
async function signMessage(walletPrivateKey) {
  const account = w3.eth.accounts.privateKeyToAccount(walletPrivateKey);
  const walletAddress = account.address;
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `{"wallet_address":"${walletAddress}","timestamp":${timestamp}}`;
  const signature = w3.eth.accounts.sign(message, walletPrivateKey).signature;
  return { message, signature, timestamp };
}

// 7) Get access_token + api_key
async function getAuthToken(privateKey) {
  try {
    const { message, signature } = await signMessage(privateKey);
    const payload = {
      message: JSON.parse(message),
      signature,
    };

    const response = await fetch(API_CONFIG.GET_AUTH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: API_CONFIG.ORIGIN,
        Referer: API_CONFIG.REFERER,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 0) {
      return {
        access_token: data.data.access_token,
        api_key: data.data.api_key,
      };
    } else {
      throw new Error("Failed to retrieve access token");
    }
  } catch (error) {
    logger.error(`${colors.error}Error getting auth token: ${error}${colors.reset}`);
    return null;
  }
}

// 8) Sign message for node_id, device_id
function signNodeMessage(privateKey, nodeId, deviceId) {
  const messageObj = { node_id: nodeId, device_id: deviceId };
  const messageStr = JSON.stringify(messageObj);
  const { signature } = w3.eth.accounts.sign(messageStr, privateKey);
  return signature;
}

// 9) Call API bind-node
async function bindNode(accessToken, nodeId, deviceId, signature) {
  const payload = {
    node_id: nodeId,
    device_id: deviceId,
    signature,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `${accessToken}`, // Or "Bearer " + accessToken if required by backend
    Origin: API_CONFIG.ORIGIN,
    Referer: API_CONFIG.REFERER,
  };

  try {
    const response = await fetch(API_CONFIG.BIND_NODE, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status} => ${errBody}`);
    }

    const json = await response.json();
    logger.info(`${colors.info}Bind node success: ${JSON.stringify(json)}${colors.reset}`);
    return json;
  } catch (error) {
    logger.error(`${colors.error}Error binding node: ${error}${colors.reset}`);
    return null;
  }
}

// 10) Main function
async function main() {
  try {
    console.clear();
    displayBanner();
    logger.info(`${colors.info}Starting Multi Wallets Auth + Bind Program...${colors.reset}`);

    // Read private keys
    const allPrivateKeys = await getAllPrivateKeys();
    if (!allPrivateKeys.length) {
      logger.error(`${colors.error}No private keys in priv.txt. Exiting...${colors.reset}`);
      process.exit(1);
    }

    // Read nodesList.txt
    const nodesList = await readNodesList("nodesList.txt");
    if (!nodesList.length) {
      logger.warn(`${colors.warning}No node_id|device_id found in nodesList.txt${colors.reset}`);
    }

    // Loop through each private key
    for (const pKey of allPrivateKeys) {
      const { address } = w3.eth.accounts.privateKeyToAccount(pKey);
      const maskedAddr = maskAddress(address);
      logger.info(`${colors.info}========== Wallet Address: ${maskedAddr} ==========${colors.reset}`);

      // Get access_token
      const tokenData = await getAuthToken(pKey);
      if (!tokenData) {
        logger.error(`${colors.error}Failed to authenticate wallet: ${maskedAddr}${colors.reset}`);
        continue;
      }
      const { access_token } = tokenData;

      // Bind each node
      for (const { node_id, device_id } of nodesList) {
        logger.info(`${colors.info}Binding node: ${node_id}, device: ${device_id}${colors.reset}`);
        const signature = signNodeMessage(pKey, node_id, device_id);
        await bindNode(access_token, node_id, device_id, signature);
      }

      logger.info(`${colors.info}========== Finished for Wallet: ${maskedAddr} ==========\n${colors.reset}`);
    }

    logger.info(`${colors.info}All wallets have been processed. Program finished.${colors.reset}`);
  } catch (error) {
    logger.error(`${colors.error}Error in main process: ${error}${colors.reset}`);
  }
}

// 11) Call main
main().catch((error) => logger.error(`${colors.error}${error}${colors.reset}`));
