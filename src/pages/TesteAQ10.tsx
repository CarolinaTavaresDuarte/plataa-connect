import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ScreeningNavigationState, ScreeningSubject } from "@/types/screening";

const STORAGE_KEY = "screening:aq10";

const perguntas = [
  { id: 1, texto: "Costumo notar pequenos detalhes que outros não percebem", pontuaConcordo: true },
  { id: 2, texto: "Prefiro fazer as coisas do mesmo jeito repetidamente", pontuaConcordo: true },
  { id: 3, texto: "Acho fácil inventar histórias ou imaginar situações", pontuaConcordo: false },
  { id: 4, texto: "Fico muito absorvido(a) em meus interesses e hobbies", pontuaConcordo: true },
  { id: 5, texto: "Geralmente me concentro mais no quadro geral do que nos detalhes", pontuaConcordo: false },
  { id: 6, texto: "Acho fácil manter uma conversa com outras pessoas", pontuaConcordo: false },
  { id: 7, texto: "Gosto de planejar tudo com antecedência em detalhes", pontuaConcordo: true },
  { id: 8, texto: "Frequentemente entendo facilmente o que a outra pessoa está pensando ou sentindo", pontuaConcordo: false },
  { id: 9, texto: "Acho fácil imaginar como outra pessoa se sente em uma história", pontuaConcordo: false },
  { id: 10, texto: "Costumo me interessar intensamente por certos tópicos ou áreas", pontuaConcordo: true },
];

type Resultado = {
  triagemPositiva: boolean;
  pontuacao: number;
};

const loadSubjectFromStorage = () => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ScreeningSubject & { screening_subject_id?: string };
  } catch (error) {
    console.warn("Erro ao recuperar dados de sessão do AQ-10", error);
    return null;
  }
};

const TesteAQ10 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState<(ScreeningSubject & { screening_subject_id?: string }) | null>(null);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [consentimentoPesquisa, setConsentimentoPesquisa] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
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
        const stored = loadSubjectFromStorage();
        if (stored) {
          setSubject(stored);
        }
      }

      setLoading(false);
    };

    initialise();
  }, [navigate, location.state]);

  useEffect(() => {
    if (!loading && !subject) {
      toast.error("Informe os dados do indivíduo antes de iniciar o AQ-10.");
      navigate("/dados-pre-teste", { state: { testeDestino: "/testes/aq10" } });
    }
  }, [loading, subject, navigate]);

  useEffect(() => {
    if (subject) {
      setConsentimentoPesquisa(subject.consentimento_pesquisa);
    }
  }, [subject]);

  const handleRespostaChange = (id: number, valor: string) => {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
  };

  const calcularPontuacao = () => {
    let pontos = 0;
    perguntas.forEach((p) => {
      const resposta = respostas[p.id];

      if (p.pontuaConcordo) {
        if (resposta === "concordo_totalmente" || resposta === "concordo_pouco") {
          pontos++;
        }
      } else {
        if (resposta === "discordo_totalmente" || resposta === "discordo_pouco") {
          pontos++;
        }
      }
    });
    return pontos;
  };

  const progresso = useMemo(() => ((currentIndex + 1) / perguntas.length) * 100, [currentIndex]);

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

  const handleSubmit = async () => {
    if (!userId || !subject) {
      toast.error("Erro de autenticação");
      return;
    }

    if (Object.keys(respostas).length < perguntas.length) {
      toast.error("Responda todas as questões para concluir");
      return;
    }

    const pontuacao = calcularPontuacao();
    const triagemPositiva = pontuacao >= 6;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("aq10_responses").insert({
        user_id: userId,
        screening_subject_id: subject.screening_subject_id ?? null,
        documento_cpf: subject.documento_cpf,
        respostas,
        pontuacao_total: pontuacao,
        triagem_positiva: triagemPositiva,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (error) throw error;

      const { error: ibgeError } = await supabase.from("ibge_analysis_records").insert({
        owner_user_id: userId,
        test_type: "aq10",
        faixa_etaria: "Adulto 16+",
        regiao_geografica: subject.regiao_bairro,
        score_bruto: pontuacao,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (ibgeError) {
        console.warn("Falha ao registrar dado anonimizado", ibgeError);
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setResultado({ triagemPositiva, pontuacao });
      toast.success("Teste concluído com sucesso!");
    } catch (error: any) {
      if (error?.message?.includes("duplicate key value")) {
        toast.error("Este CPF já possui uma resposta registrada para o AQ-10.");
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
              <CardTitle className="text-3xl text-primary text-center">Resultado AQ-10</CardTitle>
              <CardDescription className="text-center">
                Resultado interpretativo baseado na soma de pontos. Utilize para buscar orientação com especialista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Classificação atual</p>
                <p className={`text-2xl font-bold ${resultado.triagemPositiva ? "text-red-600" : "text-green-600"}`}>
                  {resultado.triagemPositiva ? "Triagem positiva" : "Triagem negativa"}
                </p>
                <p className="text-sm text-muted-foreground">Pontuação: {resultado.pontuacao} de 10</p>
              </div>
              <div className="bg-muted p-6 rounded-lg space-y-3 text-sm text-muted-foreground">
                {resultado.triagemPositiva ? (
                  <p>
                    O resultado sugere sinais relevantes associados ao TEA. Busque avaliação com equipe especializada para
                    investigar com mais profundidade e planejar os próximos passos.
                  </p>
                ) : (
                  <p>
                    O resultado indica baixo risco com base no AQ-10. Se novas preocupações surgirem, considere repetir a triagem ou
                    buscar orientação profissional.
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border-l-4 border-primary p-4 text-sm text-muted-foreground">
                Este questionário é um instrumento de triagem. Ele não substitui avaliação diagnóstica completa.
              </div>
              <div className="flex gap-4 flex-col md:flex-row">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  Voltar ao dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dados-pre-teste", { state: { testeDestino: "/testes/aq10" } })}
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

  const currentQuestion = perguntas[currentIndex];
  const answer = respostas[currentQuestion.id];
  const progressValue = ((currentIndex + 1) / perguntas.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto shadow-elegant">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl text-primary text-center">AQ-10</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Autoavaliação rápida para adultos (16+). Responda com sinceridade e atenção, uma pergunta por vez.
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
                <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
                  <Checkbox
                    id="consentimento"
                    checked={consentimentoPesquisa}
                    onCheckedChange={(checked) => setConsentimentoPesquisa(!!checked)}
                  />
                  <label htmlFor="consentimento" className="text-sm leading-relaxed text-muted-foreground">
                    ✅ Confirmo o consentimento para compartilhar os dados anonimamente para fins de pesquisa.
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você verá apenas uma afirmação por vez. Escolha a opção que melhor descreve a frequência com que você concorda ou discorda.
                </p>
                <Button
                  onClick={() => setIntroCompleted(true)}
                  disabled={!consentimentoPesquisa}
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === "concordo_totalmente" ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, "concordo_totalmente")}
                    >
                      Concordo totalmente
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === "concordo_pouco" ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, "concordo_pouco")}
                    >
                      Concordo um pouco
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === "discordo_pouco" ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, "discordo_pouco")}
                    >
                      Discordo um pouco
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[perguntas[currentIndex].id] === "discordo_totalmente" ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleRespostaChange(perguntas[currentIndex].id, "discordo_totalmente")}
                    >
                      Discordo totalmente
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

export default TesteAQ10;
