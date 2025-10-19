import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { CheckCircle, Mail, ExternalLink, ArrowLeft } from "lucide-react";
import NextLink from "next/link";
import { motion } from "framer-motion";

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <Card className="border border-white/10 bg-background/70 backdrop-blur-xl">
          <CardBody className="text-center p-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Conta criada com sucesso! 🎉</h1>
              <p className="text-default-400">Sua conta Magic Lawyer foi criada e está pronta para uso.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                <Mail className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="text-sm font-medium text-success">Credenciais enviadas por email</p>
                  <p className="text-xs text-default-400">Verifique sua caixa de entrada e spam</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <ExternalLink className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-primary">Acesso ao seu ambiente</p>
                  <p className="text-xs text-default-400">Use as credenciais para fazer login</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="space-y-3">
              <Button as={NextLink} href="/login" color="primary" size="lg" className="w-full" startContent={<ExternalLink className="w-4 h-4" />}>
                Fazer Login Agora
              </Button>

              <Button as={NextLink} href="/precos" variant="light" size="lg" className="w-full" startContent={<ArrowLeft className="w-4 h-4" />}>
                Voltar aos Planos
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }} className="mt-8 p-4 bg-default-100/10 rounded-lg">
              <h3 className="text-sm font-semibold text-white mb-2">Próximos passos:</h3>
              <ul className="text-xs text-default-400 space-y-1">
                <li>• Verifique seu email para as credenciais</li>
                <li>• Faça login no seu ambiente</li>
                <li>• Configure seu escritório</li>
                <li>• Importe seus primeiros processos</li>
              </ul>
            </motion.div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
