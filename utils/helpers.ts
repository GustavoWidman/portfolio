import type { Language } from "../types";

export const createDate = (dateString: string) => {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(year, month - 1, day);
};

export const formatDate = (dateString: string, lang: Language) => {
	const date = createDate(dateString);
	const locale = lang === "pt" ? "pt-BR" : "en-US";
	return date
		.toLocaleDateString(locale, { month: "short", year: "numeric" })
		.replace(" de ", " ") // fix "Abr de 2025" in pt-BR locale
		.replace(".", "");
};

export const getDuration = (
	startDate: string,
	endDate: string | undefined,
	lang: Language,
) => {
	const start = createDate(startDate);
	const end = endDate ? createDate(endDate) : new Date();

	const diffTime = Math.max(0, end.getTime() - start.getTime());

	const MS_PER_MONTH = 2629800000;

	const rawMonths = diffTime / MS_PER_MONTH;
	const totalMonths = Math.round(rawMonths);

	const years = Math.floor(totalMonths / 12);
	const months = totalMonths % 12;

	let durationString = "";

	if (lang === "en") {
		if (years > 0) durationString += `${years} yr${years > 1 ? "s" : ""} `;
		if (months > 0) durationString += `${months} mos`;
	} else {
		if (years > 0) durationString += `${years} ano${years > 1 ? "s" : ""} `;
		if (months > 0)
			durationString += `${months} m${months !== 1 ? "eses" : "ês"}`;
	}

	return durationString.trim() || (lang === "en" ? "1 mo" : "1 mês");
};
