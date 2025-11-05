import { useMemo, useState } from "react";
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
import { Users, FileSpreadsheet } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Props {
  user: User;
}

type RiskBadge = "Baixo" | "Moderado" | "Alto";

type PatientRow = {
  id: string;
  nome: string;
  faixaEtaria: string;
  regiao: string;
  contato: string;
  risco: RiskBadge;
  teste: string;
  data: string;
};

const chartConfig = {
  casos: {
    label: "Total de casos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const mockPatients: PatientRow[] = [
  {
    id: "1",
    nome: "Ana Beatriz Martins",
    faixaEtaria: "3-5 anos",
    regiao: "São Paulo - SP",
    contato: "(11) 98822-4411",
    risco: "Alto",
    teste: "M-CHAT-R/F",
    data: "04/09/2024",
  },
  {
    id: "2",
    nome: "João Pedro Araújo",
    faixaEtaria: "6-8 anos",
    regiao: "Campinas - SP",
    contato: "(19) 97744-1200",
    risco: "Moderado",
    teste: "ASSQ",
    data: "12/09/2024",
  },
  {
    id: "3",
    nome: "Mariana Lopes",
    faixaEtaria: "12-14 anos",
    regiao: "Belo Horizonte - MG",
    contato: "(31) 99901-2333",
    risco: "Baixo",
    teste: "ASSQ",
    data: "22/09/2024",
  },
  {
    id: "4",
    nome: "Rafael Sousa",
    faixaEtaria: "Adulto",
    regiao: "Rio de Janeiro - RJ",
    contato: "rafael.sousa@email.com",
    risco: "Moderado",
    teste: "AQ-10",
    data: "30/09/2024",
  },
  {
    id: "5",
    nome: "Laura Pereira",
    faixaEtaria: "3-5 anos",
    regiao: "Curitiba - PR",
    contato: "(41) 91234-4567",
    risco: "Baixo",
    teste: "M-CHAT-R/F",
    data: "05/10/2024",
  },
];

export const DashboardEspecialista = ({ user }: Props) => {
  const navigate = useNavigate();
  const specialistName = user.user_metadata?.nome_completo || user.email || "Especialista";

  const [riskFilter, setRiskFilter] = useState<RiskBadge | "todos">("todos");
  const [regionFilter, setRegionFilter] = useState<string | "todas">("todas");
  const [search, setSearch] = useState("");

  const regions = useMemo(() => {
    const unique = new Set(mockPatients.map((patient) => patient.regiao));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredPatients = useMemo(() => {
    return mockPatients.filter((patient) => {
      if (riskFilter !== "todos" && patient.risco !== riskFilter) {
        return false;
      }

      if (regionFilter !== "todas" && patient.regiao !== regionFilter) {
        return false;
      }

      if (search) {
        const normalizedSearch = search.toLowerCase();
        if (
          !patient.nome.toLowerCase().includes(normalizedSearch) &&
          !patient.contato.toLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [riskFilter, regionFilter, search]);

  const summary = useMemo(() => {
    const total = filteredPatients.length;
    const contagem = filteredPatients.reduce(
      (acc, patient) => {
        acc[patient.risco] = (acc[patient.risco] ?? 0) + 1;
        return acc;
      },
      { Baixo: 0, Moderado: 0, Alto: 0 } as Record<RiskBadge, number>,
    );

    return { total, ...contagem };
  }, [filteredPatients]);

  const chartData = useMemo(
    () => [
      { categoria: "Baixo risco", casos: 10 },
      { categoria: "Risco moderado", casos: 5 },
      { categoria: "Alto risco", casos: 2 },
    ],
    [],
  );

  const handleExport = () => {
    toast.success("Exportação simulada: dados enviados para /api/v1/data-export/ibge-analysis");
  };

  const handleOpenRecord = (patient: PatientRow) => {
    toast.info(`Abertura simulada da ficha de ${patient.nome}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h1 className="text-4xl font-bold text-primary mb-2">Bem-vindo, {specialistName}</h1>
            <p className="text-muted-foreground max-w-2xl">
              Visualize rapidamente a carteira de triagens, acompanhe indicadores por nível de risco e organize ações prioritárias
              com seus pacientes.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Casos ativos</CardTitle>
              <CardDescription>Total de pacientes com triagens recentes sob sua supervisão.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-foreground">{summary.total}</p>
                <p className="text-sm text-muted-foreground">Resultados filtrados nesta visão</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Exportação IBGE</CardTitle>
              <CardDescription>Dados anonimizados prontos para integração estatística.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleExport} className="w-full" variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar lista (CSV)
              </Button>
              <p className="text-xs text-muted-foreground">
                A exportação simula a chamada para <code>/api/v1/data-export/ibge-analysis</code>, respeitando o consentimento de cada triagem.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Triagens recentes</CardTitle>
              <CardDescription>Planeje seus acompanhamentos com base nas datas mais recentes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {mockPatients.slice(0, 3).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between">
                  <span>{patient.nome}</span>
                  <span className="text-xs">{patient.data}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary">Distribuição por nível de risco</CardTitle>
            <CardDescription>Dados mockados para orientar priorização de atendimento.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full overflow-x-auto">
              <BarChart data={chartData} height={260}>
                <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis dataKey="categoria" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="casos" radius={[6, 6, 0, 0]} fill="var(--color-casos)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-xl text-primary">Pacientes triados</CardTitle>
              <CardDescription>
                Carteira fictícia com filtros ativos para simular a visão final do painel profissional.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <Label htmlFor="busca" className="text-sm text-muted-foreground">
                  Buscar por nome ou contato
                </Label>
                <Input
                  id="busca"
                  placeholder="Digite para filtrar"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Filtrar por risco</Label>
                  <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value as RiskBadge | "todos") }>
                    <SelectTrigger className="w-40 mt-2">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Filtrar por região</Label>
                  <Select value={regionFilter} onValueChange={(value) => setRegionFilter(value as string | "todas") }>
                    <SelectTrigger className="w-44 mt-2">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">Baixo risco: {summary.Baixo}</Badge>
              <Badge variant="outline">Moderado: {summary.Moderado}</Badge>
              <Badge variant="outline">Alto: {summary.Alto}</Badge>
            </div>

            <div className="overflow-x-auto rounded-md border border-primary/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Nome</TableHead>
                    <TableHead>Faixa etária</TableHead>
                    <TableHead>Região/Bairro</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Último teste</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-primary/5">
                      <TableCell>{patient.nome}</TableCell>
                      <TableCell>{patient.faixaEtaria}</TableCell>
                      <TableCell>{patient.regiao}</TableCell>
                      <TableCell>{patient.contato}</TableCell>
                      <TableCell>{patient.teste}</TableCell>
                      <TableCell>
                        <Badge
                          className={`px-3 py-1 ${
                            patient.risco === "Alto"
                              ? "bg-red-100 text-red-700"
                              : patient.risco === "Moderado"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {patient.risco}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" onClick={() => handleOpenRecord(patient)}>
                          Abrir ficha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredPatients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum paciente encontrado para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Agilidade na triagem</CardTitle>
            <CardDescription>
              Utilize os dados mockados para testar fluxos de acompanhamento antes da integração completa com o backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                A tabela acima espelha o estado final da aplicação, incluindo filtros, ações e exportação de dados anonimizados.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/selecionar-teste")}>Iniciar nova triagem</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
