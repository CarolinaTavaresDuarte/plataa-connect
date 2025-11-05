import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

const TesteAQ10 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [resultado, setResultado] = useState<{ pontuacao: number; triagemPositiva: boolean } | null>(null);

  useEffect(() => {
    checkUserAndProfile();
  }, [navigate]);

  const checkUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Verificar se o usuário já preencheu os dados necessários
    const { data: profile } = await supabase
      .from("profiles")
      .select("documento_cpf, teste_realizado")
      .eq("user_id", session.user.id)
      .single();

    if (!profile?.documento_cpf) {
      toast.error("Por favor, preencha seus dados antes de iniciar o teste");
      navigate("/dados-pre-teste", { state: { testeDestino: "/testes/aq10" } });
      return;
    }

    if (profile.teste_realizado) {
      toast.error("Você já realizou uma triagem anteriormente");
      navigate("/dashboard");
      return;
    }

    setLoading(false);
  };

  const handleRespostaChange = (id: number, valor: string) => {
    setRespostas({ ...respostas, [id]: valor });
  };

  const calcularPontuacao = () => {
    let pontos = 0;
    perguntas.forEach((p) => {
      const resposta = respostas[p.id];
      
      if (p.pontuaConcordo) {
        // Para estas perguntas, concordar indica traço autístico
        if (resposta === "concordo_totalmente" || resposta === "concordo_pouco") {
          pontos++;
        }
      } else {
        // Para estas perguntas, discordar indica traço autístico
        if (resposta === "discordo_totalmente" || resposta === "discordo_pouco") {
          pontos++;
        }
      }
    });
    return pontos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Erro de autenticação");
      return;
    }

    if (Object.keys(respostas).length < perguntas.length) {
      toast.error("Por favor, responda todas as perguntas");
      return;
    }

    const pontuacao = calcularPontuacao();
    const triagemPositiva = pontuacao >= 6;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("aq10_responses").insert({
        user_id: userId,
        respostas: respostas,
        pontuacao_total: pontuacao,
        triagem_positiva: triagemPositiva,
      });

      if (error) throw error;

      // Marcar que o usuário já realizou o teste
      await supabase
        .from("profiles")
        .update({ teste_realizado: true })
        .eq("user_id", userId);

      setResultado({ pontuacao, triagemPositiva });
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
            <h1 className="text-3xl font-bold mb-6 text-center">Resultado AQ-10</h1>
            
            <div className="text-center mb-8">
              <p className="text-5xl font-bold text-primary mb-4">{resultado.pontuacao} / 10</p>
              <p className="text-xl font-semibold mb-2">
                Triagem: <span className={resultado.triagemPositiva ? "text-orange-600" : "text-green-600"}>
                  {resultado.triagemPositiva ? "POSITIVA" : "NEGATIVA"}
                </span>
              </p>
            </div>

            <div className="bg-muted p-6 rounded-lg mb-6">
              <h3 className="font-bold mb-3">Interpretação:</h3>
              {resultado.triagemPositiva ? (
                <div>
                  <p className="font-semibold mb-2">Pontuação ≥ 6: Triagem positiva</p>
                  <p>
                    Recomenda-se encaminhar para avaliação diagnóstica por equipe especializada. 
                    Esta pontuação indica a presença significativa de traços associados ao espectro autista.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-2">Pontuação &lt; 6: Baixo risco</p>
                  <p>
                    Nenhuma ação necessária, exceto se houver preocupação clínica específica. 
                    Os traços identificados estão dentro da variação típica.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm">
                <strong>Importante:</strong> O AQ-10 é uma ferramenta de triagem rápida e não constitui diagnóstico. 
                Apenas profissionais especializados podem realizar avaliação diagnóstica completa do Transtorno 
                do Espectro Autista (TEA).
              </p>
              <p className="text-sm mt-2">
                <strong>Referência:</strong> Baron-Cohen et al., 2012. Autism-Spectrum Quotient (AQ-10). 
                University of Cambridge.
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
          <h1 className="text-3xl font-bold mb-2">AQ-10</h1>
          <p className="text-muted-foreground mb-6">
            Autism-Spectrum Quotient - Para adolescentes e adultos (16+ anos)
          </p>

          <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6">
            <p className="text-sm">
              Este questionário é uma autoavaliação rápida com 10 perguntas. 
              Leia cada afirmação e indique o quanto você concorda ou discorda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {perguntas.map((pergunta) => (
                <Card key={pergunta.id} className="p-4">
                  <p className="mb-4 font-medium">
                    <span className="font-bold">{pergunta.id}.</span> {pergunta.texto}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === "concordo_totalmente" ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, "concordo_totalmente")}
                      className="text-xs md:text-sm"
                    >
                      Concordo Totalmente
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === "concordo_pouco" ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, "concordo_pouco")}
                      className="text-xs md:text-sm"
                    >
                      Concordo um Pouco
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === "discordo_pouco" ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, "discordo_pouco")}
                      className="text-xs md:text-sm"
                    >
                      Discordo um Pouco
                    </Button>
                    <Button
                      type="button"
                      variant={respostas[pergunta.id] === "discordo_totalmente" ? "default" : "outline"}
                      onClick={() => handleRespostaChange(pergunta.id, "discordo_totalmente")}
                      className="text-xs md:text-sm"
                    >
                      Discordo Totalmente
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

export default TesteAQ10;
