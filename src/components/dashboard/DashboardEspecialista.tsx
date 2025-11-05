import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Download, Users, BarChart3, ClipboardList, FileSpreadsheet } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  user: User;
}

type PatientRow = {
  id: string;
  nome: string;
  regiao: string | null;
  contatoTelefone: string | null;
  contatoEmail: string | null;
  documentoCpf: string | null;
  risco: RiskBadge;
  teste: string;
  data: string;
};

type RiskBadge = "Baixo" | "Moderado" | "Alto";

const chartConfig = {
  casos: {
    label: "Total de casos",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const DashboardEspecialista = ({ user }: Props) => {
  const navigate = useNavigate();
  const specialistName = user.user_metadata?.nome_completo || user.email || "Especialista";
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [riskFilter, setRiskFilter] = useState<RiskBadge | "todos">("todos");
  const [regionFilter, setRegionFilter] = useState<string | "todas">("todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome_completo, regiao_bairro, contato_telefone, email, documento_cpf")
        .order("nome_completo", { ascending: true });

      if (profilesError) {
        setLoading(false);
        return;
      }

      const [mchatRes, assqRes, aq10Res] = await Promise.all([
        supabase
          .from("mchat_responses")
          .select("user_id, created_at, nivel_risco")
          .order("created_at", { ascending: false }),
        supabase
          .from("assq_responses")
          .select("user_id, created_at, nivel_risco")
          .order("created_at", { ascending: false }),
        supabase
          .from("aq10_responses")
          .select("user_id, created_at, triagem_positiva")
          .order("created_at", { ascending: false }),
      ]);

      const latestByUser = new Map<string, { risco: RiskBadge; teste: string; data: string }>();

      const registerResult = (
        userId: string,
        teste: string,
        nivel: string | boolean,
        createdAt: string,
      ) => {
        const existing = latestByUser.get(userId);
        if (existing && new Date(existing.data) > new Date(createdAt)) {
          return;
        }

        latestByUser.set(userId, {
          risco: mapRisk(nivel),
          teste,
          data: createdAt,
        });
      };

      mchatRes?.forEach((item) => registerResult(item.user_id, "M-CHAT-R/F", item.nivel_risco, item.created_at));
      assqRes?.forEach((item) => registerResult(item.user_id, "ASSQ", item.nivel_risco, item.created_at));
      aq10Res?.forEach((item) => registerResult(item.user_id, "AQ-10", item.triagem_positiva, item.created_at));

      const rows: PatientRow[] =
        profiles?.map((profile) => {
          const latest = latestByUser.get(profile.user_id);
          return {
            id: profile.user_id,
            nome: profile.nome_completo,
            regiao: profile.regiao_bairro,
            contatoTelefone: profile.contato_telefone,
            contatoEmail: profile.email,
            documentoCpf: profile.documento_cpf,
            risco: latest?.risco ?? "Baixo",
            teste: latest?.teste ?? "—",
            data: latest ? new Date(latest.data).toLocaleDateString("pt-BR") : "—",
          };
        }) ?? [];

      setPatients(rows);
      setLoading(false);
    };

    loadData();
  }, []);

  const regions = useMemo(() => {
    const all = new Set<string>();
    patients.forEach((patient) => {
      if (patient.regiao) {
        all.add(patient.regiao);
      }
    });
    return Array.from(all).sort((a, b) => a.localeCompare(b));
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (riskFilter !== "todos" && patient.risco !== riskFilter) {
        return false;
      }

      if (regionFilter !== "todas" && patient.regiao !== regionFilter) {
        return false;
      }

      if (
        search &&
        !patient.nome.toLowerCase().includes(search.toLowerCase()) &&
        !(patient.documentoCpf || "").includes(search)
      ) {
        return false;
      }

      return true;
    });
  }, [patients, riskFilter, regionFilter, search]);

  const summary = useMemo(() => {
    const total = filteredPatients.length;
    const porRisco = filteredPatients.reduce(
      (acc, patient) => {
        acc[patient.risco] = (acc[patient.risco] ?? 0) + 1;
        return acc;
      },
      { Baixo: 0, Moderado: 0, Alto: 0 } as Record<RiskBadge, number>,
    );

    return {
      total,
      baixo: porRisco.Baixo,
      moderado: porRisco.Moderado,
      alto: porRisco.Alto,
    };
  }, [filteredPatients]);

  const chartData = useMemo(
    () => [
      { categoria: "Baixo risco", casos: summary.baixo },
      { categoria: "Risco moderado", casos: summary.moderado },
      { categoria: "Alto risco", casos: summary.alto },
    ],
    [summary],
  );

  const handleExport = () => {
    const header = [
      "Nome",
      "Região",
      "Contato",
      "Email",
      "CPF",
      "Último teste",
      "Data",
      "Nível de risco",
    ];

    const csv = [
      header.join(";"),
      ...filteredPatients.map((patient) =>
        [
          patient.nome,
          patient.regiao ?? "",
          patient.contatoTelefone ?? "",
          patient.contatoEmail ?? "",
          patient.documentoCpf ?? "",
          patient.teste,
          patient.data,
          patient.risco,
        ].join(";"),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pacientes-triados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Gerenciamento de Triagens</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {specialistName}. Acesse todas as triagens da sua carteira com transparência e filtros inteligentes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Pacientes acompanhados" value={summary.total} icon={Users} />
          <SummaryCard title="Baixo risco" value={summary.baixo} icon={BarChart3} color="text-green-600" />
          <SummaryCard title="Risco moderado" value={summary.moderado} icon={ClipboardList} color="text-yellow-600" />
          <SummaryCard title="Alto risco" value={summary.alto} icon={FileSpreadsheet} color="text-red-600" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Distribuição de risco</CardTitle>
            <CardDescription>
              Visualize como os resultados das triagens estão distribuídos na sua carteira de pacientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="min-h-[260px]" config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="categoria" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="casos" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl text-primary">Tabela de pacientes triados</CardTitle>
                <CardDescription>Filtre por risco, região ou busque diretamente pelo nome/CPF.</CardDescription>
              </div>
              <Button onClick={handleExport} className="w-full lg:w-auto">
                <Download className="mr-2 h-4 w-4" /> Exportar lista (CSV)
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as RiskBadge | "todos") }>
                <SelectTrigger>
                  <SelectValue placeholder="Filtro por risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os riscos</SelectItem>
                  <SelectItem value="Baixo">Baixo risco</SelectItem>
                  <SelectItem value="Moderado">Risco moderado</SelectItem>
                  <SelectItem value="Alto">Alto risco</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={(value) => setRegionFilter(value as string | "todas") }>
                <SelectTrigger>
                  <SelectValue placeholder="Filtro por região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as regiões</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por nome ou CPF"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome completo</TableHead>
                  <TableHead>Região/Bairro</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Último teste</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum paciente encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-primary/5">
                      <TableCell className="font-semibold">{patient.nome}</TableCell>
                      <TableCell>{patient.regiao ?? "—"}</TableCell>
                      <TableCell>{patient.contatoTelefone ?? "—"}</TableCell>
                      <TableCell>{patient.contatoEmail ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{patient.teste}</span>
                          <span className="text-xs text-muted-foreground">{patient.data}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeColor(patient.risco)}>{patient.risco}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/especialista/pacientes/${patient.id}`)}
                        >
                          Abrir ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

type SummaryCardProps = {
  title: string;
  value: number;
  icon: typeof Users;
  color?: string;
};

const SummaryCard = ({ title, value, icon: Icon, color }: SummaryCardProps) => (
  <Card>
    <CardContent className="flex items-center gap-4 py-6">
      <div className={`rounded-full bg-primary/10 p-3 ${color ?? "text-primary"}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

function mapRisk(value: string | boolean): RiskBadge {
  if (typeof value === "boolean") {
    return value ? "Alto" : "Baixo";
  }

  const normalized = value.toLowerCase();
  if (normalized.includes("alto")) return "Alto";
  if (normalized.includes("moder")) return "Moderado";
  return "Baixo";
}

function badgeColor(risk: RiskBadge) {
  if (risk === "Baixo") return "bg-green-100 text-green-700";
  if (risk === "Moderado") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}
