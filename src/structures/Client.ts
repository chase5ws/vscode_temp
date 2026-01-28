import { ClientOptions, Collection, Client as DJSClient } from "discord.js";
import {
	RedisClientType,
	RedisFunctions,
	RedisModules,
	RedisScripts,
	createClient
} from "@redis/client";
import { readdirSync } from "fs";
import { join } from "path";
import { Command, Event } from "../types";

export default class Client<
	Ready extends boolean = boolean
> extends DJSClient<Ready> {
	public readonly db: RedisClientType<
		RedisModules,
		RedisFunctions,
		RedisScripts
	>;
	public readonly commands: Collection<string, Command>;
	public vCode?: string;

	constructor(options: ClientOptions) {
		super(options);

		this.db = createClient({
			socket: {
				host: process.env["DB_HOST"],
				port: parseInt(process.env["DB_PORT"]!)
			},
			username: process.env["DB_USERNAME"],
			password: process.env["DB_PASSWORD"]
		})
			.on("connect", () => logger.info("Connected to database."))
			.on("end", () => logger.warn("Disconnected from database."))
			.on("error", (err) => logger.error(err));
		this.commands = new Collection();

		this.init();
	}

	public async deployCommands() {
		if (!this.isReady()) {
			return;
		}

		await this.application.commands.set(
			this.commands.map((c) => c.data.setDMPermission(false).toJSON())
		);
	}

	private async loadCommands() {
		const files = readdirSync(join(__dirname, "..", "commands")).filter(
			(file) => file.endsWith(".js")
		);

		for (const file of files) {
			const command = (await import(join(__dirname, "..", "commands", file)))
				.default as Command;

			this.commands.set(command.data.name, command);
		}
	}

	private async loadEvents() {
		const files = readdirSync(join(__dirname, "..", "events")).filter((file) =>
			file.endsWith(".js")
		);

		for (const file of files) {
			const event = (await import(join(__dirname, "..", "events", file)))
				.default as Event;

			this.on(
				event.name as string,
				event.listener.bind(null, this as Client<true>)
			);
		}
	}

	private async init() {
		await this.db.connect();
		await this.loadCommands();
		await this.loadEvents();
		await this.login(process.env["TOKEN"]);
	}
}
