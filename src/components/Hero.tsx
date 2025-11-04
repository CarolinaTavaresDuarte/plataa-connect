import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  const scrollToServicos = () => {
    const element = document.getElementById("servicos");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-hero opacity-95"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=2070')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay"
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
          Plataa
        </h1>
        <p className="text-2xl md:text-3xl mb-4 font-semibold">
          Plataforma de Triagem e Atendimento ao Autista
        </p>
        <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90">
          Ferramentas especializadas para identificação precoce e suporte ao Transtorno do Espectro Autista (TEA)
        </p>
        
        <Button 
          size="lg" 
          onClick={scrollToServicos}
          className="bg-white text-primary hover:bg-white/90 shadow-lg text-lg px-8 py-6 gap-2"
        >
          Ver Serviços
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};
