import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	PermissionFlagsBits,
	/*PermissionFlagsBits,*/
	SlashCommandBuilder,
	SlashCommandChannelOption,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { Command } from "../types";
import awaitModal from "../utils/awaitModal";
import awaitSelectMenu from "../utils/awaitSelectMenu";
import validateURL from "../utils/validateURL";

type EmbedData = {
	title: string | null;
	description: string | null;
	color: number;
	fields: { name: string; value: string }[];
	image: string | null;
};

export default {
	data: new SlashCommandBuilder()
		.setName("ascpost")
		.setDescription("發布公告")
		.addChannelOption(
			new SlashCommandChannelOption()
				.setName("channel")
				.setDescription("頻道")
				.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText)
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	execute: async (_client, interaction) => {
		await interaction.deferReply();

		const data: EmbedData = {
			title: "公告標題",
			description: "公告內容",
			color: 0,
			fields: [],
			image: null
		};

		const editBtn = new ButtonBuilder()
			.setCustomId("post_edit")
			.setLabel("編輯內文")
			.setStyle(ButtonStyle.Primary);
		const addFieldBtn = new ButtonBuilder()
			.setCustomId("post_field_add")
			.setLabel("新增欄位")
			.setStyle(ButtonStyle.Primary);
		const remFieldBtn = new ButtonBuilder()
			.setCustomId("post_field_remove")
			.setLabel("移除欄位")
			.setStyle(ButtonStyle.Primary);
		const imageBtn = new ButtonBuilder()
			.setCustomId("post_image")
			.setLabel("編輯圖片")
			.setStyle(ButtonStyle.Primary);
		const postCtrlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("post_send")
				.setLabel("發送")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId("post_discard")
				.setLabel("捨棄")
				.setStyle(ButtonStyle.Danger)
		);

		const message = await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle(data.title)
					.setDescription(data.description)
					.setColor(data.color)
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					editBtn,
					addFieldBtn,
					remFieldBtn.setDisabled(true),
					imageBtn
				),
				postCtrlRow
			]
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === interaction.user.id,
			idle: 300000,
			dispose: true
		});

		let modal: ModalBuilder;
		let modalRes: ModalSubmitInteraction | null;
		let menuOptions: StringSelectMenuOptionBuilder[];
		let menuRes: StringSelectMenuInteraction | null;

		collector.on("collect", async (i) => {
			switch (i.customId) {
				case "post_edit":
					modal = new ModalBuilder()
						.setCustomId("post_edit_modal")
						.setTitle("編輯內文")
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("title")
									.setLabel("標題")
									.setPlaceholder("輸入標題")
									.setMaxLength(200)
									.setValue(data.title ?? "")
									.setStyle(TextInputStyle.Short)
									.setRequired(false)
							),
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("description")
									.setLabel("內容")
									.setPlaceholder("輸入內容")
									.setMaxLength(4000)
									.setValue(data.description ?? "")
									.setStyle(TextInputStyle.Paragraph)
									.setRequired(false)
							),
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("color")
									.setLabel("顏色")
									.setPlaceholder("輸入色碼")
									.setMaxLength(6)
									.setValue(data.color.toString(16))
									.setStyle(TextInputStyle.Short)
									.setRequired(false)
							)
						);
					await i.showModal(modal);

					modalRes = await awaitModal(i, interaction.user, "post_edit_modal");

					if (!modalRes) {
						break;
					}

					await modalRes.deferUpdate();
					data.title = modalRes.fields.getTextInputValue("title");
					data.description = modalRes.fields.getTextInputValue("description");
					data.color = parseInt(
						"0x" + modalRes.fields.getTextInputValue("color")
					);

					if (!data.title) {
						data.title = null;
					}
					if (!data.description) {
						data.description = null;
					}
					if (isNaN(data.color)) {
						data.color = 0;
					}
					break;
				case "post_field_add":
					modal = new ModalBuilder()
						.setCustomId("post_field_add_modal")
						.setTitle("新增欄位")
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("name")
									.setLabel("欄位名稱")
									.setPlaceholder("輸入欄位名稱")
									.setMaxLength(200)
									.setStyle(TextInputStyle.Short)
									.setRequired(true)
							),
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("value")
									.setLabel("欄位內容")
									.setPlaceholder("輸入欄位內容")
									.setMaxLength(1000)
									.setStyle(TextInputStyle.Paragraph)
									.setRequired(true)
							)
						);
					await i.showModal(modal);

					modalRes = await awaitModal(
						i,
						interaction.user,
						"post_field_add_modal"
					);

					if (!modalRes) {
						break;
					}

					await modalRes.deferUpdate();
					data.fields.push({
						name: modalRes.fields.getTextInputValue("name"),
						value: modalRes.fields.getTextInputValue("value")
					});
					break;
				case "post_field_remove":
					menuOptions = data.fields.map((_field, index) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(`${++index}`)
							.setValue(`${index}`)
					);
					menuRes = await i
						.reply({
							content: "選擇要移除的欄位序號",
							components: [
								new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
									new StringSelectMenuBuilder()
										.setCustomId("post_field_remove_menu")
										.setMaxValues(1)
										.setOptions(menuOptions)
								)
							],
							fetchReply: true
						})
						.then((m) =>
							awaitSelectMenu(m, ComponentType.StringSelect, interaction.user)
						);

					await i.deleteReply();

					if (!menuRes) {
						break;
					}

					data.fields.splice(parseInt(menuRes.values[0]!) - 1, 1);
					break;
				case "post_image":
					modal = new ModalBuilder()
						.setCustomId("post_image_modal")
						.setTitle("新增欄位")
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>().addComponents(
								new TextInputBuilder()
									.setCustomId("image")
									.setLabel("編輯圖片")
									.setPlaceholder("輸入圖片連結")
									.setValue(data.image ?? "")
									.setStyle(TextInputStyle.Short)
									.setRequired(false)
							)
						);
					await i.showModal(modal);

					modalRes = await awaitModal(i, interaction.user, "post_image_modal");

					if (!modalRes) {
						break;
					}

					await modalRes.deferUpdate();
					data.image = modalRes.fields.getTextInputValue("image");

					if (!data.image || !validateURL(data.image)) {
						data.image = null;
					}
					break;
				case "post_send":
				case "post_discard":
					collector.stop(i.customId.replace("post_", ""));
					break;
			}

			if (modalRes || menuRes) {
				await (modalRes ?? interaction).editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle(data.title)
							.setDescription(data.description)
							.setFields(data.fields)
							.setImage(data.image)
							.setColor(data.color)
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							editBtn,
							addFieldBtn.setDisabled(data.fields.length === 20),
							remFieldBtn.setDisabled(!data.fields.length),
							imageBtn
						),
						postCtrlRow
					]
				});
				modalRes = null;
				menuRes = null;
			}
		});
		collector.on("end", async (_collected, reason) => {
			if (reason === "idle" || reason === "discard") {
				await interaction.deleteReply();
				return;
			}

			const channel = interaction.options.getChannel("channel", true, [
				ChannelType.GuildAnnouncement,
				ChannelType.GuildText
			]);

			await channel.send({
				embeds: [
					new EmbedBuilder()
						.setTitle(data.title)
						.setDescription(data.description)
						.addFields(data.fields)
						.setImage(data.image)
						.setColor(data.color)
				]
			});
			await interaction.editReply({
				content: "## 已發送",
				components: []
			});
		});
	}
} as Command;
