import { createRequire } from "node:module";
import { Collection, EmbedBuilder } from "discord.js";
import { loadEvents } from "../handlers/events.js";
import { loadCommands } from "../handlers/commands.js";
import mongoose from "mongoose";

function checkConfig(config: any) {
	let key;

	if (typeof config["token"] !== "string" || !config["token"].length) {
		throw new Error("機器人token設定不正確");
	}
	if (typeof config["db"] !== "string" || !config["db"].length) {
		throw new Error("資料庫連結設定不正確");
	}
	if (
		typeof config["chat4coins"]["amount"] !== "number" ||
		!config["chat4coins"]["amount"]
	) {
		throw new Error("聊天貨幣獎勵數量設定不正確");
	}

	for (key of Object.keys(config["bet_limit"])) {
		if (
			typeof config["bet_limit"][key] !== "number" ||
			!Number.isInteger(config["bet_limit"][key]) ||
			config["bet_limit"][key] < 0
		) {
			throw new Error(`${key}的賭注上限值無效`);
		}
	}
	for (key of Object.keys(config["roles"])) {
		if (
			typeof config["roles"][key] !== "string" ||
			!config["roles"][key].length
		) {
			throw new Error(`${key}身分組設定不正確`);
		}
	}
	for (key of Object.keys(config["channels"])) {
		if (
			typeof config["channels"][key] !== "string" ||
			!config["channels"][key].length
		) {
			throw new Error(`${key}頻道設定不正確`);
		}
	}

	const cmdConf = config["commands"];
	// daily
	if (
		typeof cmdConf["daily"]["reward"]["min"] !== "number" ||
		typeof cmdConf["daily"]["reward"]["max"] !== "number" ||
		typeof cmdConf["daily"]["reward"]["inc_time"] !== "number" ||
		typeof cmdConf["daily"]["reward"]["inc_amt"] !== "number" ||
		!Number.isInteger(cmdConf["daily"]["reward"]["min"]) ||
		!Number.isInteger(cmdConf["daily"]["reward"]["max"]) ||
		!Number.isInteger(cmdConf["daily"]["reward"]["inc_time"]) ||
		!Number.isInteger(cmdConf["daily"]["reward"]["inc_amt"]) ||
		cmdConf["daily"]["reward"]["min"] < 0 ||
		cmdConf["daily"]["reward"]["max"] <= 0 ||
		cmdConf["daily"]["reward"]["inc_time"] <= 0 ||
		cmdConf["daily"]["reward"]["inc_amt"] < 0
	) {
		throw new Error("daily的獎勵設定不正確");
	}
	if (
		typeof cmdConf["daily"]["monthly_role"]["counts"] !== "number" ||
		typeof cmdConf["daily"]["monthly_role"]["id"] !== "string" ||
		cmdConf["daily"]["monthly_role"]["count"] <= 0 ||
		!cmdConf["daily"]["monthly_role"]["id"].length
	) {
		throw new Error("daily的每月簽到身分組設定不正確");
	}
	// work
	if (
		typeof cmdConf["work"]["announce_ch"] !== "string" ||
		!cmdConf["work"]["announce_ch"].length
	) {
		throw new Error("work的公告頻道設定不正確");
	}
	if (
		typeof cmdConf["work"]["bonus"] !== "number" ||
		cmdConf["work"]["bonus"] < 0
	) {
		throw new Error("work的額外獎金設定不正確");
	}
	if (
		typeof cmdConf["work"]["limit"] !== "number" ||
		cmdConf["work"]["limit"] < 0
	) {
		throw new Error("work的工作上限設定不正確");
	}

	for (key of Object.keys(cmdConf["work"]["roles"])) {
		if (
			typeof cmdConf["work"]["roles"][key]["id"] !== "string" ||
			typeof cmdConf["work"]["roles"][key]["max"] !== "number" ||
			typeof cmdConf["work"]["roles"][key]["min"] !== "number" ||
			!cmdConf["work"]["roles"][key]["id"].length ||
			cmdConf["work"]["roles"][key]["max"] <= 0 ||
			cmdConf["work"]["roles"][key]["min"] < 0
		) {
			throw new Error(`work階級身分組的${key}設定不正確`);
		}
	}
	// war
	if (
		!Array.isArray(cmdConf["war"]["rewards"]) ||
		cmdConf["war"]["rewards"].length !== 3 ||
		cmdConf["war"]["rewards"].some(
			(set) => !Array.isArray(set) || set.length !== 3
		)
	) {
		throw new Error("war獎金設定不正確");
	}

	for (key of Object.keys(cmdConf["war"]["events"])) {
		if (
			!Array.isArray(cmdConf["war"]["events"][key]) ||
			!cmdConf["war"]["events"][key].length
		) {
			throw new Error(`war事件的${key}設定不正確`);
		}
	}
	// spring
	if (
		typeof cmdConf["spring"]["channel"] !== "string" ||
		!cmdConf["spring"]["channel"].length
	) {
		throw new Error("spring的頻道設定不正確");
	}
	if (
		typeof cmdConf["spring"]["role"] !== "string" ||
		!cmdConf["spring"]["role"].length
	) {
		throw new Error("spring的獎勵身分組設定不正確");
	}
	if (
		typeof cmdConf["spring"]["chance"] !== "number" ||
		cmdConf["spring"]["chance"] < 0
	) {
		throw new Error("spring的成功機率設定不正確");
	}

	for (key of Object.keys(cmdConf["spring"]["replies"])) {
		if (
			!Array.isArray(cmdConf["spring"]["replies"][key]) ||
			!cmdConf["spring"]["replies"][key].length
		) {
			throw new Error("spring的回覆設定不正確");
		}
	}

	Object.freeze(config);
}

