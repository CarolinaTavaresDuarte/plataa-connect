import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

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
                  className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth"
                >
                  Início
                </button>
                <button
                  onClick={() => scrollToSection("sobre")}
                  className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth"
                >
                  Sobre
                </button>
                <button
                  onClick={() => scrollToSection("servicos")}
                  className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth"
                >
                  Serviços
                </button>
                <button
                  onClick={() => scrollToSection("como-funciona")}
                  className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth"
                >
                  Como Funciona
                </button>
                <button
                  onClick={() => scrollToSection("contato")}
                  className="hover:bg-primary-hover px-3 py-2 rounded transition-smooth"
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
