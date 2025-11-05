import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DadosPreTeste = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    documento_cpf: "",
    regiao_bairro: "",
    contato_telefone: "",
  });

  const testeDestino = location.state?.testeDestino || "/dashboard";

  useEffect(() => {
    checkUserAndProfile();
  }, []);

  const checkUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Você precisa estar logado");
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Verificar se já tem os dados preenchidos
    const { data: profile } = await supabase
      .from("profiles")
      .select("documento_cpf, regiao_bairro, contato_telefone, teste_realizado")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.documento_cpf && profile?.regiao_bairro && profile?.contato_telefone) {
      // Já tem os dados, verificar se já fez teste
      if (profile.teste_realizado) {
        toast.error("Você já realizou uma triagem anteriormente");
        navigate("/dashboard");
        return;
      }
      // Tem os dados mas não fez teste, redirecionar
      navigate(testeDestino);
      return;
    }

    setLoading(false);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Erro de autenticação");
      return;
    }

    // Validar CPF (11 dígitos)
    const cpfNumbers = formData.documento_cpf.replace(/\D/g, "");
    if (cpfNumbers.length !== 11) {
      toast.error("CPF inválido. Digite 11 dígitos.");
      return;
    }

    // Validar telefone (10 ou 11 dígitos)
    const phoneNumbers = formData.contato_telefone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast.error("Telefone inválido");
      return;
    }

    setSubmitting(true);

    try {
      // Verificar se o CPF já está sendo usado
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id, teste_realizado")
        .eq("documento_cpf", cpfNumbers)
        .single();

      if (existingProfile && existingProfile.user_id !== userId) {
        toast.error("Este CPF já está cadastrado no sistema");
        setSubmitting(false);
        return;
      }

      if (existingProfile && existingProfile.teste_realizado) {
        toast.error("Este CPF já realizou uma triagem anteriormente");
        setSubmitting(false);
        return;
      }

      // Atualizar o perfil
      const { error } = await supabase
        .from("profiles")
        .update({
          documento_cpf: cpfNumbers,
          regiao_bairro: formData.regiao_bairro,
          contato_telefone: phoneNumbers,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Dados salvos com sucesso!");
      navigate(testeDestino);
    } catch (error: any) {
      console.error("Erro ao salvar dados:", error);
      toast.error("Erro ao salvar dados: " + error.message);
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

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-2xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-2">Dados para Triagem</h1>
          <p className="text-muted-foreground mb-6">
            Antes de iniciar o teste, precisamos coletar alguns dados básicos.
            Estas informações são necessárias para garantir a unicidade da triagem.
          </p>

          <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6">
            <p className="text-sm">
              <strong>Importante:</strong> Cada CPF pode realizar a triagem apenas uma única vez.
              Seus dados serão tratados com confidencialidade.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                value={formData.documento_cpf}
                onChange={(e) =>
                  setFormData({ ...formData, documento_cpf: formatCPF(e.target.value) })
                }
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div>
              <Label htmlFor="bairro">Região/Bairro *</Label>
              <Input
                id="bairro"
                type="text"
                value={formData.regiao_bairro}
                onChange={(e) =>
                  setFormData({ ...formData, regiao_bairro: e.target.value })
                }
                placeholder="Ex: Centro, Zona Sul..."
                required
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone para Contato *</Label>
              <Input
                id="telefone"
                type="text"
                value={formData.contato_telefone}
                onChange={(e) =>
                  setFormData({ ...formData, contato_telefone: formatPhone(e.target.value) })
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Salvando..." : "Continuar para o Teste"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default DadosPreTeste;
