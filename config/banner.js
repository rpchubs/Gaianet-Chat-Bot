// banner.js
import { colors } from "./colors.js";

export function displayBanner() {
  const banner = `
${colors.cyan}
  ██████╗ ██████╗  ██████╗    ██╗  ██╗██╗   ██╗██████╗ ███████╗
  ██╔══██╗██╔══██╗██╔════╝    ██║  ██║██║   ██║██╔══██╗██╔════╝
  ██████╔╝██████╔╝██║         ███████║██║   ██║██████╔╝███████╗
  ██╔══██╗██╔═══╝ ██║         ██╔══██║██║   ██║██╔══██╗╚════██║
  ██║  ██║██║     ╚██████╗    ██║  ██║╚██████╔╝██████╔╝███████║
  ╚═╝  ╚═╝╚═╝      ╚═════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
${colors.yellow}GAIANET CHAT BOT
${colors.blue}Telegram Channel: https://t.me/RPC_Hubs
${colors.reset}
`;

  // In banner ra console
  console.log(banner);
}
