export function requiredExp(level: number): number {
	if (level === 1) {
		return 10;
	}

	return Math.ceil(10 * Math.pow(1.5, level - 1) + requiredExp(level - 1));
}

export function calcExpAndLevels(
	current: { exp: number; level: number },
	added: number
) {
	const finalResult = {
		exp: current.exp,
		level: current.level
	};

	if (added >= requiredExp(finalResult.level + 1) - finalResult.exp) {
		while (added >= requiredExp(finalResult.level + 1) - finalResult.exp) {
			added -= requiredExp(finalResult.level + 1) - finalResult.exp;
			finalResult["level"]++;
			finalResult["exp"] = 0;
		}

		finalResult["exp"] = added;
	} else {
		finalResult["exp"] += added;
	}

	return finalResult;
}
