import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

const TesteMChat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [idadeMeses, setIdadeMeses] = useState("");
  const [quemResponde, setQuemResponde] = useState<"pais" | "responsaveis">("pais");
  const [consentimentoPesquisa, setConsentimentoPesquisa] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
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

    if (!profile?.documento_cpf) {
      toast.error("Por favor, preencha seus dados antes de iniciar o teste");
      navigate("/dados-pre-teste", { state: { testeDestino: "/testes/mchat" } });
      return;
    }

    if (profile.teste_realizado) {
      toast.error("Você já realizou uma triagem anteriormente");
      navigate("/dashboard");
      return;
    }

    setLoading(false);
  };

  const handleRespostaChange = (id: number, valor: boolean) => {
    setRespostas({ ...respostas, [id]: valor });
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
      const { error } = await supabase.from("mchat_responses").insert({
        user_id: userId,
        idade_meses: parseInt(idadeMeses),
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
      toast.error("Erro ao salvar teste: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
                <p className={`text-2xl font-bold ${resultado.nivel === "alto" ? "text-red-600" : resultado.nivel === "moderado" ? "text-yellow-600" : "text-green-600"}`}>
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
                    Os indícios são compatíveis com baixo risco para TEA nesta faixa etária. Continue acompanhando o desenvolvimento e repita a triagem caso novas preocupações surjam.
                  </p>
                )}
                {resultado.nivel === "moderado" && (
                  <p>
                    Há sinais moderados. Recomendamos aplicar a entrevista de follow-up do M-CHAT-R/F ou buscar orientação com especialista para avaliação complementar.
                  </p>
                )}
                {resultado.nivel === "alto" && (
                  <p>
                    Os resultados apontam para alto risco. Busque encaminhamento clínico especializado para avaliação diagnóstica e definição de intervenções precoces.
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border-l-4 border-primary p-4 text-sm text-muted-foreground">
                Este instrumento é apenas uma triagem. Somente uma equipe multiprofissional pode confirmar o diagnóstico e indicar
                o plano de intervenção mais adequado.
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
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto p-8">
          {!introCompleted ? (
            <div className="space-y-6">
              <CardTitle className="text-3xl text-primary">M-CHAT-R/F</CardTitle>
              <p className="text-muted-foreground">
                Questionário de triagem para crianças de 16 a 30 meses. Responda pensando no comportamento observado nos últimos
                6 meses.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Idade da criança (em meses)</label>
                  <Input
                    type="number"
                    min="16"
                    max="48"
                    value={idadeMeses}
                    onChange={(e) => setIdadeMeses(e.target.value)}
                    placeholder="Ex: 24"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quem está respondendo</label>
                  <select
                    value={quemResponde}
                    onChange={(e) => setQuemResponde(e.target.value as "pais" | "responsaveis")}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pais">Pais</option>
                    <option value="responsaveis">Responsáveis</option>
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
                  if (!idadeMeses) {
                    toast.error("Informe a idade da criança");
                    return;
                  }
                  if (!consentimentoPesquisa) {
                    toast.error("É necessário aceitar o termo de compartilhamento anônimo para prosseguir");
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
                  <CardDescription>Selecione a opção que melhor descreve a criança.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    variant={answer === true ? "default" : "outline"}
                    className="h-14 text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, true)}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    variant={answer === false ? "default" : "outline"}
                    className="h-14 text-base"
                    onClick={() => handleRespostaChange(currentQuestion.id, false)}
                  >
                    Não
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

export default TesteMChat;
