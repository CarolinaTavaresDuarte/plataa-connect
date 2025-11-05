import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

    setUserId(session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("documento_cpf, teste_realizado")
      .eq("user_id", session.user.id)
      .single();

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

      await supabase
        .from("profiles")
        .update({ teste_realizado: true })
        .eq("user_id", userId);

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
                Orientação resumida com base na triagem preenchida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Classificação atual</p>
                <p className={`text-2xl font-bold ${resultado.nivel === "alto" ? "text-red-600" : resultado.nivel === "moderado" ? "text-yellow-600" : "text-green-600"}`}>
                  {resultado.nivel === "alto"
                    ? "Alto risco"
                    : resultado.nivel === "moderado"
                    ? "Risco moderado"
                    : "Baixo risco"}
                </p>
              </div>
              {resultado.nivel === "baixo" && (
                <p>
                  Os sinais observados indicam baixo risco. Mantenha o acompanhamento escolar e familiar, revisitando a triagem se
                  novas preocupações surgirem.
                </p>
              )}
              {resultado.nivel === "moderado" && (
                <p>
                  O resultado sugere risco moderado. Busque orientação junto à equipe pedagógica e considere avaliação clínica para
                  aprofundamento.
                </p>
              )}
              {resultado.nivel === "alto" && (
                <p>
                  O resultado aponta alto risco. Encaminhe o participante para avaliação multidisciplinar especializada o quanto
                  antes.
                </p>
              )}
              <div className="bg-blue-50 border-l-4 border-primary p-4">
                Este instrumento é uma triagem e não substitui avaliação diagnóstica completa. Utilize o resultado para orientar
                os próximos passos com especialistas.
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
  const answer = respostas[currentIndex] ?? undefined;
  const progressValue = ((currentIndex + 1) / perguntas.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto p-8">
          {!introCompleted ? (
            <div className="space-y-6">
              <CardTitle className="text-3xl text-primary">ASSQ</CardTitle>
              <p className="text-muted-foreground">
                Questionário para crianças e adolescentes de 6 a 17 anos. Classifique cada afirmação de acordo com a intensidade
                observada no último semestre.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Idade (em anos)</label>
                  <Input
                    type="number"
                    min="6"
                    max="17"
                    value={idadeAnos}
                    onChange={(e) => setIdadeAnos(e.target.value)}
                    placeholder="Ex: 10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quem está respondendo</label>
                  <select
                    value={quemResponde}
                    onChange={(e) => setQuemResponde(e.target.value as "adolescente" | "pais" | "professores")}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="adolescente">O próprio adolescente</option>
                    <option value="pais">Pais</option>
                    <option value="professores">Professores</option>
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox checked={consentimentoPesquisa} onCheckedChange={(checked) => setConsentimentoPesquisa(!!checked)} />
                <span className="text-sm text-muted-foreground">
                  ✅ Aceito compartilhar os dados desta avaliação de forma anônima para fins de pesquisa.
                </span>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  if (!idadeAnos) {
                    toast.error("Informe a idade");
                    return;
                  }
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
                  <CardTitle className="text-lg">{currentQuestion}</CardTitle>
                  <CardDescription>Escolha a opção que representa a intensidade observada.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <Button
                    type="button"
                    variant={answer === 0 ? "default" : "outline"}
                    className="h-14 text-base"
                    onClick={() => handleRespostaChange(currentIndex, 0)}
                  >
                    Não
                  </Button>
                  <Button
                    type="button"
                    variant={answer === 1 ? "default" : "outline"}
                    className="h-14 text-base"
                    onClick={() => handleRespostaChange(currentIndex, 1)}
                  >
                    Um pouco
                  </Button>
                  <Button
                    type="button"
                    variant={answer === 2 ? "default" : "outline"}
                    className="h-14 text-base"
                    onClick={() => handleRespostaChange(currentIndex, 2)}
                  >
                    Sim
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

export default TesteASSQ;
