import { DISCORD_WEBHOOK_URL } from "astro:env/server";
import axios from 'redaxios';

function discordLog(...args: any[]) {
  if (DISCORD_WEBHOOK_URL) {
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    });

    axios.post(DISCORD_WEBHOOK_URL, {
      content: `\`\`\`\n${formattedArgs.join(' ')}\n\`\`\``,
    });
  }
}

export function log(...args: any[]) {
  console.log(...args);
  discordLog(...args);
}

export function logError(...args: any[]) {
  console.error(...args);
  discordLog(...args);
}
