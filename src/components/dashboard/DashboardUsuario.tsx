import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ArrowRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface Props {
  user: User;
}

type RiskCategory = "low" | "moderate" | "high";

type TestResult = {
  id: string;
  teste: string;
  data: string;
  nivel_risco: string;
  riskCategory: RiskCategory;
  insight: string;
  resumo: string;
};

const chartConfig = {
  riscos: {
    label: "Intensidade do risco",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const mockTestResults: TestResult[] = [
  {
    id: "mchat",
    teste: "M-CHAT-R/F",
    data: "15/09/2024",
    nivel_risco: "Alto risco",
    riskCategory: "high",
    insight: "Os sinais observados justificam contato imediato com equipe especializada para avaliação aprofundada.",
    resumo:
      "Sinais consistentes de risco elevado para TEA em crianças de 16-30 meses. Recomendado encaminhamento para avaliação multiprofissional.",
  },
  {
    id: "ados",
    teste: "ADOS-2 (módulo 1)",
    data: "02/10/2024",
    nivel_risco: "Baixo risco",
    riskCategory: "low",
    insight: "Os comportamentos observados permaneceram dentro dos padrões esperados para a faixa etária avaliada.",
    resumo:
      "Triagem clínica indicou baixo risco, mas manter acompanhamento periódico garante identificação precoce de novas demandas.",
  },
  {
    id: "aq10",
    teste: "AQ-10",
    data: "21/10/2024",
    nivel_risco: "Risco moderado",
    riskCategory: "moderate",
    insight: "Alguns traços requerem observação contínua. É interessante planejar acompanhamento em saúde mental.",
    resumo:
      "Autoavaliação indicou sinais moderados. Recomenda-se discutir o resultado com especialista e observar impacto nas rotinas diárias.",
  },
];

const interpretacaoPorRisco: Record<RiskCategory, string> = {
  low: "Sinais atuais sugerem baixo risco. Mantenha o acompanhamento e repita a triagem se surgirem novas preocupações.",
  moderate:
    "Há indícios moderados. Procure orientação profissional para avaliar intervenções preventivas e planejar novos acompanhamentos.",
  high: "Os resultados apontam risco elevado. Busque encaminhamento clínico especializado para avaliação diagnóstica completa.",
};

const DashboardUsuario = ({ user }: Props) => {
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  const userName = user.user_metadata?.nome_completo || user.email?.split("@")[0] || "Usuário";

  const chartData = useMemo(
    () =>
      mockTestResults.map((result) => ({
        teste: result.teste,
        riscos:
          result.riskCategory === "high" ? 3 : result.riskCategory === "moderate" ? 2 : 1,
      })),
    [],
  );

  const resumoIbge = {
    faixaEtaria: "3-5 anos",
    regiao: "Sudeste",
    resultado: "Risco moderado",
    consentimento: "Dados anonimizados prontos para análise conjunta com o IBGE.",
  };

  const proximosPassos = [
    {
      titulo: "Agende uma consulta especializada",
      descricao: "Priorize avaliação com equipe multidisciplinar para interpretar os resultados clínicos em profundidade.",
      icon: CheckCircle,
    },
    {
      titulo: "Explore recursos de acolhimento",
      descricao: "Conheça materiais educativos e grupos de apoio para familiares de crianças no espectro.",
      icon: BookOpen,
    },
    {
      titulo: "Monitore novos sinais",
      descricao: "Registre mudanças comportamentais e traga-as para a próxima consulta ou triagem.",
      icon: Info,
    },
  ];

  const recursosEducativos = [
    {
      titulo: "Guia para famílias",
      descricao: "Orientações práticas sobre rotinas, comunicação e direitos da pessoa com TEA.",
      acao: "Ler material",
    },
    {
      titulo: "Agenda de oficinas",
      descricao: "Programação de encontros educativos oferecidos pela Plataa e parceiros regionais.",
      acao: "Ver agenda",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold text-primary mb-2">Olá, {userName}!</h1>
            <p className="text-muted-foreground max-w-2xl">
              Acompanhe seus resultados, compreenda as recomendações personalizadas e veja os próximos passos sugeridos pela equipe da
              Plataa.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Seus resultados interpretados</CardTitle>
              <CardDescription>Resumo das triagens concluídas com orientações claras para próximos passos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mockTestResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    className="rounded-lg border border-primary/20 bg-card px-4 py-5 text-left shadow-sm transition-smooth hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{result.data}</p>
                        <p className="text-xl font-semibold text-foreground">{result.teste}</p>
                        <p className="text-sm text-muted-foreground">{result.resumo}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`px-4 py-1 text-sm ${
                          result.riskCategory === "high"
                            ? "border-red-500 text-red-600"
                            : result.riskCategory === "moderate"
                            ? "border-yellow-500 text-yellow-600"
                            : "border-emerald-500 text-emerald-600"
                        }`}
                      >
                        {result.nivel_risco}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Uso ético dos seus dados</CardTitle>
              <CardDescription>Visão geral do pacote anonimizado enviado para análise estatística.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                <p><strong>Faixa etária:</strong> {resumoIbge.faixaEtaria}</p>
                <p><strong>Região:</strong> {resumoIbge.regiao}</p>
                <p><strong>Resultado agregado:</strong> {resumoIbge.resultado}</p>
              </div>
              <p>
                {resumoIbge.consentimento}
                Os dados pessoais identificáveis ficam restritos ao seu painel, garantindo privacidade e transparência.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/selecionar-teste")}>Atualizar dados de triagem</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary">Comparativo visual dos testes</CardTitle>
            <CardDescription>Veja rapidamente como cada instrumento classificou o nível de risco.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full overflow-x-auto">
              <BarChart data={chartData} height={260}>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis dataKey="teste" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  ticks={[1, 2, 3]}
                  tickFormatter={(value) => (value === 1 ? "Baixo" : value === 2 ? "Moderado" : "Alto")}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="riscos" radius={[6, 6, 0, 0]} fill="var(--color-riscos)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Próximos passos sugeridos</CardTitle>
              <CardDescription>Recomendações personalizadas para transformar o resultado em ação.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {proximosPassos.map((passo, index) => (
                <div key={index} className="rounded-lg border border-primary/10 bg-card p-4 shadow-sm">
                  <passo.icon className="h-6 w-6 text-primary mb-3" />
                  <p className="font-semibold text-foreground">{passo.titulo}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{passo.descricao}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Recursos e apoio</CardTitle>
              <CardDescription>Materiais complementares para aprofundar o cuidado diário.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recursosEducativos.map((recurso, index) => (
                <div key={index} className="rounded-md border border-primary/10 bg-primary/5 p-4 space-y-2">
                  <p className="font-semibold text-foreground">{recurso.titulo}</p>
                  <p className="text-sm text-muted-foreground">{recurso.descricao}</p>
                  <Button variant="link" className="px-0 text-primary">
                    {recurso.acao}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedResult?.teste}</DialogTitle>
            <DialogDescription>
              Resultado de {selectedResult?.data} – {selectedResult?.nivel_risco}
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="text-foreground font-medium">{selectedResult.insight}</p>
              <p>{selectedResult.resumo}</p>
              <Separator />
              <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
                {selectedResult.riskCategory === "high" ? (
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                )}
                <p>{interpretacaoPorRisco[selectedResult.riskCategory]}</p>
              </div>
              <Button onClick={() => setSelectedResult(null)} className="w-full">
                Entendi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { DashboardUsuario };
