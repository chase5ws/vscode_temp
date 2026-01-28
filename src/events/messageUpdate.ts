import { TextBasedChannel, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { Event } from "../types";
import createLogEmbeds from "../utils/createLogEmbeds";
import log2Xlsx from "../utils/log2Xlsx";
import { getLoggerProfile } from "../utils/getLoggerProfile";

export default {
	name: "messageUpdate",
	listener: async (client, _oMessage, nMessage) => {
		const profiles = await getLoggerProfile(client, nMessage.channelId);

		if (!profiles.length) {
			return;
		}

		for (const prof of profiles) {
			const attachments = Array.from(nMessage.attachments.values());
			const loggingCh = (await client.channels.fetch(
				prof.logging_channel!
			)) as TextBasedChannel;
			const embeds: EmbedBuilder[] = createLogEmbeds(nMessage);

			const logMessage = await loggingCh.send({
				content: prof.notif_role ? `<@&${prof.notif_role}>` : undefined,
				files: attachments.map((a) =>
					new AttachmentBuilder(a.url).setName(a.name)
				),
				embeds
			});

			const origLogMsgId = log2Xlsx(
				{
					profileName: prof.name,
					timestamp: nMessage.createdTimestamp,
					origMsgId: nMessage.id,
					logMsgId: logMessage.id,
					content: nMessage.content ?? undefined,
					attachments: attachments.map((a) => a.url)
				},
				"edit"
			);

			await loggingCh.messages.delete(origLogMsgId!).catch();
		}
	}
} as Event<"messageUpdate">;
