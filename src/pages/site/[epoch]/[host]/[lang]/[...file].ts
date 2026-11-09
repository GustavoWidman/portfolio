import type { APIRoute } from "astro";

import { machineRoutes, renderMachineFile } from "../../../../../lib/machine/files";
import type { MachineRoute } from "../../../../../lib/machine/files";

export const getStaticPaths = machineRoutes;

export const GET: APIRoute<MachineRoute["props"]> = async ({ props }) => {
  const { body, contentType } = await renderMachineFile(props);
  return new Response(body, { headers: { "Content-Type": contentType } });
};
