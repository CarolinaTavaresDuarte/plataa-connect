import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, BarChart3, ArrowRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface Props {
  user: User;
}

interface TestResult {
  id: string;
  teste: string;
  data: string;
  pontuacao: number;
  nivel_risco: string;
}

export const DashboardUsuario = ({ user }: Props) => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      // Buscar nome do usuário
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nome_completo")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setUserName(profileData.nome_completo);
      }

      // Buscar resultados dos testes
      const results: TestResult[] = [];

      // M-CHAT
      const { data: mchatData } = await supabase
        .from("mchat_responses")
        .select("id, created_at, pontuacao_total, nivel_risco")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (mchatData && mchatData.length > 0) {
        results.push({
          id: mchatData[0].id,
          teste: "M-CHAT-R/F",
          data: new Date(mchatData[0].created_at).toLocaleDateString("pt-BR"),
          pontuacao: mchatData[0].pontuacao_total,
          nivel_risco: mchatData[0].nivel_risco,
        });
      }

      // ASSQ
      const { data: assqData } = await supabase
        .from("assq_responses")
        .select("id, created_at, pontuacao_total, nivel_risco")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assqData && assqData.length > 0) {
        results.push({
          id: assqData[0].id,
          teste: "ASSQ",
          data: new Date(assqData[0].created_at).toLocaleDateString("pt-BR"),
          pontuacao: assqData[0].pontuacao_total,
          nivel_risco: assqData[0].nivel_risco,
        });
      }

      // AQ-10
      const { data: aq10Data } = await supabase
        .from("aq10_responses")
        .select("id, created_at, pontuacao_total, triagem_positiva")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (aq10Data && aq10Data.length > 0) {
        results.push({
          id: aq10Data[0].id,
          teste: "AQ-10",
          data: new Date(aq10Data[0].created_at).toLocaleDateString("pt-BR"),
          pontuacao: aq10Data[0].pontuacao_total,
          nivel_risco: aq10Data[0].triagem_positiva ? "Triagem Positiva" : "Triagem Negativa",
        });
      }

      setTestResults(results);
      setLoading(false);
    };

    fetchUserData();
  }, [user.id]);

  const getRiskIcon = (nivel: string) => {
    if (nivel.toLowerCase().includes("baixo") || nivel.toLowerCase().includes("negativa")) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (nivel.toLowerCase().includes("moderado")) {
      return <Info className="h-6 w-6 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getRiskColor = (nivel: string) => {
    if (nivel.toLowerCase().includes("baixo") || nivel.toLowerCase().includes("negativa")) {
      return "text-green-600";
    } else if (nivel.toLowerCase().includes("moderado")) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Card de Boas-Vindas */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Olá, {userName || user.email?.split("@")[0]}!
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao seu dashboard pessoal. Aqui você pode acompanhar seus resultados e acessar novos testes.
            </p>
          </CardContent>
        </Card>

        {/* Seção de Resultados de Testes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Seus Resultados</h2>
          
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Você ainda não realizou nenhum teste. Comece sua triagem agora!
                </p>
                <Button onClick={() => navigate("/selecionar-teste")}>
                  Realizar Primeiro Teste
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testResults.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{result.teste}</CardTitle>
                        <CardDescription>Realizado em {result.data}</CardDescription>
                      </div>
                      {getRiskIcon(result.nivel_risco)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Pontuação</p>
                        <p className="text-2xl font-bold text-primary">{result.pontuacao}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Resultado</p>
                        <p className={`font-semibold ${getRiskColor(result.nivel_risco)}`}>
                          {result.nivel_risco}
                        </p>
                      </div>
                      <Button variant="outline" className="w-full">
                        Ver Detalhes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Ações Rápidas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => navigate("/selecionar-teste")}
            >
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Realizar Triagem</CardTitle>
                <CardDescription>
                  Acesse os questionários de avaliação especializados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full group">
                  Acessar Testes
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
              onClick={() => navigate("/landing#sobre")}
            >
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Conteúdo Educativo</CardTitle>
                <CardDescription>
                  Materiais informativos sobre TEA e desenvolvimento infantil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full group">
                  Explorar Conteúdo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Meus Dados</CardTitle>
                <CardDescription>
                  Visualize e atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full group">
                  Ver Perfil
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Próximos Passos/Recomendações */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.length === 0 ? (
              <>
                <p className="text-muted-foreground">
                  <strong>1.</strong> Complete os dados pré-teste se ainda não fez
                </p>
                <p className="text-muted-foreground">
                  <strong>2.</strong> Escolha o teste mais adequado para sua faixa etária
                </p>
                <p className="text-muted-foreground">
                  <strong>3.</strong> Responda com atenção todas as questões
                </p>
                <p className="text-muted-foreground">
                  <strong>4.</strong> Consulte os resultados e recomendações
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Com base nos seus resultados, recomendamos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Consultar um profissional especializado em TEA para avaliação completa</li>
                  <li>Explorar nosso conteúdo educativo sobre desenvolvimento infantil</li>
                  <li>Manter registro dos marcos de desenvolvimento</li>
                  <li>Buscar apoio de grupos e comunidades de famílias com TEA</li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
