import { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, BookOpen, FileSpreadsheet, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  user: User;
}

export const DashboardEspecialista = ({ user }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Painel do Especialista - {user.user_metadata?.nome_completo || "Dr(a)."}
          </h1>
          <p className="text-muted-foreground">
            Acesso completo aos dados e análises da plataforma
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">432</p>
                <p className="text-sm text-muted-foreground">Triagens Realizadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">Testes M-CHAT</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">124</p>
                <p className="text-sm text-muted-foreground">Testes ASSQ</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/especialista/usuarios")}>
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Dados dos Usuários</h3>
                  <p className="text-muted-foreground">
                    Acesse todos os perfis e respostas
                  </p>
                </div>
              </div>
              <Button className="mt-auto">Visualizar Dados</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/especialista/dashboard")}>
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Dashboard Analítico</h3>
                  <p className="text-muted-foreground">
                    Gráficos e estatísticas detalhadas
                  </p>
                </div>
              </div>
              <Button className="mt-auto">Acessar Dashboard</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/educacao")}>
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Recursos Educativos</h3>
                  <p className="text-muted-foreground">
                    Material sobre TEA e metodologias
                  </p>
                </div>
              </div>
              <Button className="mt-auto">Ver Recursos</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/especialista/importar")}>
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Importar Dados IBGE</h3>
                  <p className="text-muted-foreground">
                    Visualização de dados externos
                  </p>
                </div>
              </div>
              <Button className="mt-auto">Importar Excel</Button>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-hero text-white">
          <h2 className="text-2xl font-bold mb-4">Painel do Especialista</h2>
          <p className="leading-relaxed">
            Bem-vindo ao painel administrativo da Plataa. Aqui você tem acesso completo a todos os dados 
            coletados pela plataforma, incluindo perfis de usuários, resultados de triagens e estatísticas 
            agregadas. Use essas informações para pesquisa, análise e apoio ao diagnóstico clínico.
          </p>
        </Card>
      </main>
    </div>
  );
};
