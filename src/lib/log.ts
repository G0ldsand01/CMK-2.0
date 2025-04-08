import { DISCORD_WEBHOOK_URL } from "astro:env/server";
import axios from 'redaxios';

export default function log(...args: any[]) {
  console.log(...args);

  if (DISCORD_WEBHOOK_URL) {
    axios.post(DISCORD_WEBHOOK_URL, {
      content: `${args.join(' ')}`,
    });
  }
}
