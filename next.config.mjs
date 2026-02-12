import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	output: "export",
	// Handle static assets
	images: {
		unoptimized: true, // Required for static export
	},
};

const withMDX = createMDX();

export default withMDX(config);
