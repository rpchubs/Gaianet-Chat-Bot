import fs from "fs/promises";
import fetch from "node-fetch";
import { Web3 } from "web3";
import { Groq } from "groq-sdk";
import { colors } from "./config/colors.js";
import { displayBanner } from "./config/banner.js";
import { CountdownTimer } from "./config/countdown.js";
import { logger } from "./config/logger.js";

const API_CONFIG = {
  BASE_URL: "llama.gaia.domains",
  GET_AUTH: "https://api.gaianet.ai/api/v1/users/connect-wallet/",
  NODE_LIST_URL: "https://api.gaianet.ai/api/v1/users/nodes/",
  ENDPOINT: "/v1/chat/completions",
  ORIGIN: "https://www.gaianet.ai",
  REFERER: "https://www.gaianet.ai/",
};

const MODEL_CONFIG = {
  GROQ: {
    NAME: "mixtral-8x7b-32768",
    TEMPERATURE: 0.9,
    MAX_TOKENS: 1024,
  },
  GAIA: {
    NAME: "Phi-3-mini-4k-instruct",
  },
};

const groqClient = new Groq({
  apiKey: "Groq-Api-Key",
});

const RETRY_CONFIG = {
  MAX_ATTEMPTS: 5,
  INITIAL_WAIT: 5,
  NORMAL_WAIT: 10,
  ERROR_WAIT: 15,
};

const SYSTEM_PROMPTS = {
  GROQ_USER: "You are a tourist using a tour guide in Paris, France.",
  GAIA_GUIDE:
    "You are a tour guide in Paris, France. Please answer the question from a Paris visitor accurately.",
};

const TOPICS = [
  "Ask about tourist attractions in paris, france",
  "Ask about the best restaurants in Paris",
  "Ask about museums in Paris",
  "Ask about shopping areas in Paris",
  "Ask about historical sites in Paris",
];

const BROWSER_CONFIG = {
  USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  CHROME_VERSION: "131",
  BRAND_VERSION: "24",
};

const timer = new CountdownTimer();
const w3 = new Web3("https://1rpc.io/base");

async function getAllPrivateKeys() {
  const content = await fs.readFile("priv.txt", "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function maskAddress(address) {
  if (address.length <= 10) {
    return address;
  }
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

async function signMessage(walletPrivateKey) {
  const account = w3.eth.accounts.privateKeyToAccount(walletPrivateKey);
  const walletAddress = account.address;
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `{"wallet_address":"${walletAddress}","timestamp":${timestamp}}`;
  const signature = w3.eth.accounts.sign(message, walletPrivateKey).signature;
  return { message, signature, timestamp };
}

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
    // logger.success(`${colors.success}Access Token: ${data.data.access_token}${colors.reset}`);
    // logger.success(`${colors.success}API Key: ${data.data.api_key}${colors.reset}`);
    // logger.success(`${colors.success}Refresh Token: ${data.data.refresh_token}${colors.reset}`);
    // logger.success(`${colors.success}User ID: ${data.data.user_id}${colors.reset}`);

    if (data.code === 0) {
      return { access_token: data.data.access_token, api_key: data.data.api_key };
    } else {
      throw new Error("Failed to retrieve access token");
    }
  } catch (error) {
    logger.error(`${colors.error}Error getting auth token: ${error}${colors.reset}`);
    return null;
  }
}

function createGaianetHeaders(apiKey, nodeId) {
  return {
    authority: `${nodeId}.${API_CONFIG.BASE_URL}`,
    method: "POST",
    path: API_CONFIG.ENDPOINT,
    scheme: "https",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Origin: API_CONFIG.ORIGIN,
    Referer: API_CONFIG.REFERER,
    "Sec-Ch-Ua": `"Google Chrome";v="${BROWSER_CONFIG.CHROME_VERSION}", "Not_A_Brand";v="${BROWSER_CONFIG.BRAND_VERSION}"`,
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "User-Agent": BROWSER_CONFIG.USER_AGENT,
  };
}