export async function initialize(client: import("discord.js").Client) {
	const req = createRequire(import.meta.url);

	client.config = req("../../../config/config.json");
	Object.assign(client.config, {
		commands: req("../../../config/commands.json")
	});

	checkConfig(client.config);

	client.messages = req("../../../config/messages.json");
	client.events = new Collection();
	client.commands = new Collection();
	client.textTimestamp = new Collection();

	await loadEvents(client);
	await loadCommands(client);
	await mongoose.connect(client.config.db);
	await client.login(client.config.token);
}

export function antiCrash() {
	process.on("unhandledRejection", (reason) => {
		logger.error("[UnhandledRejection]", reason);
	});
}

export function getUTC8Date() {
	return new Date(Date.now() + 8 * 60 * 60 * 1000);
}

export function formatInt(int: number) {
	return int < 10 ? `0${int}` : int;
}

export function msTillEnd() {
	const now = getUTC8Date();
	const end = new Date(
		`${now.getUTCFullYear()}-${formatInt(now.getUTCMonth() + 1)}-${formatInt(
			now.getUTCDate()
		)}T23:59:59+08:00`
	);

	return end.getTime() - Date.now() + 1000;
}

function isEmbed(data: ReplyData): data is CustomEmbedData {
	if (typeof data === "string") {
		return false;
	}

	return "title" in data || "description" in data || "fields" in data;
}

function formatContent(raw: string, options: { [x: string]: any }) {
	const placeholders = raw.match(/\{[^{}]+\}/g);

	if (placeholders) {
		let placeholder;
		let key;
		let value;

		for (placeholder of placeholders) {
			value = options;
			placeholder = placeholder.slice(1, placeholder.length - 1);

			for (key of placeholder.split(".")) {
				value = value[key];
			}

			raw = raw.replaceAll(`{${placeholder}}`, value);
		}
	}

	return raw;
}

export function resolveReply(data: ReplyData, options: { [x: string]: any }) {
	if (typeof data === "string") {
		return { content: formatContent(data, options) };
	}
	if (isEmbed(data)) {
		return {
			embeds: [
				new EmbedBuilder()
					.setTitle(data.title ? formatContent(data.title, options) : null)
					.setDescription(
						data.description ? formatContent(data.description, options) : null
					)
					.addFields(
						data.fields?.map((f) => ({
							name: formatContent(f.name, options),
							value: formatContent(f.value, options),
							inline: !!f.inline
						})) ?? []
					)
					.setFooter(
						data.footer
							? {
									text: formatContent(data.footer, options)
								}
							: null
					)
					.setColor(data.color ?? null)
			]
		};
	}

	return {
		content: data.content ? formatContent(data.content, options) : undefined,
		embeds:
			data.embeds?.map((e) =>
				new EmbedBuilder()
					.setTitle(e.title ? formatContent(e.title, options) : null)
					.setDescription(
						e.description ? formatContent(e.description, options) : null
					)
					.addFields(
						e.fields?.map((f) => ({
							name: formatContent(f.name, options),
							value: formatContent(f.value, options),
							inline: !!f.inline
						})) ?? []
					)
					.setFooter(
						e.footer
							? {
									text: formatContent(e.footer, options)
								}
							: null
					)
					.setColor(e.color ?? null)
			) ?? []
	};
}

export function formatTime(last: number) {
	const seconds = Math.round(last / 1000);

	if (seconds >= 3600) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = (seconds % 3600) % 60;

		return `${h} 小時${m ? ` ${m} 分` : ""}${s ? ` ${s} 秒` : ""}`;
	} else if (seconds >= 60) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;

		return `${m} 分${s ? ` ${s} 秒` : ""}`;
	} else {
		return `${seconds} 秒`;
	}
}

export function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}

export function isUrl(str: string) {
	try {
		const url = new URL(str);

		return url.protocol === "https:";
	} catch (_) {
		return false;
	}
}
