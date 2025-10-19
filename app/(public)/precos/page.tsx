import { obterPlanos } from "@/app/actions/asaas";
import { PrecosContent } from "./precos-content";

export default async function Precos() {
  const planosResponse = await obterPlanos();
  const planos = planosResponse.success ? planosResponse.data : [];

  return <PrecosContent planos={planos} />;
}
