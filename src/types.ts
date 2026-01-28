import {
	ChatInputCommandInteraction,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import Client from "./structures/Client";

export type Event<T extends keyof ClientEvents = keyof ClientEvents> = {
	name: T;
	listener: (client: Client<true>, ...args: ClientEvents[T]) => void;
};

export type Command = {
	data:
		| SlashCommandBuilder
		| SlashCommandOptionsOnlyBuilder
		| SlashCommandSubcommandsOnlyBuilder;
	execute: (
		client: Client<true>,
		interaction: ChatInputCommandInteraction
	) => void;
};

export type LoggerProfile = {
	name: string;
	notif_role?: string;
	logging_channel?: string;
	listened_channels: string[];
};

export type LoggerMessageData = {
	profileName: string;
	timestamp: number;
	origMsgId: string;
	logMsgId?: string;
	author?: {
		username: string;
		id: string;
	};
	content?: string;
	attachments?: string[];
	channelId?: string;
};
