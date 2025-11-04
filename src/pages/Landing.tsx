import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { HowItWorks } from "@/components/HowItWorks";
import { Contact } from "@/components/Contact";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <Services />
      <HowItWorks />
      <Contact />
      
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 Plataa - Plataforma de Triagem e Atendimento ao Autista
          </p>
          <p className="text-xs mt-2 opacity-75">
            Todos os direitos reservados. Este site é apenas para fins educativos e de triagem.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
