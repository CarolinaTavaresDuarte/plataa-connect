import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ScreeningNavigationState, ScreeningSubject } from "@/types/screening";

const STORAGE_KEY = "screening:mchat";

const perguntas = [
  { id: 1, texto: "Se você aponta algo, a criança olha?", risco: "nao" },
  { id: 2, texto: "Você já suspeitou que a criança fosse surda?", risco: "sim" },
  { id: 3, texto: "A criança brinca de faz-de-conta (alimentar boneca, falar no telefone)?", risco: "nao" },
  { id: 4, texto: "A criança gosta de subir em móveis, brinquedos ou escadas?", risco: "nao" },
  { id: 5, texto: "A criança faz movimentos estranhos com os dedos perto dos olhos?", risco: "sim" },
  { id: 6, texto: "A criança aponta com um dedo para pedir algo ou pedir ajuda?", risco: "nao" },
  { id: 7, texto: "A criança aponta para mostrar algo interessante?", risco: "nao" },
  { id: 8, texto: "A criança demonstra interesse por outras crianças?", risco: "nao" },
  { id: 9, texto: "A criança traz ou mostra coisas para compartilhar?", risco: "nao" },
  { id: 10, texto: "A criança reage quando você chama pelo nome?", risco: "nao" },
  { id: 11, texto: "Quando você sorri, a criança sorri de volta?", risco: "nao" },
  { id: 12, texto: "A criança se assusta ou chora com barulhos do dia a dia?", risco: "sim" },
  { id: 13, texto: "A criança já anda sozinha?", risco: "nao" },
  { id: 14, texto: "A criança olha nos seus olhos quando você fala ou brinca?", risco: "nao" },
  { id: 15, texto: "A criança tenta copiar gestos, sons ou ações?", risco: "nao" },
  { id: 16, texto: "Se você vira a cabeça, a criança olha para onde você olhou?", risco: "nao" },
  { id: 17, texto: "A criança tenta fazer você olhar o que está fazendo?", risco: "nao" },
  { id: 18, texto: "A criança entende ordens simples sem gestos?", risco: "nao" },
  { id: 19, texto: "Em situações novas, a criança olha para o seu rosto?", risco: "nao" },
  { id: 20, texto: "A criança gosta de ser balançada ou jogada no colo?", risco: "nao" },
];

type Resultado = {
  nivel: "baixo" | "moderado" | "alto";
};

const loadSubjectFromStorage = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ScreeningSubject & { screening_subject_id?: string };
  } catch (error) {
    console.warn("Erro ao recuperar dados de sessão do M-CHAT", error);
    return null;
  }
};

const faixaEtariaPorMeses = (meses: number) => {
  if (meses <= 18) return "16-18 meses";
  if (meses <= 24) return "19-24 meses";
  if (meses <= 30) return "25-30 meses";
  if (meses <= 36) return "31-36 meses";
  if (meses <= 48) return "37-48 meses";
  return "48+ meses";
};

const TesteMChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState<(ScreeningSubject & { screening_subject_id?: string }) | null>(null);
  const [idadeMeses, setIdadeMeses] = useState("");
  const [quemResponde, setQuemResponde] = useState<"pais" | "responsaveis">("pais");
  const [consentimentoPesquisa, setConsentimentoPesquisa] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const initialise = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const navState = location.state as ScreeningNavigationState | undefined;
      if (navState?.subject) {
        setSubject(navState.subject);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(navState.subject));
      } else {
        const storedSubject = loadSubjectFromStorage();
        if (storedSubject) {
          setSubject(storedSubject);
        }
      }

      setLoading(false);
    };

    initialise();
  }, [navigate, location.state]);

  useEffect(() => {
    if (!loading && !subject) {
      toast.error("Informe os dados do indivíduo antes de iniciar o M-CHAT-R/F.");
      navigate("/dados-pre-teste", { state: { testeDestino: "/testes/mchat" } });
    }
  }, [loading, subject, navigate]);

  useEffect(() => {
    if (subject) {
      setConsentimentoPesquisa(subject.consentimento_pesquisa);
    }
  }, [subject]);

  const handleRespostaChange = (id: number, valor: boolean) => {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
  };

  const calcularPontuacao = () => {
    let pontos = 0;
    perguntas.forEach((p) => {
      const resposta = respostas[p.id];
      if (p.risco === "sim" && resposta === true) pontos++;
      if (p.risco === "nao" && resposta === false) pontos++;
    });
    return pontos;
  };

  const determinarNivelRisco = (pontuacao: number): Resultado["nivel"] => {
    if (pontuacao <= 2) return "baixo";
    if (pontuacao <= 7) return "moderado";
    return "alto";
  };

  const handleNext = () => {
    if (currentIndex < perguntas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const progresso = useMemo(() => ((currentIndex + 1) / perguntas.length) * 100, [currentIndex]);

  const handleSubmit = async () => {
    if (!userId || !subject) {
      toast.error("Erro de autenticação");
      return;
    }

    if (!idadeMeses) {
      toast.error("Informe a idade em meses da criança avaliada.");
      return;
    }

    if (Object.keys(respostas).length < perguntas.length) {
      toast.error("Responda todas as questões para concluir");
      return;
    }

    const pontuacao = calcularPontuacao();
    const nivel = determinarNivelRisco(pontuacao);

    setSubmitting(true);

    try {
      const { error } = await supabase.from("mchat_responses").insert({
        user_id: userId,
        screening_subject_id: subject.screening_subject_id ?? null,
        documento_cpf: subject.documento_cpf,
        idade_meses: parseInt(idadeMeses, 10),
        quem_responde: quemResponde,
        respostas,
        pontuacao_total: pontuacao,
        nivel_risco: nivel,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (error) throw error;

      const { error: ibgeError } = await supabase.from("ibge_analysis_records").insert({
        owner_user_id: userId,
        test_type: "mchat-rf",
        faixa_etaria: faixaEtariaPorMeses(parseInt(idadeMeses, 10)),
        regiao_geografica: subject.regiao_bairro,
        score_bruto: pontuacao,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (ibgeError) {
        console.warn("Falha ao registrar dado anonimizado", ibgeError);
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setResultado({ nivel });
      toast.success("Teste concluído com sucesso!");
    } catch (error: any) {
      if (error?.message?.includes("duplicate key value")) {
        toast.error("Este CPF já possui uma resposta registrada para o M-CHAT-R/F.");
      } else {
        toast.error("Erro ao salvar teste: " + (error.message ?? "tente novamente"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (!subject && !resultado)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-muted">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Card className="max-w-2xl mx-auto p-8">
            <CardHeader>
              <CardTitle className="text-3xl text-primary text-center">Resultado M-CHAT-R/F</CardTitle>
              <CardDescription className="text-center">
                Interpretação resumida da triagem. Utilize as orientações abaixo como guia inicial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Classificação atual</p>
                <p
                  className={`text-2xl font-bold ${
                    resultado.nivel === "alto"
                      ? "text-red-600"
                      : resultado.nivel === "moderado"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {resultado.nivel === "alto"
                    ? "Alto risco"
                    : resultado.nivel === "moderado"
                    ? "Risco moderado"
                    : "Baixo risco"}
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg space-y-3 text-sm text-muted-foreground">
                {resultado.nivel === "baixo" && (
                  <p>
                    Os indícios são compatíveis com baixo risco para TEA nesta faixa etária. Continue acompanhando o
                    desenvolvimento e repita a triagem caso novas preocupações surjam.
                  </p>
                )}
                {resultado.nivel === "moderado" && (
                  <p>
                    Há sinais moderados. Recomendamos aplicar a entrevista de follow-up do M-CHAT-R/F ou buscar orientação com
                    especialista para avaliação complementar.
                  </p>
                )}
                {resultado.nivel === "alto" && (
                  <p>
                    Os resultados apontam para alto risco. Busque encaminhamento clínico especializado para avaliação diagnóstica
                    e definição de intervenções precoces.
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border-l-4 border-primary p-4 text-sm text-muted-foreground">
                Este instrumento é apenas uma triagem. Somente uma equipe multiprofissional pode confirmar o diagnóstico e indicar o plano
                de intervenção mais adequado.
              </div>
              <div className="flex gap-4 flex-col md:flex-row">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  Voltar ao dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dados-pre-teste", { state: { testeDestino: "/testes/mchat" } })}
                  className="flex-1"
                >
                  Iniciar nova triagem
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto shadow-elegant">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl text-primary text-center">M-CHAT-R/F</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Responda pensando nas observações mais recentes sobre a criança. Um ambiente calmo ajuda a manter o foco.
            </CardDescription>
            {subject && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-primary">Indivíduo avaliado</p>
                <p>{subject.nome_completo}</p>
                <p className="text-xs">CPF: {subject.documento_cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8">
            {!introCompleted ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idade" className="text-sm font-medium text-muted-foreground">
                      Idade da criança (em meses) *
                    </Label>
                    <Input
                      id="idade"
                      type="number"
                      min={16}
                      max={72}
                      value={idadeMeses}
                      onChange={(e) => setIdadeMeses(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Quem está respondendo?</p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={quemResponde === "pais" ? "default" : "outline"}
                        onClick={() => setQuemResponde("pais")}
                        className="flex-1"
                      >
                        Pais/Responsáveis
                      </Button>
                      <Button
                        type="button"
                        variant={quemResponde === "responsaveis" ? "default" : "outline"}
                        onClick={() => setQuemResponde("responsaveis")}
                        className="flex-1"
                      >
                        Cuidadores
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
                    <Checkbox
                      id="consentimento"
                      checked={consentimentoPesquisa}
                      onCheckedChange={(checked) => setConsentimentoPesquisa(!!checked)}
                    />
                    <Label htmlFor="consentimento" className="text-sm leading-relaxed text-muted-foreground">
                      ✅ Confirmo o consentimento para compartilhar os dados anonimamente para fins de pesquisa.
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O teste apresenta uma pergunta por vez para reduzir a sobrecarga sensorial. Utilize o botão Próxima para avançar.
                  </p>
                </div>
                <Button
                  onClick={() => setIntroCompleted(true)}
                  disabled={!idadeMeses || !consentimentoPesquisa}
                  className="w-full"
                >
                  Iniciar questionário
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Questão {currentIndex + 1} de {perguntas.length}
                  </span>
                  <span>{Math.round(progresso)}%</span>
                </div>
                <Progress value={progresso} className="h-2" />

                <div className="bg-white rounded-lg border border-primary/20 p-6 shadow-sm">
                  <p className="text-lg font-medium text-foreground mb-6">{perguntas[currentIndex].texto}</p>

                  <div className="grid gap-3">
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === true ? "default" : "outline"}
                      className="justify-start text-left h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, true)}
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === false ? "default" : "outline"}
                      className="justify-start text-left h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, false)}
                    >
                      Não
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
                    Anterior
                  </Button>
                  {currentIndex === perguntas.length - 1 ? (
                    <Button type="button" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Enviando..." : "Concluir triagem"}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext}>
                      Próxima
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TesteMChat;
