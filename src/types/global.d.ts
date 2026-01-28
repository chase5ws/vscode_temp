import {
	ChatInputCommandInteraction,
	Client,
	Collection,
	SlashCommandBuilder,
	ColorResolvable,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import { logTypes } from "../utils/logger.js";

declare module "discord.js" {
	interface Client {
		config: {
			token: string;
			db: string;
			guildId: string;
			bet_limit: {
				dice: number;
				guess: number;
				roulette: number;
				rps: number;
			};
			roles: {
				worker: string;
				killer: string;
				robber: string;
				gambler: string;
				war_host: string;
				table_host: string;
				level_10: string;
				post_notif: string;
			};
			channels: {
				game: string;
				leveling: string;
				post: string;
			};
			chat4coins: {
				channels: string[];
				limit: number;
				amount: number;
			};
			commands: {
				daily: {
					reward: {
						min: number;
						max: number;
						inc_time: number;
						inc_amt: number;
					};
					monthly_role: {
						counts: number;
						id: string;
					};
				};
				work: {
					announce_ch: string;
					bonus: number;
					limit: number;
					roles: {
						tier_1: {
							id: string;
							max: number;
							min: number;
						};
						tier_2: {
							id: string;
							max: number;
							min: number;
						};
						tier_3: {
							id: string;
							max: number;
							min: number;
						};
						tier_4: {
							id: string;
							max: number;
							min: number;
						};
					};
				};
				war: {
					rewards: number[][];
					events: {
						normal: string[];
						death: string[];
						respawn: string[];
					};
				};
				spring: {
					channel: string;
					role: string;
					chance: number;
					replies: {
						success: string[];
						fail: string[];
					};
				};
			};
		};
		messages: {
			$: string;
			[x: string]: {
				[x: string]: ReplyData | any;
			};
		};
		events: Collection<string, ClientEvent>;
		commands: Collection<string, Command>;
		textTimestamp: Collection<string, number>;
	}
}

declare global {
	var logger: {
		[K in logTypes]: (...args: any[]) => void;
	};

	var ItemType: {
		IncBetAmt: 0;
		IncWorkReward: 1;
		ResetCd: 2;
		Protection: 3;
		Respawn: 4;
		NoEffect: 5;
	};

	interface ClientEvent {
		name: string;
		lib: "djs" | "mongo";
		run: (client: Client<true>, ...args: any[]) => void;
	}

	interface Command {
		data:
			| SlashCommandBuilder
			| SlashCommandOptionsOnlyBuilder
			| SlashCommandSubcommandsOnlyBuilder;
		defer?: boolean;
		ephemeral?: boolean;
		game?: boolean;
		leveling?: boolean;
		run: (
			client: Client<true>,
			interaction: ChatInputCommandInteraction<"cached">,
			replyOptions: { [x: string]: any }
		) => Promise<void>;
	}

	type CustomEmbedData = {
		title?: string;
		description?: string;
		fields?: { name: string; value: string; inline?: boolean }[];
		footer?: string;
		color?: ColorResolvable;
	};

	type ReplyData =
		| string
		| CustomEmbedData
		| {
				content?: string;
				embeds?: CustomEmbedData[];
		  };
}
