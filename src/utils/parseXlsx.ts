import xlsx from "node-xlsx";
import { join } from "path";

export default function (name: "ascgoogle" | "asclink" | "ascknow") {
	try {
		const file = xlsx.parse(
			join(__dirname, "..", "..", "data", `${name}.xlsx`)
		)[0]!;

		if (!file.data.toString()) {
			return;
		}

		return file.data.filter((arr) => arr.length) as string[][];
	} catch (err) {
		return;
	}
}
