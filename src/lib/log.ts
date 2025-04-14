import { DISCORD_WEBHOOK_URL } from 'astro:env/server';
import axios from 'redaxios';

async function discordLog(...args: any[]) {
	if (DISCORD_WEBHOOK_URL && process.env.NODE_ENV === 'production') {
		const formattedArgs = args.map((arg) => {
			if (typeof arg === 'object' && arg !== null) {
				return JSON.stringify(arg, null, 2);
			}
			return String(arg);
		});

		await axios
			.post(DISCORD_WEBHOOK_URL, {
				content: `\`\`\`\n${formattedArgs.join(' ')}\n\`\`\``,
			})
			.catch((err) => {
				console.error('Failed to send log to Discord:', err);
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
