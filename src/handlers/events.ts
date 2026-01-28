import path from "path";
import { fileURLToPath } from "url";
import { readdirSync } from "fs";
import mongoose from "mongoose";
import { Client } from "discord.js";

export async function loadEvents(client: import("discord.js").Client) {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const dirs = readdirSync(`${__dirname}/../events`, {
		withFileTypes: true
	})
		.filter((dir) => dir.isDirectory())
		.map((dir) => dir.name);

	for (const dir of dirs) {
		const eventFiles = readdirSync(`${__dirname}/../events/${dir}`).filter(
			(file) => file.endsWith(".js")
		);

		for (const file of eventFiles) {
			const event: ClientEvent = (
				await import(`file://${__dirname}/../events/${dir}/${file}`)
			).default;

			if (event.lib === "djs") {
				client.on(event.name, event.run.bind(null, client as Client<true>));
			} else {
				mongoose.connection.on(
					event.name,
					event.run.bind(null, client as Client<true>)
				);
			}

			client.events.set(event.name, event);
		}
	}

	logger.info(`事件載入完成。(${client.events.size})`);
}
