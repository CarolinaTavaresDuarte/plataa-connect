import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

const TesteMChat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [idadeMeses, setIdadeMeses] = useState("");
  const [quemResponde, setQuemResponde] = useState<"pais" | "responsaveis">("pais");
  const [aceitaCompartilhar, setAceitaCompartilhar] = useState(false);
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
  const [resultado, setResultado] = useState<{ pontuacao: number; nivel: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        setLoading(false);
      }
    });
  }, [navigate]);

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

  const determinarNivelRisco = (pontuacao: number): string => {
    if (pontuacao <= 2) return "baixo";
    if (pontuacao <= 7) return "moderado";
    return "alto";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !idadeMeses) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (Object.keys(respostas).length < perguntas.length) {
      toast.error("Por favor, responda todas as perguntas");
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
        aceita_compartilhar_dados: aceitaCompartilhar,
        respostas: respostas,
        pontuacao_total: pontuacao,
        nivel_risco: nivel,
      });

      if (error) throw error;

      setResultado({ pontuacao, nivel });
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
            <h1 className="text-3xl font-bold mb-6 text-center">Resultado M-CHAT-R/F</h1>
            
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-primary mb-4">{resultado.pontuacao} / 20</p>
              <p className="text-xl font-semibold mb-2">
                Nível de Risco: <span className="text-primary">{resultado.nivel.toUpperCase()}</span>
              </p>
            </div>

            <div className="bg-muted p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-3">Interpretação:</h3>
              {resultado.nivel === "baixo" && (
                <p>Baixo risco. Nenhuma ação imediata necessária. Reavaliar mais tarde se surgirem preocupações.</p>
              )}
              {resultado.nivel === "moderado" && (
                <p>Risco moderado. Recomenda-se aplicar o Follow-Up ou buscar avaliação complementar com especialista.</p>
              )}
              {resultado.nivel === "alto" && (
                <p className="font-semibold">Alto risco. Recomenda-se encaminhar para avaliação diagnóstica e intervenção precoce com profissional especializado.</p>
              )}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm">
                <strong>Importante:</strong> Este questionário é apenas uma ferramenta de triagem e não substitui 
                a avaliação clínica profissional completa. Procure um especialista em desenvolvimento infantil 
                para diagnóstico definitivo.
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Voltar ao Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Fazer Novo Teste
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-2">M-CHAT-R/F</h1>
          <p className="text-muted-foreground mb-6">
            Modified Checklist for Autism in Toddlers - Para crianças de 16 a 30 meses
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
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
                  className="w-full p-2 border rounded-md"
                >
                  <option value="pais">Pais</option>
                  <option value="responsaveis">Responsáveis</option>
                </select>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={aceitaCompartilhar}
                onCheckedChange={(checked) => setAceitaCompartilhar(checked as boolean)}
              />
              <label className="text-sm">
                Aceito compartilhar os dados desta avaliação de forma anônima para fins de pesquisa
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Perguntas (responda Sim ou Não):</h3>
              {perguntas.map((pergunta) => (
                <Card key={pergunta.id} className="p-4">
                  <p className="mb-3">
                    <span className="font-semibold">{pergunta.id}.</span> {pergunta.texto}
                  </p>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === true ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, true)}
                      className="flex-1"
                    >
                      Sim
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === false ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, false)}
                      className="flex-1"
                    >
                      Não
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Enviando..." : "Enviar Teste"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default TesteMChat;
