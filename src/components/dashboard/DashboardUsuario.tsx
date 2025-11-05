import { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, BookOpen, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  user: User;
}

export const DashboardUsuario = ({ user }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo(a), {user.user_metadata?.nome_completo || "Usuário"}!
          </h1>
          <p className="text-muted-foreground">
            Escolha uma das opções abaixo para começar
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-1 cursor-pointer" onClick={() => navigate("/selecionar-teste")}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Realizar Triagem</h3>
              <p className="text-muted-foreground mb-4">
                Acesse os testes de triagem M-CHAT-R/F, ASSQ ou AQ-10
              </p>
              <Button className="mt-auto">Acessar Testes</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Conteúdo Educativo</h3>
              <p className="text-muted-foreground mb-4">
                Aprenda mais sobre TEA, ADOS-2 e ADI-R
              </p>
              <Button className="mt-auto">Saiba Mais</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-smooth hover:-translate-y-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Meus Resultados</h3>
              <p className="text-muted-foreground mb-4">
                Visualize os resultados das suas triagens
              </p>
              <Button className="mt-auto">Ver Resultados</Button>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary to-primary-hover text-white">
          <h2 className="text-2xl font-bold mb-4">Sobre o Transtorno do Espectro Autista (TEA)</h2>
          <p className="mb-4 leading-relaxed">
            O Transtorno do Espectro Autista (TEA) é uma condição neurológica que afeta o desenvolvimento 
            da comunicação, interação social e comportamento. A identificação precoce é fundamental para 
            garantir intervenções adequadas e melhorar a qualidade de vida.
          </p>
          <p className="leading-relaxed">
            Nossa plataforma oferece ferramentas de triagem validadas cientificamente que podem auxiliar 
            na identificação de sinais do TEA. No entanto, é importante ressaltar que esses testes não 
            substituem uma avaliação clínica completa por profissionais especializados.
          </p>
        </Card>
      </main>
    </div>
  );
};
