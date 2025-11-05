import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ScreeningSubject, ScreeningTestKey } from "@/types/screening";

const TEST_METADATA: Record<string, { key: ScreeningTestKey; label: string; table: string }> = {
  "/testes/mchat": { key: "mchat", label: "M-CHAT-R/F", table: "mchat_responses" },
  "/testes/assq": { key: "assq", label: "ASSQ", table: "assq_responses" },
  "/testes/aq10": { key: "aq10", label: "AQ-10", table: "aq10_responses" },
};

type FormState = {
  nome_completo: string;
  documento_cpf: string;
  regiao_bairro: string;
  contato_telefone: string;
  contato_email: string;
  consentimento_pesquisa: boolean;
};

const initialState: FormState = {
  nome_completo: "",
  documento_cpf: "",
  regiao_bairro: "",
  contato_telefone: "",
  contato_email: "",
  consentimento_pesquisa: false,
};

const sanitizeCpf = (value: string) => value.replace(/\D/g, "");

const formatCPF = (value: string) => {
  const numbers = sanitizeCpf(value);
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

const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

const storeSubjectOnSession = (testKey: ScreeningTestKey, subject: ScreeningSubject & { screening_subject_id?: string }) => {
  sessionStorage.setItem(`screening:${testKey}`, JSON.stringify(subject));
};

const DadosPreTeste = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialState);

  const testeDestino = location.state?.testeDestino as string | undefined;
  const meta = useMemo(() => (testeDestino ? TEST_METADATA[testeDestino] : undefined), [testeDestino]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Faça login para iniciar uma nova triagem.");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const cpfNumbers = sanitizeCpf(formData.documento_cpf);

    if (formData.nome_completo.trim().length < 3) {
      toast.error("Informe o nome completo do indivíduo avaliado.");
      return false;
    }

    if (cpfNumbers.length !== 11) {
      toast.error("Digite um CPF válido com 11 dígitos.");
      return false;
    }

    const phoneNumbers = formData.contato_telefone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      toast.error("Informe um telefone válido.");
      return false;
    }

    if (!emailRegex.test(formData.contato_email)) {
      toast.error("Informe um e-mail válido.");
      return false;
    }

    if (!formData.consentimento_pesquisa) {
      toast.error("É necessário aceitar o compartilhamento anônimo dos dados para continuar.");
      return false;
    }

    if (!meta) {
      toast.error("Selecione um teste válido para prosseguir.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Erro de autenticação. Faça login novamente.");
      return;
    }

    if (!validate()) {
      return;
    }

    const cpfNumbers = sanitizeCpf(formData.documento_cpf);
    const metaInfo = meta!;

    setSubmitting(true);

    try {
      const { data: existingTest, error: existingTestError } = await supabase
        .from(metaInfo.table)
        .select("id")
        .eq("documento_cpf", cpfNumbers)
        .limit(1);

      if (existingTestError) throw existingTestError;

      if (existingTest && existingTest.length > 0) {
        toast.error("Este CPF já possui uma triagem finalizada para este teste.");
        setSubmitting(false);
        return;
      }

      const upsertPayload = {
        user_id: userId,
        nome_completo: formData.nome_completo.trim(),
        documento_cpf: cpfNumbers,
        regiao_bairro: formData.regiao_bairro.trim(),
        contato_telefone: formData.contato_telefone.replace(/\D/g, ""),
        contato_email: formData.contato_email.trim().toLowerCase(),
        consentimento_pesquisa: formData.consentimento_pesquisa,
      };

      const { data: subjectRows, error: upsertError } = await supabase
        .from("screening_subjects")
        .upsert(upsertPayload, { onConflict: "user_id,documento_cpf" })
        .select()
        .eq("documento_cpf", cpfNumbers)
        .eq("user_id", userId);

      if (upsertError) throw upsertError;

      const subject = subjectRows?.[0];

      if (!subject) {
        toast.error("Não foi possível registrar os dados do indivíduo.");
        setSubmitting(false);
        return;
      }

      const subjectData: ScreeningSubject & { screening_subject_id?: string } = {
        screening_subject_id: subject.id,
        nome_completo: subject.nome_completo,
        documento_cpf: subject.documento_cpf,
        regiao_bairro: subject.regiao_bairro,
        contato_telefone: subject.contato_telefone,
        contato_email: subject.contato_email,
        consentimento_pesquisa: subject.consentimento_pesquisa,
      };

      storeSubjectOnSession(metaInfo.key, subjectData);

      toast.success("Dados de triagem salvos. Você pode iniciar o teste.");
      navigate(testeDestino ?? "/dashboard", {
        state: { subject: subjectData, testKey: metaInfo.key },
      });
    } catch (error: any) {
      console.error("Erro ao iniciar triagem:", error);
      toast.error(error.message ?? "Não foi possível salvar os dados.");
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
        <Card className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">Dados para iniciar a triagem</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Informe os dados da pessoa que será avaliada. Os campos são obrigatórios em cada nova triagem e
            vinculam o CPF avaliado ao seu usuário para acompanhamento no dashboard.
          </p>

          <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Regra de unicidade:</strong> cada CPF pode realizar <strong>uma</strong> triagem por tipo de teste.
            </p>
            <p>
              Você está iniciando {meta ? <strong>{meta.label}</strong> : "uma avaliação"}. Em caso de dúvida, retorne à
              seleção de testes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome_completo}
                  onChange={(e) => handleChange("nome_completo", e.target.value)}
                  placeholder="Nome e sobrenome"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF do avaliado *</Label>
                <Input
                  id="cpf"
                  value={formData.documento_cpf}
                  onChange={(e) => handleChange("documento_cpf", formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <Label htmlFor="regiao">Região/Bairro *</Label>
                <Input
                  id="regiao"
                  value={formData.regiao_bairro}
                  onChange={(e) => handleChange("regiao_bairro", e.target.value)}
                  placeholder="Ex: Zona Sul - São Paulo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone para contato *</Label>
                <Input
                  id="telefone"
                  value={formData.contato_telefone}
                  onChange={(e) => handleChange("contato_telefone", formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail principal *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) => handleChange("contato_email", e.target.value)}
                  placeholder="contato@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
              <Checkbox
                id="consentimento"
                checked={formData.consentimento_pesquisa}
                onCheckedChange={(checked) => handleChange("consentimento_pesquisa", !!checked)}
              />
              <Label htmlFor="consentimento" className="text-sm leading-relaxed text-muted-foreground">
                ✅ Aceito compartilhar os dados desta avaliação de forma anônima para fins de pesquisa.
              </Label>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/selecionar-teste")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Salvando..." : "Continuar para o teste"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default DadosPreTeste;
