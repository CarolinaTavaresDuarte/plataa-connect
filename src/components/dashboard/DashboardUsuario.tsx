import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { FileText, BookOpen, BarChart3, ArrowRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
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
  score?: number;
};

const riskMap: Record<string, RiskCategory> = {
  baixo: "low",
  baixa: "low",
  negativa: "low",
  moderado: "moderate",
  moderada: "moderate",
  positivo: "high",
  positiva: "high",
  alto: "high",
  elevada: "high",
};

const chartConfig = {
  riscos: {
    label: "Intensidade do risco",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const interpretacaoPorRisco: Record<RiskCategory, string> = {
  low: "Os indícios atuais são baixos. Mantenha o acompanhamento e repita a triagem se surgirem novas preocupações.",
  moderate:
    "Há sinais moderados que justificam acompanhamento próximo e, se possível, consulta com especialista para avaliação complementar.",
  high:
    "Os resultados indicam alto risco. Procure encaminhamento clínico especializado para avaliação diagnóstica e orientações de intervenção.",
};

const DashboardUsuario = ({ user }: Props) => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [regiao, setRegiao] = useState<string | null>(null);
  const [consentLastTest, setConsentLastTest] = useState<boolean | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nome_completo, regiao_bairro")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.nome_completo);
        setRegiao(profileData.regiao_bairro);
      }

      const results: TestResult[] = [];

      const { data: mchatData } = await supabase
        .from("mchat_responses")
        .select("id, created_at, pontuacao_total, nivel_risco, consentimento_pesquisa")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mchatData && mchatData.length > 0) {
        const riskCategory = normalizarNivel(mchatData[0].nivel_risco);
        results.push({
          id: mchatData[0].id,
          teste: "M-CHAT-R/F",
          data: new Date(mchatData[0].created_at).toLocaleDateString("pt-BR"),
          nivel_risco: formatRiskLabel(mchatData[0].nivel_risco),
          riskCategory,
          insight: interpretacaoPorRisco[riskCategory],
          score: mchatData[0].pontuacao_total,
        });
        setConsentLastTest(mchatData[0].consentimento_pesquisa ?? null);
      }

      const { data: assqData } = await supabase
        .from("assq_responses")
        .select("id, created_at, pontuacao_total, nivel_risco, consentimento_pesquisa")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assqData && assqData.length > 0) {
        const riskCategory = normalizarNivel(assqData[0].nivel_risco);
        results.push({
          id: assqData[0].id,
          teste: "ASSQ",
          data: new Date(assqData[0].created_at).toLocaleDateString("pt-BR"),
          nivel_risco: formatRiskLabel(assqData[0].nivel_risco),
          riskCategory,
          insight: interpretacaoPorRisco[riskCategory],
          score: assqData[0].pontuacao_total,
        });
        setConsentLastTest((prev) => prev ?? assqData[0].consentimento_pesquisa ?? null);
      }

      const { data: aq10Data } = await supabase
        .from("aq10_responses")
        .select("id, created_at, pontuacao_total, triagem_positiva, consentimento_pesquisa")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (aq10Data && aq10Data.length > 0) {
        const riskCategory = normalizarNivel(aq10Data[0].triagem_positiva ? "alto" : "baixo");
        results.push({
          id: aq10Data[0].id,
          teste: "AQ-10",
          data: new Date(aq10Data[0].created_at).toLocaleDateString("pt-BR"),
          nivel_risco: aq10Data[0].triagem_positiva ? "Triagem Positiva" : "Triagem Negativa",
          riskCategory,
          insight: interpretacaoPorRisco[riskCategory],
          score: aq10Data[0].pontuacao_total,
        });
        setConsentLastTest((prev) => prev ?? aq10Data[0].consentimento_pesquisa ?? null);
      }

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

  const chartData = useMemo(
    () =>
      testResults.map((result) => ({
        teste: result.teste,
        riscos: riskValue(result.riskCategory),
      })),
    [testResults],
  );

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

      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Olá, {userName || user.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seus resultados, entenda as recomendações e siga com tranquilidade os próximos passos.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Seus Resultados</CardTitle>
              <CardDescription>Resumo interpretativo das triagens concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Você ainda não realizou nenhum teste. Inicie sua triagem para receber orientações personalizadas.
                  </p>
                  <Button onClick={() => navigate("/selecionar-teste")}>Iniciar primeiro teste</Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {testResults.map((result) => (
                    <Card key={result.id} className="border border-primary/10 hover:border-primary/30 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{result.teste}</CardTitle>
                            <CardDescription>Realizado em {result.data}</CardDescription>
                          </div>
                          {riskIcon(result.riskCategory)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Resultado interpretado</span>
                          <Badge variant="outline" className={riskTextColor(result.riskCategory)}>
                            {result.nivel_risco}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
                        <Button variant="outline" className="w-full" onClick={() => setSelectedResult(result)}>
                          Ver detalhes
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Dados anonimizados (IBGE)</CardTitle>
                <CardDescription>Transparência sobre o uso das suas informações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Região informada:</strong> {regiao || "Não informado"}
                </p>
                <p>
                  <strong>Consentimento de pesquisa:</strong> {consentLastTest ? "Permitido" : "Não autorizado"}
                </p>
                <p>
                  Apenas faixa etária aproximada e região são compartilhadas de forma anônima para análises estatísticas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Próximos passos</CardTitle>
                <CardDescription>Recomendações adaptadas ao seu cenário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Registre observações relevantes do comportamento no seu perfil.</li>
                  <li>Agende uma consulta com especialista caso tenha resultado moderado ou alto.</li>
                  <li>Explore os recursos educativos para apoiar o desenvolvimento diário.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Evolução visual dos riscos</CardTitle>
              <CardDescription>
                Representação gráfica da intensidade do risco em cada triagem realizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Realize ao menos um teste para visualizar o gráfico.</p>
              ) : (
                <ChartContainer className="min-h-[280px]" config={chartConfig}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="teste" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 3]} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="riscos" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickAction
                icon={FileText}
                title="Realizar nova triagem"
                description="Inicie outro questionário adequado à faixa etária."
                onClick={() => navigate("/selecionar-teste")}
              />
              <Separator />
              <QuickAction
                icon={BookOpen}
                title="Conteúdos educativos"
                description="Materiais sobre TEA e desenvolvimento infantil."
                onClick={() => navigate("/landing#sobre")}
              />
              <Separator />
              <QuickAction
                icon={BarChart3}
                title="Atualizar meus dados"
                description="Revise informações pessoais e histórico de triagens."
                onClick={() => navigate("/dados-pre-teste")}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent>
          {selectedResult && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedResult.teste}</DialogTitle>
                <DialogDescription>
                  Resultado de {selectedResult.data} — foco nas orientações clínicas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong>Classificação:</strong> {selectedResult.nivel_risco}
                </p>
                <p>{selectedResult.insight}</p>
                <p>
                  Para compreender melhor o significado deste resultado, procure um profissional especializado. As respostas
                  individuais permanecem confidenciais.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { DashboardUsuario };

function normalizarNivel(nivel: string): RiskCategory {
  const cleaned = nivel.toLowerCase();
  return riskMap[cleaned] ?? (cleaned.includes("alto") ? "high" : cleaned.includes("moder") ? "moderate" : "low");
}

function riskIcon(category: RiskCategory) {
  switch (category) {
    case "low":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "moderate":
      return <Info className="h-6 w-6 text-yellow-500" />;
    default:
      return <AlertCircle className="h-6 w-6 text-red-500" />;
  }
}

function riskTextColor(category: RiskCategory) {
  switch (category) {
    case "low":
      return "border-green-200 text-green-600";
    case "moderate":
      return "border-yellow-200 text-yellow-600";
    default:
      return "border-red-200 text-red-600";
  }
}

function riskValue(category: RiskCategory) {
  switch (category) {
    case "low":
      return 1;
    case "moderate":
      return 2;
    default:
      return 3;
  }
}

function formatRiskLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("baixo")) return "Baixo risco";
  if (normalized.includes("moder")) return "Risco moderado";
  if (normalized.includes("neg")) return "Triagem Negativa";
  if (normalized.includes("pos")) return "Triagem Positiva";
  return "Alto risco";
}

type QuickActionProps = {
  icon: typeof FileText;
  title: string;
  description: string;
  onClick: () => void;
};

const QuickAction = ({ icon: Icon, title, description, onClick }: QuickActionProps) => (
  <div className="space-y-2">
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Button variant="ghost" className="px-0 text-primary hover:text-primary/80" onClick={onClick}>
      Acessar
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </div>
);