function getGaianetUrl(nodeId) {
  return `https://${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}`;
}

async function getGroqUserMessage(prompt) {
  const completion = await groqClient.chat.completions.create({
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPTS.GROQ_USER,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: MODEL_CONFIG.GROQ.NAME,
    temperature: MODEL_CONFIG.GROQ.TEMPERATURE,
    max_tokens: MODEL_CONFIG.GROQ.MAX_TOKENS,
    stream: false,
  });

  return completion.choices[0]?.message?.content || "";
}

async function chatWithGaianet(
  groqMessage,
  apiKey,
  nodeId,
  privateKey,
  retryCount = RETRY_CONFIG.MAX_ATTEMPTS
) {
  let localApiKey = apiKey;

  for (let i = 0; i < retryCount; i++) {
    try {
      const headers = createGaianetHeaders(localApiKey, nodeId);
      headers["Connection"] = "keep-alive";
      headers["Keep-Alive"] = "max=0";
      headers["Accept"] = "text/event-stream";

      const payload = {
        model: MODEL_CONFIG.GAIA.NAME,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.GAIA_GUIDE,
          },
          {
            role: "user",
            content: groqMessage,
          },
        ],
        stream: true,
        stream_options: {
          include_usage: true,
        },
      };

      const response = await fetch(getGaianetUrl(nodeId), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (response.status === 401) {
        logger.warn(`${colors.warning}Refreshing access token...${colors.reset}`);
        const newTokenData = await getAuthToken(privateKey);
        if (!newTokenData) {
          throw new Error("Failed to refresh token");
        }
        localApiKey = newTokenData.api_key;

        i--;
        continue;
      }

      if (response.status === 504 || response.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        logger.warn(
          `${colors.warning}Server busy, retrying in ${delay / 1000} seconds... (Attempt ${i + 1}/${retryCount})${colors.reset}`
        );
        await timer.start(delay / 1000, {
          colors: {
            message: colors.brightYellow,
            timer: colors.yellow,
            reset: colors.reset,
          },
        });
        continue;
      }

      if (!response.ok) {
        let backendMsg = "";
        try {
          const errorJson = await response.json();
          backendMsg = errorJson.message || JSON.stringify(errorJson);
        } catch (err) {
          backendMsg = response.statusText || "Unknown error from server";
        }
        throw new Error(`HTTP error! status: ${response.status} => ${backendMsg}`);
      }

      const stream = response.body;
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      for await (const chunk of stream) {
        const textChunk = decoder.decode(chunk);
        buffer += textChunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                process.stdout.write(`${colors.brightCyan}${content}${colors.reset}`);
              }
            } catch (e) {
              logger.error(`${colors.error}Error parsing response: ${e}${colors.reset}`);
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      if (i === retryCount - 1) {
        throw error;
      }
      logger.error(`${colors.error}Error in attempt ${i + 1}: ${error}${colors.reset}`);
      await timer.start(RETRY_CONFIG.INITIAL_WAIT, {
        colors: {
          message: colors.brightRed,
          timer: colors.red,
          reset: colors.reset,
        },
      });
    }
  }
}

