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

const STORAGE_KEY = "screening:assq";

const perguntas = [
  "É desajeitado(a) em seus movimentos",
  "Não entende piadas ou sarcasmo",
  "Tem dificuldade para fazer amigos da mesma idade",
  "Tem interesses muito específicos e intensos",
  "Fala de forma muito formal ou pedante (como adulto)",
  "Interpreta expressões ou gestos de forma literal",
  "Tem voz ou entonação incomum (monótona, aguda, etc.)",
  "Não percebe sentimentos dos outros facilmente",
  "Prefere ficar sozinho(a) a brincar com outros",
  "Comporta-se de forma inadequada em situações sociais",
  "Fala muito sobre um único assunto",
  "Evita contato visual ou olha de forma estranha",
  "Usa gestos ou expressões faciais de forma limitada",
  "Tem rotinas rígidas e se perturba com mudanças",
  "Tem reações intensas a sons, texturas ou luzes",
  "Faz movimentos repetitivos (balançar, girar)",
  "Tem comportamentos ou interesses incomuns",
  "Coleciona objetos de forma incomum",
  "Faz perguntas repetidas sobre os mesmos temas",
  "Tem dificuldade de coordenação motora",
  "Tem dificuldades com escrita ou desenho",
  "Tem postura corporal rígida ou desajeitada",
  "Mostra pouca expressão facial",
  "Leva tudo ao pé da letra",
  "Tem explosões emocionais intensas",
  "Foca em detalhes pequenos ignorando o todo",
  "Tem memória excepcional para fatos ou datas específicas",
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
    console.warn("Erro ao recuperar dados de sessão do ASSQ", error);
    return null;
  }
};

const faixaEtariaPorAnos = (anos: number) => {
  if (anos <= 8) return "6-8 anos";
  if (anos <= 11) return "9-11 anos";
  if (anos <= 14) return "12-14 anos";
  return "15-17 anos";
};

const TesteASSQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState<(ScreeningSubject & { screening_subject_id?: string }) | null>(null);
  const [idadeAnos, setIdadeAnos] = useState("");
  const [quemResponde, setQuemResponde] = useState<"adolescente" | "pais" | "professores">("pais");
  const [consentimentoPesquisa, setConsentimentoPesquisa] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
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
      toast.error("Informe os dados do indivíduo antes de iniciar o ASSQ.");
      navigate("/dados-pre-teste", { state: { testeDestino: "/testes/assq" } });
    }
  }, [loading, subject, navigate]);

  useEffect(() => {
    if (subject) {
      setConsentimentoPesquisa(subject.consentimento_pesquisa);
    }
  }, [subject]);

  const handleRespostaChange = (index: number, valor: number) => {
    setRespostas((prev) => ({ ...prev, [index]: valor }));
  };

  const calcularPontuacao = () => {
    return Object.values(respostas).reduce((sum, val) => sum + val, 0);
  };

  const determinarNivelRisco = (pontuacao: number): Resultado["nivel"] => {
    if (pontuacao <= 12) return "baixo";
    if (pontuacao <= 19) return "moderado";
    return "alto";
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

    if (!idadeAnos) {
      toast.error("Informe a idade da pessoa avaliada.");
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
      const { error } = await supabase.from("assq_responses").insert({
        user_id: userId,
        screening_subject_id: subject.screening_subject_id ?? null,
        documento_cpf: subject.documento_cpf,
        idade_anos: parseInt(idadeAnos, 10),
        quem_responde: quemResponde,
        respostas,
        pontuacao_total: pontuacao,
        nivel_risco: nivel,
        consentimento_pesquisa: consentimentoPesquisa,
      });

      if (error) throw error;

      const { error: ibgeError } = await supabase.from("ibge_analysis_records").insert({
        owner_user_id: userId,
        test_type: "assq",
        faixa_etaria: faixaEtariaPorAnos(parseInt(idadeAnos, 10)),
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
        toast.error("Este CPF já possui uma resposta registrada para o ASSQ.");
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
              <CardTitle className="text-3xl text-primary text-center">Resultado ASSQ</CardTitle>
              <CardDescription className="text-center">
                Interpretação resumida. Compartilhe o resultado com um especialista para orientação clínica completa.
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
                    Os indícios sugerem baixo risco. Continue observando o desenvolvimento socioemocional e repita a triagem
                    se surgirem novas preocupações.
                  </p>
                )}
                {resultado.nivel === "moderado" && (
                  <p>
                    Há sinais moderados. Busque avaliação com profissional especializado e considere estratégias de suporte em casa e na escola.
                  </p>
                )}
                {resultado.nivel === "alto" && (
                  <p>
                    O resultado aponta risco elevado. Procure equipe multiprofissional para avaliação diagnóstica e orientações de intervenção.
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border-l-4 border-primary p-4 text-sm text-muted-foreground">
                Este questionário é uma triagem e não substitui avaliação clínica. Utilize-o como base para buscar encaminhamento.
              </div>
              <div className="flex gap-4 flex-col md:flex-row">
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  Voltar ao dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dados-pre-teste", { state: { testeDestino: "/testes/assq" } })}
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
  const answer = respostas[currentIndex] ?? undefined;
  const progressValue = ((currentIndex + 1) / perguntas.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto shadow-elegant">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl text-primary text-center">ASSQ</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Avaliação para crianças e adolescentes entre 6 e 17 anos. Responda com calma, pensando nas situações do dia a dia.
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
                      Idade da pessoa avaliada (em anos) *
                    </Label>
                    <Input
                      id="idade"
                      type="number"
                      min={6}
                      max={17}
                      value={idadeAnos}
                      onChange={(e) => setIdadeAnos(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Quem está respondendo?</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(["pais", "professores", "adolescente"] as const).map((tipo) => (
                        <Button
                          key={tipo}
                          type="button"
                          variant={quemResponde === tipo ? "default" : "outline"}
                          onClick={() => setQuemResponde(tipo)}
                          className="capitalize"
                        >
                          {tipo}
                        </Button>
                      ))}
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
                    Cada pergunta possui três opções (0, 1, 2). Use a que melhor descreve a frequência do comportamento.
                  </p>
                </div>
                <Button
                  onClick={() => setIntroCompleted(true)}
                  disabled={!idadeAnos || !consentimentoPesquisa}
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
                  <p className="text-lg font-medium text-foreground mb-6">{perguntas[currentIndex]}</p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((valor) => (
                      <Button
                        key={valor}
                        type="button"
                        variant={respostas[currentIndex] === valor ? "default" : "outline"}
                        className="h-12"
                        onClick={() => handleRespostaChange(currentIndex, valor)}
                      >
                        {valor === 0 ? "Não" : valor === 1 ? "Às vezes" : "Sim"}
                      </Button>
                    ))}
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

export default TesteASSQ;
