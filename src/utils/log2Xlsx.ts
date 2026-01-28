/* eslint-disable no-case-declarations */
import xlsx, { WorkSheet } from "node-xlsx";
import { writeFileSync } from "fs";
import { join } from "path";
import getTime from "./getTime";
import { LoggerMessageData } from "../types";

// [profileName, timestamp, time_string, author, orig_message_id, log_message_id, content, attachments, channel_id]

export default function (
	data: LoggerMessageData,
	action: "create" | "edit" | "delete"
) {
	const existingData = xlsx.parse(
		join(__dirname, "..", "..", "data", "messageLog.xlsx")
	);

	const time = getTime(data.timestamp);
	const timeStr = `${time.year}/${time.month}/${time.date}_${time.hour}:${time.minute}:${time.second}`;

	const sheetData = { options: {} } as WorkSheet;
	let dataIndex: number;
	let origLogMsgId: string | undefined;

	switch (action) {
		case "create":
			Object.assign(sheetData, {
				...existingData[0],
				data: [
					...existingData[0]!.data,
					[
						data.profileName,
						data.timestamp,
						timeStr,
						`@${data.author!.username}:${data.author!.id}`,
						data.origMsgId,
						data.logMsgId,
						data.content ?? "",
						data.attachments?.join(", ") ?? "",
						data.channelId
					]
				]
			});
			break;
		case "edit":
			dataIndex = existingData[0]!.data.findIndex(
				(d) => d[0] === data.profileName && d[4] === data.origMsgId
			);
			origLogMsgId = existingData[0]!.data[dataIndex]![5];

			existingData[0]!.data[dataIndex]![5] = data.logMsgId;
			existingData[0]!.data[dataIndex]![6] = data.content;
			existingData[0]!.data[dataIndex]![7] = data.attachments?.join(", ") ?? "";

			Object.assign(sheetData, existingData[0]!);
			break;
		case "delete":
			dataIndex = existingData[0]!.data.findIndex(
				(d) => d[0] === data.profileName && d[4] === data.origMsgId
			);
			origLogMsgId = existingData[0]!.data[dataIndex]![5];

			existingData[0]!.data.splice(dataIndex, 1);

			Object.assign(sheetData, existingData[0]!);
			break;
	}

	const buffer = xlsx.build([sheetData]);

	writeFileSync(join(__dirname, "..", "..", "data", "messageLog.xlsx"), buffer);

	return origLogMsgId;
}
