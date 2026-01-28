import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder
} from "discord.js";
import { Event } from "../types";
import checkGuildVerification from "../utils/checkGuildVerification";

export default {
	name: "guildCreate",
	listener: async (client, guild) => {
		logger.debug(`Joined guild: ${guild.name}(${guild.id})`);

		const verified = await checkGuildVerification(client, guild);

		if (verified) {
			return;
		}

		const owner = await guild.fetchOwner();

		try {
			await owner.send({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							"點擊下方按鈕，並於表單中輸入驗證碼，以開通使用權限。"
						)
						.setFooter({
							text: `對象伺服器：${guild.name}`
						})
						.setColor("Aqua")
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`verify_${guild.id}`)
							.setLabel("驗證")
							.setStyle(ButtonStyle.Primary)
					)
				]
			});
			logger.debug(`Sent guild verification: ${guild.name}(${guild.id})`);
		} catch (e) {
			await guild.leave();
		}
	}
} as Event<"guildCreate">;
