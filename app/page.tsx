import { Suspense } from "react";
import { HomeClient } from "@/components/portfolio";

export default function HomePage() {
	return (
		<Suspense>
			<HomeClient />
		</Suspense>
	);
}
