import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TesteMChat from "./pages/TesteMChat";
import TesteASSQ from "./pages/TesteASSQ";
import TesteAQ10 from "./pages/TesteAQ10";
import DadosPreTeste from "./pages/DadosPreTeste";
import SelecionarTeste from "./pages/SelecionarTeste";
import NotFound from "./pages/NotFound";
import ServiceDetail from "./pages/ServiceDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dados-pre-teste" element={<DadosPreTeste />} />
        <Route path="/selecionar-teste" element={<SelecionarTeste />} />
        <Route path="/testes/mchat" element={<TesteMChat />} />
        <Route path="/testes/assq" element={<TesteASSQ />} />
        <Route path="/testes/aq10" element={<TesteAQ10 />} />
        <Route path="/services/test/:slug" element={<ServiceDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
