import { Button } from "@/components/ui/button";
import { Heart, Users, Target } from "lucide-react";

export const About = () => {
  const scrollToContato = () => {
    const element = document.getElementById("contato");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Plataa: Inclusão e Apoio
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              A Plataa é uma plataforma dedicada à triagem e suporte de pessoas no espectro autista. 
              Oferecemos ferramentas validadas cientificamente para auxiliar na identificação precoce 
              do TEA, facilitando o encaminhamento para avaliação especializada.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Suporte humanizado e baseado em evidências científicas
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Conectando famílias, educadores e especialistas
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Triagem precoce para intervenção mais efetiva
                </p>
              </div>
            </div>

            <Button onClick={scrollToContato} variant="outline" size="lg" className="border-2 hover:bg-muted transition-smooth">
              Entre em Contato
            </Button>
          </div>
          
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=2086"
              alt="Apoio e inclusão"
              className="rounded-lg shadow-elegant w-full h-[400px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
