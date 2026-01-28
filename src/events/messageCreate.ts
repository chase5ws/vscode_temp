import { AttachmentBuilder, EmbedBuilder, TextBasedChannel } from "discord.js";
import { Event } from "../types";
import log2Xlsx from "../utils/log2Xlsx";
import createLogEmbeds from "../utils/createLogEmbeds";
import { getLoggerProfile } from "../utils/getLoggerProfile";

export default {
	name: "messageCreate",
	listener: async (client, message) => {
		const profiles = await getLoggerProfile(client, message.channelId);

		if (!profiles.length) {
			return;
		}

		for (const prof of profiles) {
			const attachments = Array.from(message.attachments.values());
			const loggingCh = (await client.channels.fetch(
				prof.logging_channel!
			)) as TextBasedChannel;
			const embeds: EmbedBuilder[] = createLogEmbeds(message);

			const logMessage = await loggingCh.send({
				content: prof.notif_role ? `<@&${prof.notif_role}>` : undefined,
				files: attachments.map((a) =>
					new AttachmentBuilder(a.url).setName(a.name)
				),
				embeds
			});

			log2Xlsx(
				{
					profileName: prof.name,
					timestamp: message.createdTimestamp,
					origMsgId: message.id,
					logMsgId: logMessage.id,
					author: {
						username: message.author.username,
						id: message.author.id
					},
					content: message.content,
					attachments: attachments.map((a) => a.url),
					channelId: message.channelId
				},
				"create"
			);
		}
	}
} as Event<"messageCreate">;
