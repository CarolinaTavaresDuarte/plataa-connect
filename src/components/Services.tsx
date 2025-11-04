import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const services = [
  {
    icon: Baby,
    title: "M-CHAT-R/F",
    description: "Triagem para crianças de 16 a 30 meses. Questionário respondido por pais ou responsáveis.",
    age: "16-30 meses",
    link: "/testes/mchat"
  },
  {
    icon: Users,
    title: "ASSQ",
    description: "Avaliação para crianças e adolescentes de 6 a 17 anos. Pode ser respondido por pais, professores ou o próprio adolescente.",
    age: "6-17 anos",
    link: "/testes/assq"
  },
  {
    icon: User,
    title: "AQ-10",
    description: "Questionário de triagem para adultos (16+ anos). Autoavaliação rápida com 10 perguntas.",
    age: "16+ anos",
    link: "/testes/aq10"
  }
];

export const Services = () => {
  const navigate = useNavigate();

  return (
    <section id="servicos" className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Triagem Especializada</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas validadas cientificamente para diferentes faixas etárias
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-sm text-primary font-semibold mb-3">{service.age}</p>
                <p className="text-muted-foreground mb-6">
                  {service.description}
                </p>
                <Button 
                  onClick={() => navigate(service.link)}
                  variant="outline"
                  className="mt-auto"
                >
                  Realizar Teste
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
