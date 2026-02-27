import { PrimeiroAcessoContent } from "./primeiro-acesso-content";

interface PrimeiroAcessoPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PrimeiroAcessoPage({
  params,
}: PrimeiroAcessoPageProps) {
  const { token } = await params;

  return <PrimeiroAcessoContent token={token} />;
}
