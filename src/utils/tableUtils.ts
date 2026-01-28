import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	ModalBuilder,
	resolveColor,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { tableDataDb } from "../mongoose/tableData.js";
import { formatInt, getUTC8Date, isUrl, resolveReply } from "./botUtils.js";
import { getUserData } from "./mognoUtils.js";

function optionStr(data: { [x: string]: any }, index: 0 | 1): string {
	const option = data["fields"][0]["value"]
		.replace("\u200b", "")
		.split(" | ")
		[index]?.replace(/`/g, "");

	return option ?? "";
}

function resolveTimeLimit(raw: string) {
	if (!raw.match(/\d{8} \d{2}:\d{2}/)) {
		return;
	}

	const date = new Date(
		`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(
			9
		)}:00+08:00`
	);
	const timestamp = date.getTime();

	if (isNaN(timestamp) || timestamp < Date.now()) {
		return;
	}

	return Math.round(timestamp / 1000);
}

function validateData(data: { [x: string]: any }) {
	for (const field of data["fields"]) {
		if (field["value"] === "\u200b") {
			return false;
		}
	}

	return true;
}

export async function handleTableCreate(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	const channel = interaction.options.getChannel("channel", true, [
		ChannelType.GuildText
	]);

	if (!channel.permissionsFor(client.user)?.has("SendMessages")) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["cannot_send_msg"],
				replyOptions
			)
		);
		return;
	}

	const data: { [x: string]: any } = {
		title: "標題",
		description: "敘述",
		fields: [
			{ name: "選項：", value: "\u200b" },
			{ name: "下注金額：", value: "\u200b" },
			{ name: "獎勵金額：", value: "\u200b" },
			{ name: "時限", value: "\u200b" }
		]
	};
	const collector = (
		await interaction.editReply({
			embeds: [data],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("set-content")
						.setLabel("設定賭盤內容")
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId("set-others")
						.setLabel("設定其他資料")
						.setStyle(ButtonStyle.Primary)
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId("finish")
						.setLabel("完成設定")
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId("cancel")
						.setLabel("取消設定")
						.setStyle(ButtonStyle.Danger)
				)
			]
		})
	).createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => i.user.id === interaction.user.id,
		time: 300000,
		dispose: true
	});

	collector
		.on("collect", async (i) => {
			switch (i.customId) {
				case "set-content": {
					await i.showModal(
						new ModalBuilder()
							.setCustomId(i.customId)
							.setTitle("設定賭盤內容")
							.addComponents(
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("title")
										.setLabel("標題")
										.setMaxLength(25)
										.setPlaceholder("輸入標題")
										.setValue(data.title)
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("description")
										.setLabel("敘述")
										.setMaxLength(1000)
										.setPlaceholder("輸入敘述")
										.setValue(data.description)
										.setStyle(TextInputStyle.Paragraph)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("image")
										.setLabel("圖片")
										.setPlaceholder("輸入圖片網址")
										.setValue(data["image"] ? data["image"]["url"] : "")
										.setStyle(TextInputStyle.Short)
										.setRequired(false)
								)
							)
					);

					const modal = await i
						.awaitModalSubmit({
							filter: (m) => m.user.id === i.user.id,
							time: 100000,
							dispose: true
						})
						.catch(() => null);

					if (!modal) {
						return;
					}

					await modal.deferUpdate();

					const image = modal.fields.getTextInputValue("image");

					Object.assign(data, {
						title: modal.fields.getTextInputValue("title"),
						description: modal.fields.getTextInputValue("description"),
						image: isUrl(image)
							? {
									url: image
							  }
							: undefined
					});
					await modal.editReply({
						embeds: [data]
					});
					break;
				}
				case "set-others": {
					const date = getUTC8Date();

					await i.showModal(
						new ModalBuilder()
							.setCustomId(i.customId)
							.setTitle("設定其他資料")
							.addComponents(
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("option-1")
										.setLabel("選項1")
										.setMaxLength(10)
										.setPlaceholder("輸入選項1")
										.setValue(optionStr(data, 0))
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("option-2")
										.setLabel("選項2")
										.setMaxLength(10)
										.setPlaceholder("輸入選項2")
										.setValue(optionStr(data, 1))
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("bet-amount")
										.setLabel("下注金額")
										.setPlaceholder("輸入下注金額")
										.setValue(
											data["fields"][1]["value"]
												.replace(/,|\u200b/g, "")
												.replace(replyOptions["$"], "")
										)
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("prize-amount")
										.setLabel("獎勵金額")
										.setPlaceholder("輸入獎勵金額")
										.setValue(
											data["fields"][2]["value"]
												.replace(/,|\u200b/g, "")
												.replace(replyOptions["$"], "")
										)
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
								new ActionRowBuilder<TextInputBuilder>().addComponents(
									new TextInputBuilder()
										.setCustomId("time-limit")
										.setLabel("時限")
										.setPlaceholder(
											`輸入時限 (${date.getFullYear()}${formatInt(
												date.getMonth() + 1
											)}${formatInt(date.getDate())} ${formatInt(
												date.getHours()
											)}:${formatInt(date.getMinutes())})`
										)
										.setValue(data["fields"][3]["value"].replace("\u200b", ""))
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								)
							)
					);

					const modal = await i
						.awaitModalSubmit({
							filter: (m) => m.user.id === i.user.id,
							time: 100000,
							dispose: true
						})
						.catch(() => null);

					if (!modal) {
						return;
					}

					await modal.deferUpdate();

					const betAmount = parseInt(
						modal.fields.getTextInputValue("bet-amount")
					);

					if (!isNaN(betAmount)) {
						Object.assign(data["fields"][1], {
							value: `${replyOptions["$"]}${betAmount.toLocaleString()}`
						});
					}

					const prizeAmount = parseInt(
						modal.fields.getTextInputValue("prize-amount")
					);

					if (!isNaN(prizeAmount)) {
						Object.assign(data["fields"][2], {
							value: `${replyOptions["$"]}${prizeAmount.toLocaleString()}`
						});
					}

					const timeLimit = resolveTimeLimit(
						modal.fields.getTextInputValue("time-limit")
					);

					if (timeLimit) {
						Object.assign(data["fields"][3], {
							value: `<t:${timeLimit}>`
						});
					}

					Object.assign(data["fields"][0], {
						value: `\`${modal.fields.getTextInputValue(
							"option-1"
						)}\` | \`${modal.fields.getTextInputValue("option-2")}\``
					});
					await modal.editReply({
						embeds: [data]
					});
					break;
				}
				case "finish": {
					if (!validateData(data)) {
						await i.reply({
							...resolveReply(
								client.messages[interaction.commandName]["incomplete_data"],
								replyOptions
							),
							ephemeral: true
						});
						return;
					}

					collector.stop();
					await i.deferReply();

					const options = data["fields"]
						.shift()
						["value"].replace(/`/g, "")
						.split(" | ");
					const cost = parseInt(
						data["fields"]
							.shift()
							["value"].slice(replyOptions["$"].length)
							.replace(/,/g, "")
					);
					const prize = parseInt(
						data["fields"]
							.shift()
							["value"].slice(replyOptions["$"].length)
							.replace(/,/g, "")
					);
					const timeLimit = parseInt(
						data["fields"].shift()["value"].slice(3, -1)
					);
					const table = await channel
						.send({
							embeds: [
								{
									...data,
									color: resolveColor("White")
								}
							],
							components: [
								new ActionRowBuilder<ButtonBuilder>().addComponents(
									new ButtonBuilder()
										.setCustomId("table-option-0")
										.setLabel(options[0])
										.setStyle(ButtonStyle.Success)
										.setDisabled(true),
									new ButtonBuilder()
										.setCustomId("table-option-1")
										.setLabel(options[1])
										.setStyle(ButtonStyle.Success)
										.setDisabled(true)
								)
							]
						})
						.then(
							async (m) =>
								await m.edit({
									embeds: [
										new EmbedBuilder(m.embeds[0].data).setFooter({
											text: `賭盤ID: ${m.id}`
										})
									]
								})
						);

					await tableDataDb.create({
						channelId: channel.id,
						messageId: table.id,
						endTime: timeLimit,
						cost,
						prize
					});
					Object.assign(replyOptions, {
						id: table.id
					});
					await i.editReply(
						resolveReply(
							client.messages[interaction.commandName]["created"],
							replyOptions
						)
					);
					break;
				}
				case "cancel": {
					collector.stop();
					await i.reply(
						resolveReply(
							client.messages[interaction.commandName]["canceled"],
							replyOptions
						)
					);
					break;
				}
			}
		})
		.on("end", () => {
			interaction.fetchReply().then(async (reply) => {
				await reply.edit({
					components: []
				});
			});
		});
}

export async function handleTableStart(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	const data = await tableDataDb.findOne({
		messageId: interaction.options.getString("id", true)
	});

	if (!data) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_exist"],
				replyOptions
			)
		);
		return;
	}
	if (data.started) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["alr_started"],
				replyOptions
			)
		);
		return;
	}

	const table = await (
		await interaction.guild.channels
			.fetch(data.channelId)
			.then((c) => c as import("discord.js").TextChannel)
			.catch(() => null)
	)?.messages
		.fetch(data.messageId)
		.catch(() => null);

	if (!table) {
		data.deleteOne();
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_exist"],
				replyOptions
			)
		);
		return;
	}

	await table.edit({
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder(
					table.components[0].components[0].data as Readonly<
						import("discord.js").APIButtonComponent
					>
				).setDisabled(false),
				new ButtonBuilder(
					table.components[0].components[1].data as Readonly<
						import("discord.js").APIButtonComponent
					>
				).setDisabled(false)
			)
		]
	});
	await data.updateOne({
		$set: {
			started: true
		}
	});
	await interaction.editReply(
		resolveReply(
			client.messages[interaction.commandName]["started"],
			replyOptions
		)
	);
}

export async function handleTableShow(
	client: import("discord.js").Client<true>,
	interaction: import("discord.js").ChatInputCommandInteraction<"cached">,
	replyOptions: { [x: string]: any }
) {
	const data = await tableDataDb.findOne({
		messageId: interaction.options.getString("id", true)
	});

	if (!data) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_exist"],
				replyOptions
			)
		);
		return;
	}
	if (!data.started) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_started"],
				replyOptions
			)
		);
		return;
	}
	if (data.endTime * 1000 > Date.now()) {
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_ended"],
				replyOptions
			)
		);
		return;
	}

	const table = await (
		await interaction.guild.channels
			.fetch(data.channelId)
			.then((c) => c as import("discord.js").TextChannel)
			.catch(() => null)
	)?.messages
		.fetch(data.messageId)
		.catch(() => null);

	if (!table) {
		data.deleteOne();
		await interaction.editReply(
			resolveReply(
				client.messages[interaction.commandName]["not_exist"],
				replyOptions
			)
		);
		return;
	}

	const answer = Math.floor(Math.random() * 2) as 0 | 1;
	const winners = Array.from(data.choices.entries())
		.filter((c) => c[1] === answer)
		.map(([id]) => id);

	for (const winner of winners) {
		getUserData(client, winner).then(async (d) => {
			await d.updateOne({
				$inc: {
					coins: data.prize
				}
			});
		});
	}

	Object.assign(replyOptions, {
		answer: answer + 1
	});
	await table.edit({
		embeds: [
			new EmbedBuilder(table.embeds[0].data)
				.setDescription(
					`${table.embeds[0].description!}\n\n🎉恭喜贏家：\n${winners
						.map((id) => `<@${id}>`)
						.join("\n")}`
				)
				.setColor("DarkButNotBlack")
		],
		components: []
	});
	await interaction.editReply(
		resolveReply(
			client.messages[interaction.commandName]["showed"],
			replyOptions
		)
	);
	data.deleteOne();
}
