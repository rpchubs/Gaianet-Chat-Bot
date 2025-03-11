# Gaianet Chat Bot

Gaianet Chat Bot is an automated multi-wallet chat program that interacts with Gaianet AI nodes. This guide provides steps to install, configure, and run the bot on Windows and MacOS/Linux.

## Installation Guide

### Prerequisites
Before installing, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Git](https://git-scm.com/)
- A terminal or command prompt (PowerShell for Windows, Terminal for MacOS/Linux)

### Step 1: Clone the Repository
Open a terminal and run:
```sh
git clone https://github.com/rpchubs/Gaianet-Chat-Bot.git
cd Gaianet-Chat-Bot
```

### Step 2: Install Dependencies
Run the following command to install the required packages:
```sh
npm install
```

## Configuration

### Step 3: Set Up Required Files
1. **Private Key Storage**
   - Create a file named `priv.txt` in the root directory.
   - Add your private wallet keys, each on a new line.

2. **Groq API Key Setup**
   - Visit [Groq API](https://console.groq.com/) and sign in.
   - Generate an API key from the API management section.
   - Open `main.js`, locate **line 13**, and replace `"Groq-Api-Key"` with your actual API key:
     ```js
     const groqClient = new Groq({
       apiKey: "your-groq-api-key",
     });
     ```

3. **Environment Variables** (Optional)
   - If required, set up environment variables using `.env`.
   - Example format:
     ```sh
     GROQ_API_KEY=your-groq-api-key
     ```

### Step 4: Configure `main.js`
The main bot logic is in `main.js`. Ensure the following are correctly set:
- API endpoints (`API_CONFIG`)
- AI models (`MODEL_CONFIG`)
- Retry and authentication settings
- System prompt messages

## Running the Bot

### On MacOS/Linux
Use the terminal and navigate to the bot directory:
```sh
cd Gaianet-Chat-Bot
node main.js
```

### On Windows
Use PowerShell or Command Prompt:
```sh
cd Gaianet-Chat-Bot
node main.js
```

## License
This project is licensed under the MIT License.

