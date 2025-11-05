import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/landing") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["inicio", "sobre", "servicos", "como-funciona", "contato"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.2 },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-elegant backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:opacity-80 transition-smooth">
            Plataa
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <button
                  onClick={() => scrollToSection("inicio")}
                  className={`px-3 py-2 rounded transition-smooth hover:bg-[#0056b3] ${
                    activeSection === "inicio" ? "bg-[#0056b3]" : ""
                  }`}
                >
                  Início
                </button>
                <button
                  onClick={() => scrollToSection("sobre")}
                  className={`px-3 py-2 rounded transition-smooth hover:bg-[#0056b3] ${
                    activeSection === "sobre" ? "bg-[#0056b3]" : ""
                  }`}
                >
                  Sobre
                </button>
                <button
                  onClick={() => scrollToSection("servicos")}
                  className={`px-3 py-2 rounded transition-smooth hover:bg-[#0056b3] ${
                    activeSection === "servicos" ? "bg-[#0056b3]" : ""
                  }`}
                >
                  Serviços
                </button>
                <button
                  onClick={() => scrollToSection("como-funciona")}
                  className={`px-3 py-2 rounded transition-smooth hover:bg-[#0056b3] ${
                    activeSection === "como-funciona" ? "bg-[#0056b3]" : ""
                  }`}
                >
                  Como Funciona
                </button>
                <button
                  onClick={() => scrollToSection("contato")}
                  className={`px-3 py-2 rounded transition-smooth hover:bg-[#0056b3] ${
                    activeSection === "contato" ? "bg-[#0056b3]" : ""
                  }`}
                >
                  Contato
                </button>
                <Button variant="secondary" onClick={() => navigate("/auth")} className="shadow-md">
                  Entrar
                </Button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth">
                  Dashboard
                </Link>
                <Button variant="secondary" onClick={handleLogout} className="shadow-md">
                  Sair
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