async function getNodeIds(authToken) {
  try {
    const response = await fetch(API_CONFIG.NODE_LIST_URL, {
      method: "GET",
      headers: {
        Authorization: `${authToken}`,
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: API_CONFIG.ORIGIN,
        Referer: API_CONFIG.REFERER,
        "Sec-Ch-Ua": `"Google Chrome";v="${BROWSER_CONFIG.CHROME_VERSION}", "Not_A_Brand";v="${BROWSER_CONFIG.BRAND_VERSION}"`,
        "Sec-Ch_Ua-Mobile": "?0",
        "Sec-Ch_Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "User-Agent": BROWSER_CONFIG.USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch node list. Status: ${response.status}`);
    }

    const json = await response.json();
    const nodeIds = [];
    if (json?.data?.objects) {
      for (const obj of json.data.objects) {
        if (obj.node_id && obj.status === "ONLINE") {
          nodeIds.push(obj.node_id);
        }
      }
    }
    return nodeIds;
  } catch (error) {
    logger.error(`${colors.error}Error fetching node IDs: ${error}${colors.reset}`);
    return [];
  }
}

async function runChatForPrivateKey(privateKey) {
  const { address: walletAddress } = w3.eth.accounts.privateKeyToAccount(privateKey);
  const maskedAddr = maskAddress(walletAddress);

  const tokenData = await getAuthToken(privateKey);
  if (!tokenData) {
    logger.error(`${colors.error}Failed to get token for address: ${maskedAddr}${colors.reset}`);
    return;
  }
  const { access_token, api_key } = tokenData;
  logger.success(`${colors.success}Token loaded for address: ${maskedAddr}${colors.reset}`);

  const nodeIds = await getNodeIds(access_token);
  if (!nodeIds.length) {
    logger.error(`${colors.error}No node_id found (ONLINE). Skipping address: ${maskedAddr}${colors.reset}`);
    return;
  }

  const maxInteractions = nodeIds.length;
  logger.info(
    `${colors.info}Found ${maxInteractions} ONLINE node(s) for address: ${maskedAddr}${colors.reset}`
  );

  let interactionCount = 1;
  let topicIndex = 0;

  for (let i = 0; i < maxInteractions; i++) {
    logger.info(
      `${colors.bannerBorder}━━━━━━━━━━ ${colors.brightYellow}Interaction #${interactionCount}${colors.bannerBorder} ━━━━━━━━━━${colors.reset}`
    );

    const currentTopic = TOPICS[topicIndex % TOPICS.length];
    const groqMessage = await getGroqUserMessage(currentTopic);

    logger.info(`${colors.brightCyan}Groq (as User):${colors.reset}`);
    logger.info(`${colors.cyan}└─ ${colors.reset}${groqMessage}`);

    const currentNodeId = nodeIds[i];

    logger.info(
      `${colors.brightMagenta}Gaianet Assistant (node: ${currentNodeId}):${colors.reset}`
    );
    logger.info(`${colors.magenta}└─ ${colors.reset}`);

    try {
      await chatWithGaianet(groqMessage, api_key, currentNodeId, privateKey);
    } catch (error) {
      logger.error(`${colors.error}Error in interaction: ${error}${colors.reset}`);
      logger.warn(`${colors.warning}Skipping to next interaction...${colors.reset}`);
    }

    interactionCount++;
    topicIndex++;

    logger.warn(`${colors.warning}Waiting for next interaction...${colors.reset}`);
    await timer.start(RETRY_CONFIG.NORMAL_WAIT, {
      colors: {
        message: colors.brightYellow,
        timer: colors.yellow,
        reset: colors.reset,
      },
    });
  }
}

async function main() {
  try {
    console.clear();
    displayBanner();
    logger.info(`${colors.info}Starting Multi Wallets Auto Chat Program...${colors.reset}`);

    const allPrivateKeys = await getAllPrivateKeys();
    if (!allPrivateKeys.length) {
      logger.error(`${colors.error}No private keys in priv.txt. Exiting...${colors.reset}`);
      process.exit(1);
    }

    for (const pKey of allPrivateKeys) {
      const { address: walletAddress } = w3.eth.accounts.privateKeyToAccount(pKey);
      const maskedAddr = maskAddress(walletAddress);

      logger.info(`${colors.info}========== Starting with Wallet Address: ${maskedAddr} ========== ${colors.reset}`);
      await runChatForPrivateKey(pKey);
      logger.info(`${colors.info}========== Finished for Wallet Address: ${maskedAddr} ========== ${colors.reset}\n`);
    }

    logger.info(`${colors.info}All wallets have been processed. Program finished.${colors.reset}`);
  } catch (error) {
    logger.error(`${colors.error}Error in main process: ${error}${colors.reset}`);
    logger.error(`${colors.brightRed}Program terminated due to error${colors.reset}`);
  }
}

main().catch((error) => logger.error(`${colors.error}${error}${colors.reset}`));
