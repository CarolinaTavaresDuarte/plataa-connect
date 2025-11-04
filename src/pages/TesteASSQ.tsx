import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  "Tem memória excepcional para fatos ou datas específicas"
];

const TesteASSQ = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [idadeAnos, setIdadeAnos] = useState("");
  const [quemResponde, setQuemResponde] = useState<"adolescente" | "pais" | "professores">("pais");
  const [respostas, setRespostas] = useState<Record<number, number>>({});
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

  const handleRespostaChange = (index: number, valor: number) => {
    setRespostas({ ...respostas, [index]: valor });
  };

  const calcularPontuacao = () => {
    return Object.values(respostas).reduce((sum, val) => sum + val, 0);
  };

  const determinarNivelRisco = (pontuacao: number): string => {
    if (pontuacao <= 12) return "baixo";
    if (pontuacao <= 19) return "moderado";
    return "alto";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !idadeAnos) {
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
      const { error } = await supabase.from("assq_responses").insert({
        user_id: userId,
        idade_anos: parseInt(idadeAnos),
        quem_responde: quemResponde,
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
            <h1 className="text-3xl font-bold mb-6 text-center">Resultado ASSQ</h1>
            
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-primary mb-4">{resultado.pontuacao} / 54</p>
              <p className="text-xl font-semibold mb-2">
                Nível de Risco: <span className="text-primary">{resultado.nivel.toUpperCase()}</span>
              </p>
            </div>

            <div className="bg-muted p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-3">Interpretação:</h3>
              {resultado.nivel === "baixo" && (
                <p>Baixo risco. Sem sinais consistentes. Manter observação ao longo do tempo.</p>
              )}
              {resultado.nivel === "moderado" && (
                <p>Risco moderado. Recomenda-se repetir triagem ou pedir avaliação complementar com especialista.</p>
              )}
              {resultado.nivel === "alto" && (
                <p className="font-semibold">Alto risco. Recomenda-se encaminhar para avaliação especializada completa.</p>
              )}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm">
                <strong>Importante:</strong> Este questionário é apenas uma ferramenta de triagem e não substitui 
                a avaliação clínica profissional completa. Procure um especialista para diagnóstico definitivo.
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
          <h1 className="text-3xl font-bold mb-2">ASSQ</h1>
          <p className="text-muted-foreground mb-6">
            Autism Spectrum Screening Questionnaire - Para crianças e adolescentes de 6 a 17 anos
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
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
                  className="w-full p-2 border rounded-md"
                >
                  <option value="adolescente">O próprio adolescente</option>
                  <option value="pais">Pais</option>
                  <option value="professores">Professores</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Perguntas (0 = Não, 1 = Um pouco, 2 = Sim):</h3>
              {perguntas.map((pergunta, index) => (
                <Card key={index} className="p-4">
                  <p className="mb-3">
                    <span className="font-semibold">{index + 1}.</span> {pergunta}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={respostas[index] === 0 ? "default" : "outline"}
                      onClick={() => handleRespostaChange(index, 0)}
                      className="flex-1"
                    >
                      Não
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[index] === 1 ? "default" : "outline"}
                      onClick={() => handleRespostaChange(index, 1)}
                      className="flex-1"
                    >
                      Um pouco
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[index] === 2 ? "default" : "outline"}
                      onClick={() => handleRespostaChange(index, 2)}
                      className="flex-1"
                    >
                      Sim
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

export default TesteASSQ;
