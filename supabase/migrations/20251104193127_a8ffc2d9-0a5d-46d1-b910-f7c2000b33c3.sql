-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('usuario', 'especialista');

-- Criar tabela de user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Criar tabela de profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Criar tabela para respostas M-CHAT-R/F (16-30 meses)
CREATE TABLE public.mchat_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idade_meses INTEGER NOT NULL CHECK (idade_meses >= 16 AND idade_meses <= 48),
  quem_responde TEXT NOT NULL CHECK (quem_responde IN ('pais', 'responsaveis')),
  aceita_compartilhar_dados BOOLEAN DEFAULT false,
  respostas JSONB NOT NULL,
  pontuacao_total INTEGER NOT NULL,
  nivel_risco TEXT NOT NULL CHECK (nivel_risco IN ('baixo', 'moderado', 'alto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela para respostas ASSQ (6-17 anos)
CREATE TABLE public.assq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idade_anos INTEGER NOT NULL CHECK (idade_anos >= 6 AND idade_anos <= 17),
  quem_responde TEXT NOT NULL CHECK (quem_responde IN ('adolescente', 'pais', 'professores')),
  respostas JSONB NOT NULL,
  pontuacao_total INTEGER NOT NULL,
  nivel_risco TEXT NOT NULL CHECK (nivel_risco IN ('baixo', 'moderado', 'alto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela para respostas AQ-10 (adultos)
CREATE TABLE public.aq10_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB NOT NULL,
  pontuacao_total INTEGER NOT NULL CHECK (pontuacao_total >= 0 AND pontuacao_total <= 10),
  triagem_positiva BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mchat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aq10_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_roles
CREATE POLICY "Usuários podem ver seu próprio role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Especialistas podem ver todos os roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- RLS Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Especialistas podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- RLS Policies para mchat_responses
CREATE POLICY "Usuários podem ver suas próprias respostas M-CHAT"
  ON public.mchat_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias respostas M-CHAT"
  ON public.mchat_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Especialistas podem ver todas as respostas M-CHAT"
  ON public.mchat_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- RLS Policies para assq_responses
CREATE POLICY "Usuários podem ver suas próprias respostas ASSQ"
  ON public.assq_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias respostas ASSQ"
  ON public.assq_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Especialistas podem ver todas as respostas ASSQ"
  ON public.assq_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- RLS Policies para aq10_responses
CREATE POLICY "Usuários podem ver suas próprias respostas AQ-10"
  ON public.aq10_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias respostas AQ-10"
  ON public.aq10_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Especialistas podem ver todas as respostas AQ-10"
  ON public.aq10_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome_completo', ''),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();