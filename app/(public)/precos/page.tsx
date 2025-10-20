import { PrecosContent } from "./precos-content";

import { obterPlanos } from "@/app/actions/asaas";

export default async function Precos() {
  const planosResponse = await obterPlanos();
  const planos = planosResponse.success ? planosResponse.data : [];

  return <PrecosContent planos={planos} />;
}
