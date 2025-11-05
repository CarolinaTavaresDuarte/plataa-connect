import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";

const services = {
  "mchat-rf": {
    title: "M-CHAT-R/F",
    summary:
      "Triagem validada internacionalmente para crianças de 16 a 30 meses. Ideal para pais ou responsáveis identificarem precocemente sinais de TEA.",
    audience: "Pais ou responsáveis por crianças pequenas",
    duration: "5-10 minutos",
    questions: "20 questões objetivas",
    route: "/testes/mchat",
    highlights: [
      "Validado pela American Academy of Pediatrics",
      "Aplicação rápida com linguagem acessível",
      "Indicações claras sobre encaminhamentos clínicos",
    ],
  },
  assq: {
    title: "ASSQ",
    summary:
      "Questionário de triagem para crianças e adolescentes de 6 a 17 anos, permitindo visão 360° com respostas de familiares, professores ou do próprio jovem.",
    audience: "Famílias, educadores e adolescentes",
    duration: "10-15 minutos",
    questions: "27 afirmações graduadas",
    route: "/testes/assq",
    highlights: [
      "Cobertura detalhada de indicadores sociais e comportamentais",
      "Permite respostas em escala para maior precisão",
      "Excelente para monitoramento escolar",
    ],
  },
  aq10: {
    title: "AQ-10",
    summary:
      "Autoavaliação breve para adolescentes e adultos (16+), ideal como ponto de partida para discussão clínica sobre traços do espectro autista.",
    audience: "Adolescentes, adultos e profissionais de saúde",
    duration: "3-5 minutos",
    questions: "10 afirmações com escala Likert",
    route: "/testes/aq10",
    highlights: [
      "Indicador rápido de necessidade de avaliação especializada",
      "Baseado no Autism-Spectrum Quotient de Baron-Cohen",
      "Gera recomendações imediatas no dashboard",
    ],
  },
} as const;

type ServiceKey = keyof typeof services;

const ServiceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const service = useMemo(() => {
    const key = slug as ServiceKey | undefined;
    return key && services[key] ? services[key] : null;
  }, [slug]);

  if (!service) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <CardTitle className="text-2xl mb-4 text-primary">Serviço não encontrado</CardTitle>
            <CardDescription className="mb-6">
              Não foi possível localizar as informações deste teste. Volte para a lista de serviços e tente novamente.
            </CardDescription>
            <Button onClick={() => navigate("/landing#servicos")} className="mx-auto w-full md:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ver serviços
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <Button
            variant="ghost"
            className="px-0 text-primary hover:text-primary/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Card className="bg-white shadow-elegant">
            <CardHeader>
              <Badge variant="secondary" className="self-start bg-primary/10 text-primary">
                Triagem especializada
              </Badge>
              <CardTitle className="text-4xl text-primary mt-4">{service.title}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {service.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Público:</strong> {service.audience}
                </p>
                <p>
                  <strong>Duração média:</strong> {service.duration}
                </p>
                <p>
                  <strong>Formato:</strong> {service.questions}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-primary">Destaques do protocolo</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {service.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Pronto para começar?</CardTitle>
              <CardDescription>
                Para proteger os dados sensíveis, coletamos informações de identificação antes de liberar o questionário.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-muted-foreground">
                Ao iniciar a triagem você será direcionado para preencher os dados de pré-teste. Após essa etapa, o questionário
                será liberado automaticamente.
              </p>
              <Button
                size="lg"
                className="self-start"
                onClick={() => navigate("/dados-pre-teste", { state: { testeDestino: service.route } })}
              >
                Iniciar triagem
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetail;
