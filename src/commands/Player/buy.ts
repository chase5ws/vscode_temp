import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandUserOption
} from "discord.js";
import { isItemWorking } from "../../utils/gameUtils.js";
import { formatTime, resolveReply } from "../../utils/botUtils.js";
import { getProductData, getUserData } from "../../utils/mognoUtils.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("buy")
		.setDescription("忍者村商店")
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName("index")
				.setDescription("商品編號")
				.setMinValue(1)
				.setRequired(true)
		)
		.addUserOption(
			new SlashCommandUserOption()
				.setName("member")
				.setDescription("成員")
				.setRequired(false)
		)
		.setDMPermission(false),
	defer: true,
	run: async (client, interaction, replyOptions) => {
		Object.assign(replyOptions, {
			user: interaction.user
		});

		const products = await getProductData(client);
		const index = interaction.options.getInteger("index", true);

		Object.assign(replyOptions, { index });

		if (index > products.length) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["invalid_index"],
					replyOptions
				)
			);
			return;
		}

		Object.assign(replyOptions, {
			name: products[index - 1].name,
			price: products[index - 1].price.toLocaleString()
		});

		const userData = await getUserData(client, interaction.user.id);

		if (userData.coins < products[index - 1].price) {
			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["too_poor"],
					replyOptions
				)
			);
			return;
		}

		const target = interaction.options.getUser("member");

		if (target && target.id !== interaction.user.id) {
			Object.assign(replyOptions, { target });

			const targetData = await getUserData(client, target.id);

			if (isItemWorking(targetData.items[products[index - 1].itemType])) {
				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["target_have_item"],
						replyOptions
					)
				);
				return;
			}

			if (products[index - 1].itemType === ItemType.ResetCd) {
				await targetData.updateOne({
					$unset: {
						"timestamps.dice": 0,
						"timestamps.roulette": 0,
						"timestamps.rps": 0,
						"timestamps.guess": 0
					}
				});
				await userData.updateOne({
					$inc: {
						coins: -products[index - 1].price
					}
				});
			} else if (products[index - 1].itemType === ItemType.Protection) {
				await targetData.updateOne({
					$inc: {
						"gamesData.protected": 1
					}
				});
				await userData.updateOne({
					$inc: {
						coins: -products[index - 1].price
					}
				});
			} else if (products[index - 1].itemType === ItemType.Respawn) {
				if (
					targetData.timestamps.killed &&
					targetData.timestamps.killed + 3600000 < Date.now()
				) {
					await interaction.editReply(
						resolveReply(
							client.messages[interaction.commandName]["target_not_dead"],
							replyOptions
						)
					);
					return;
				}

				await targetData.updateOne({
					$set: {
						"timestamps.killed": 0
					}
				});
				await userData.updateOne({
					$inc: {
						coins: -products[index - 1].price
					}
				});
			} else if (products[index - 1].itemType === ItemType.NoEffect) {
				const origCounts =
					targetData.noEffectItems?.get(products[index - 1].name) ?? 0;

				await targetData.updateOne({
					$set: {
						[`noEffectItems.${products[index - 1].name}`]: origCounts + 1
					}
				});
				await userData.updateOne({
					$inc: {
						coins: -products[index - 1].price
					}
				});
			} else {
				await targetData.updateOne({
					$set: {
						[`items.${products[index - 1].itemType}.multiplier`]:
							products[index - 1].multiplier,
						[`items.${products[index - 1].itemType}.duration`]:
							products[index - 1].duration,
						[`items.${products[index - 1].itemType}.startAt`]: Date.now()
					}
				});
				await userData.updateOne({
					$inc: {
						coins: -products[index - 1].price
					}
				});
			}

			await interaction.editReply(
				resolveReply(
					client.messages[interaction.commandName]["purchased_gift"],
					replyOptions
				)
			);
		} else {
			if (isItemWorking(userData.items[products[index - 1].itemType])) {
				const current = (await getProductData(client, {
					itemType: products[index - 1].itemType,
					multiplier: userData.items[products[index - 1].itemType].multiplier,
					duration: userData.items[products[index - 1].itemType].duration
				}))!;

				Object.assign(replyOptions, {
					name: current.name,
					timeRemains: formatTime(
						userData.items[products[index - 1].itemType].startAt +
							current.duration! * 3600000 -
							Date.now()
					)
				});

				const reply = await interaction.editReply({
					...resolveReply(
						client.messages[interaction.commandName]["to_overwrite"],
						replyOptions
					),
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId("replace_confirm")
								.setLabel("是")
								.setStyle(ButtonStyle.Success),
							new ButtonBuilder()
								.setCustomId("replace_deny")
								.setLabel("否")
								.setStyle(ButtonStyle.Secondary)
						)
					]
				});
				const answer = await reply
					.awaitMessageComponent({
						componentType: ComponentType.Button,
						filter: (i) => i.user.id === interaction.user.id,
						time: 120000,
						dispose: true
					})
					.catch(() => null);

				if (!answer) {
					await interaction.editReply({
						...resolveReply(
							client.messages[interaction.commandName]["cancel_purchase"],
							replyOptions
						),
						components: []
					});
					return;
				}

				await answer.deferUpdate();

				if (answer.customId === "replace_deny") {
					await answer.editReply({
						...resolveReply(
							client.messages[interaction.commandName]["cancel_purchase"],
							replyOptions
						),
						components: []
					});
					return;
				}

				Object.assign(replyOptions, {
					name: products[index - 1].name
				});

				await answer.editReply({
					...resolveReply(
						client.messages[interaction.commandName]["purchased_personal"],
						replyOptions
					),
					components: []
				});
			} else {
				if (products[index - 1].itemType === ItemType.ResetCd) {
					await userData.updateOne({
						$unset: {
							"timestamps.dice": 0,
							"timestamps.roulette": 0,
							"timestamps.rps": 0,
							"timestamps.guess": 0
						},
						$inc: {
							coins: -products[index - 1].price
						}
					});
				} else if (products[index - 1].itemType === ItemType.Protection) {
					await userData.updateOne({
						$inc: {
							"gamesData.protected": 1,
							coins: -products[index - 1].price
						}
					});
				} else if (products[index - 1].itemType === ItemType.Respawn) {
					if (
						userData.timestamps.killed &&
						userData.timestamps.killed + 3600000 < Date.now()
					) {
						await interaction.editReply(
							resolveReply(
								client.messages[interaction.commandName]["not_dead"],
								replyOptions
							)
						);
						return;
					}

					await userData.updateOne({
						$set: {
							"timestamps.killed": 0
						},
						$inc: {
							coins: -products[index - 1].price
						}
					});
				} else if (products[index - 1].itemType === ItemType.NoEffect) {
					const origCounts =
						userData.noEffectItems?.get(products[index - 1].name) ?? 0;

					await userData.updateOne({
						$set: {
							[`noEffectItems.${products[index - 1].name}`]: origCounts + 1
						},
						$inc: {
							coins: -products[index - 1].price
						}
					});
				} else {
					await userData.updateOne({
						$set: {
							[`items.${products[index - 1].itemType}.multiplier`]:
								products[index - 1].multiplier,
							[`items.${products[index - 1].itemType}.duration`]:
								products[index - 1].duration,
							[`items.${products[index - 1].itemType}.startAt`]: Date.now()
						},
						$inc: {
							coins: -products[index - 1].price
						}
					});
				}

				await interaction.editReply(
					resolveReply(
						client.messages[interaction.commandName]["purchased_personal"],
						replyOptions
					)
				);
			}
		}
	}
};

export default command;
