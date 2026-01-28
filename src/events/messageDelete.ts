import { TextBasedChannel } from "discord.js";
import { Event } from "../types";
import log2Xlsx from "../utils/log2Xlsx";
import { getLoggerProfile } from "../utils/getLoggerProfile";

export default {
	name: "messageDelete",
	listener: async (client, message) => {
		const profiles = await getLoggerProfile(client, message.channelId);

		if (!profiles.length) {
			return;
		}

		for (const prof of profiles) {
			const loggingCh = (await client.channels.fetch(
				prof.logging_channel!
			)) as TextBasedChannel;
			const origLogMsgId = log2Xlsx(
				{
					profileName: prof.name,
					timestamp: message.createdTimestamp,
					origMsgId: message.id
				},
				"delete"
			);

			await loggingCh.messages.delete(origLogMsgId!).catch();
		}
	}
} as Event<"messageDelete">;
