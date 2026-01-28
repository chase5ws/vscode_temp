import { resolveReply } from "../../utils/botUtils.js";
import { requiredExp } from "../../utils/levelingUtils.js";
import { getUserData } from "../../utils/mognoUtils.js";

const event: ClientEvent = {
	name: "messageCreate",
	lib: "djs",
	run: async (client, message: import("discord.js").Message) => {
		if (!message.inGuild() || message.author.bot) {
			return;
		}
		if (
			(client.textTimestamp.get(message.author.id) ?? 0) + 5000 <
			Date.now()
		) {
			getUserData(client, message.author.id).then(async (d) => {
				client.textTimestamp.set(message.author.id, Date.now());

				const reqExp = requiredExp((d.level ?? 0) + 1);

				if (d.exp && d.exp + 1 === reqExp) {
					if (d.level && d.level + 1 === 10) {
						(await message.guild.members.fetch(message.author)).roles.add(
							client.config.roles.level_10
						);
					}

					await d.updateOne({
						$inc: {
							level: 1
						},
						$set: {
							exp: 0
						}
					});
					await message.reply(
						resolveReply(client.messages["leveling"]["level_up"], {
							user: message.author,
							level: ((d.level ?? 0) + 1).toLocaleString()
						})
					);
				} else {
					await d.updateOne({
						$inc: {
							exp: 1
						}
					});
				}
			});
		}
		if (
			client.config.chat4coins.channels.includes(message.channelId) ||
			!client.config.chat4coins.channels.length
		) {
			getUserData(client, message.author.id).then(async (d) => {
				if ((d.chat4coins ?? 0) === client.config.chat4coins.limit) {
					return;
				}

				await d.updateOne({
					$inc: {
						chat4coins: 1,
						coins: client.config.chat4coins.amount
					}
				});
			});
		}
	}
};

export default event;
