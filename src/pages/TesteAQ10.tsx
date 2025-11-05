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
};

const TesteAQ10 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [consentimentoPesquisa, setConsentimentoPesquisa] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    checkUserAndProfile();
  }, [navigate]);

  const checkUserAndProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

      if (!session) {
        navigate("/auth");
        return;
      }

    const { data: profile } = await supabase
      .from("profiles")
      .select("documento_cpf, teste_realizado")
      .eq("user_id", session.user.id)
      .single();

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
    if (!userId) {
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
        respostas,
        pontuacao_total: pontuacao,
        triagem_positiva: triagemPositiva,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ teste_realizado: true })
        .eq("user_id", userId);

      setResultado({ triagemPositiva });
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
                Interpretação direta da triagem para apoiar a tomada de decisão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Classificação atual</p>
                <p className={`text-2xl font-bold ${resultado.triagemPositiva ? "text-orange-600" : "text-green-600"}`}>
                  {resultado.triagemPositiva ? "Triagem positiva" : "Triagem negativa"}
                </p>
              </div>
              {resultado.triagemPositiva ? (
                <p>
                  Há indícios relevantes de traços associados ao espectro autista. Recomendamos encaminhar para avaliação clínica
                  especializada para confirmação diagnóstica.
                </p>
              ) : (
                <p>
                  Os resultados não apontam para risco elevado. Se existirem dúvidas clínicas, considere avaliação complementar ou
                  repita a triagem em outro momento.
                </p>
              )}
              <div className="bg-blue-50 border-l-4 border-primary p-4">
                O AQ-10 é uma ferramenta rápida de rastreio. Apenas profissionais especializados podem realizar diagnóstico
                conclusivo.
              </div>
              <div className="flex gap-4 flex-col md:flex-row">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  Voltar ao dashboard
                </Button>
                <Button onClick={() => navigate("/selecionar-teste")} variant="outline" className="flex-1">
                  Realizar outro teste
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
        <Card className="max-w-3xl mx-auto p-8">
          {!introCompleted ? (
            <div className="space-y-6">
              <CardTitle className="text-3xl text-primary">AQ-10</CardTitle>
              <p className="text-muted-foreground">
                Autoavaliação rápida para adultos e adolescentes (16+). Avalie o quanto você concorda com cada afirmação com base
                nos últimos meses.
              </p>
              <div className="flex items-start gap-3">
                <Checkbox checked={consentimentoPesquisa} onCheckedChange={(checked) => setConsentimentoPesquisa(!!checked)} />
                <span className="text-sm text-muted-foreground">
                  ✅ Aceito compartilhar os dados desta avaliação de forma anônima para fins de pesquisa.
                </span>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  if (!consentimentoPesquisa) {
                    toast.error("É necessário aceitar o termo de compartilhamento para prosseguir");
                    return;
                  }
                  setIntroCompleted(true);
                }}
              >
                Iniciar questionário
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Questão {currentIndex + 1} de {perguntas.length}
                  </span>
                  <span>{progressValue.toFixed(0)}%</span>
                </div>
                <Progress value={progressValue} />
              </div>

              <Card className="border border-primary/20 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion.texto}</CardTitle>
                  <CardDescription>Selecione o nível de concordância.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    variant={answer === "concordo_totalmente" ? "default" : "outline"}
                    className="h-14 text-sm md:text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, "concordo_totalmente")}
                  >
                    Concordo totalmente
                  </Button>
                  <Button
                    type="button"
                    variant={answer === "concordo_pouco" ? "default" : "outline"}
                    className="h-14 text-sm md:text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, "concordo_pouco")}
                  >
                    Concordo um pouco
                  </Button>
                  <Button
                    type="button"
                    variant={answer === "discordo_pouco" ? "default" : "outline"}
                    className="h-14 text-sm md:text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, "discordo_pouco")}
                  >
                    Discordo um pouco
                  </Button>
                  <Button
                    type="button"
                    variant={answer === "discordo_totalmente" ? "default" : "outline"}
                    className="h-14 text-sm md:text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, "discordo_totalmente")}
                  >
                    Discordo totalmente
                  </Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
                  Anterior
                </Button>
                {currentIndex === perguntas.length - 1 ? (
                  <Button type="button" onClick={handleSubmit} disabled={answer === undefined || submitting}>
                    {submitting ? "Enviando..." : "Enviar resultado"}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} disabled={answer === undefined}>
                    Próxima
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default TesteAQ10;
