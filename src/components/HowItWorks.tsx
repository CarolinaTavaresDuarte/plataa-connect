import { Card } from "@/components/ui/card";
import { ClipboardList, BarChart3, UserCheck, FileText } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Etapa 1: Cadastro",
    description: "Crie sua conta como usuário ou especialista para acessar a plataforma."
  },
  {
    icon: FileText,
    title: "Etapa 2: Triagem",
    description: "Responda ao questionário adequado para sua faixa etária (M-CHAT-R/F, ASSQ ou AQ-10)."
  },
  {
    icon: BarChart3,
    title: "Etapa 3: Resultados",
    description: "Receba imediatamente a pontuação e interpretação do teste realizado."
  },
  {
    icon: UserCheck,
    title: "Etapa 4: Encaminhamento",
    description: "Caso indicado, busque avaliação profissional especializada para diagnóstico completo."
  }
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Triagem e Atendimento</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Processo simples e eficiente em 4 etapas
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-elegant transition-smooth hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
