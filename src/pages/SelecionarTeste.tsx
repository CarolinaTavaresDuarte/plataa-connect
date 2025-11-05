import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const testes = [
  {
    icon: Baby,
    title: "M-CHAT-R/F",
    description: "Triagem para crianças de 16 a 30 meses. Questionário respondido por pais ou responsáveis para identificação precoce de sinais de TEA.",
    age: "16-30 meses",
    perguntas: "20 perguntas",
    tempo: "5-10 minutos",
    link: "/testes/mchat"
  },
  {
    icon: Users,
    title: "ASSQ",
    description: "Avaliação para crianças e adolescentes de 6 a 17 anos. Pode ser respondido por pais, professores ou o próprio adolescente.",
    age: "6-17 anos",
    perguntas: "27 perguntas",
    tempo: "10-15 minutos",
    link: "/testes/assq"
  },
  {
    icon: User,
    title: "AQ-10",
    description: "Questionário de triagem rápida para adultos. Autoavaliação com perguntas sobre características relacionadas ao espectro autista.",
    age: "16+ anos",
    perguntas: "10 perguntas",
    tempo: "3-5 minutos",
    link: "/testes/aq10"
  }
];

const SelecionarTeste = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Selecione o Teste de Triagem</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o teste adequado para a faixa etária da pessoa que será avaliada.
            Cada teste é validado cientificamente e segue protocolos internacionais.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {testes.map((teste, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-2 bg-card cursor-pointer border-2 hover:border-primary/20"
            >
              <div className="flex flex-col h-full">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4 shadow-md">
                    <teste.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{teste.title}</h3>
                  <p className="text-sm text-primary font-semibold mb-2">{teste.age}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                    <span>⏱️ {teste.tempo}</span>
                    <span>📝 {teste.perguntas}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">
                  {teste.description}
                </p>
                
                <Button 
                  onClick={() => navigate("/dados-pre-teste", { state: { testeDestino: teste.link } })}
                  className="w-full"
                  size="lg"
                >
                  Iniciar Teste
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-blue-50 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">Informações Importantes</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Estes testes são ferramentas de <strong>triagem</strong>, não de diagnóstico definitivo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                Cada CPF pode realizar a triagem apenas <strong>uma vez por tipo de teste</strong>. Para outro instrumento, um novo
                registro é permitido.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Os resultados servem como <strong>orientação</strong> para buscar avaliação profissional especializada.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Responda com <strong>honestidade</strong> e baseando-se em comportamentos observados nos últimos 6 meses.</span>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default SelecionarTeste;
