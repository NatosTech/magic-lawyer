import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import Link from "next/link";

export default function SucessoPage() {
  return (
    <div className="h-screen bg-linear-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in -mt-48">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="text-center p-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <div className="w-10 h-10 text-primary text-2xl">✅</div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 animate-slide-up">
                Conta criada com sucesso! 🎉
              </h1>
              <p className="text-default-400 animate-slide-up-delay">
                Sua conta Magic Lawyer foi criada e está pronta para uso.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg animate-slide-in-left">
                <div className="w-5 h-5 text-success text-lg">📧</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-success">
                    Link de primeiro acesso enviado por email
                  </p>
                  <p className="text-xs text-default-400">
                    Verifique sua caixa de entrada e spam
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg animate-slide-in-left-delay">
                <div className="w-5 h-5 text-primary text-lg">🔗</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-primary">
                    Acesso ao seu ambiente
                  </p>
                  <p className="text-xs text-default-400">
                    Defina sua senha no link recebido e faça login
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                as={Link}
                className="w-full hover:scale-105 transition-transform"
                color="primary"
                href="/login"
                size="lg"
              >
                🔗 Fazer Login Agora
              </Button>

              <Button
                as={Link}
                className="w-full hover:scale-105 transition-transform"
                href="/precos"
                size="lg"
                variant="light"
              >
                ← Voltar aos Planos
              </Button>
            </div>

            <div className="mt-8 p-4 bg-default-100/10 rounded-lg animate-fade-in-delay">
              <h3 className="text-sm font-semibold text-white mb-2">
                Próximos passos:
              </h3>
              <ul className="text-xs text-default-400 space-y-1">
                <li>• Verifique seu email para o link de primeiro acesso</li>
                <li>• Faça login no seu ambiente</li>
                <li>• Configure seu escritório</li>
                <li>• Importe seus primeiros processos</li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
