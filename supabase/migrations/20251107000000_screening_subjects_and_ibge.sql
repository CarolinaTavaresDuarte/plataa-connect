-- Tabela para armazenar dados dos indivíduos avaliados por usuários logados
CREATE TABLE IF NOT EXISTS public.screening_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_completo TEXT NOT NULL,
  documento_cpf TEXT NOT NULL,
  regiao_bairro TEXT NOT NULL,
  contato_telefone TEXT NOT NULL,
  contato_email TEXT NOT NULL,
  consentimento_pesquisa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, documento_cpf)
);

CREATE INDEX IF NOT EXISTS idx_screening_subjects_user ON public.screening_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_subjects_cpf ON public.screening_subjects(documento_cpf);

ALTER TABLE public.screening_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode gerenciar seus indivíduos avaliados"
  ON public.screening_subjects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Especialistas podem visualizar indivíduos avaliados"
  ON public.screening_subjects FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- Atualiza automaticamente o updated_at
CREATE TRIGGER update_screening_subjects_updated_at
  BEFORE UPDATE ON public.screening_subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adiciona relacionamento das respostas com o CPF e o indivíduo testado
ALTER TABLE public.mchat_responses
  ADD COLUMN IF NOT EXISTS screening_subject_id UUID REFERENCES public.screening_subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documento_cpf TEXT;

ALTER TABLE public.assq_responses
  ADD COLUMN IF NOT EXISTS screening_subject_id UUID REFERENCES public.screening_subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documento_cpf TEXT;

ALTER TABLE public.aq10_responses
  ADD COLUMN IF NOT EXISTS screening_subject_id UUID REFERENCES public.screening_subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS documento_cpf TEXT;

UPDATE public.mchat_responses
SET documento_cpf = COALESCE(documento_cpf, 'LEGACY-' || id::text)
WHERE documento_cpf IS NULL;

UPDATE public.assq_responses
SET documento_cpf = COALESCE(documento_cpf, 'LEGACY-' || id::text)
WHERE documento_cpf IS NULL;

UPDATE public.aq10_responses
SET documento_cpf = COALESCE(documento_cpf, 'LEGACY-' || id::text)
WHERE documento_cpf IS NULL;

ALTER TABLE public.mchat_responses
  ALTER COLUMN documento_cpf SET NOT NULL;

ALTER TABLE public.assq_responses
  ALTER COLUMN documento_cpf SET NOT NULL;

ALTER TABLE public.aq10_responses
  ALTER COLUMN documento_cpf SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mchat_responses_documento_cpf ON public.mchat_responses(documento_cpf);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assq_responses_documento_cpf ON public.assq_responses(documento_cpf);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aq10_responses_documento_cpf ON public.aq10_responses(documento_cpf);

-- Registros anonimizados para análise (ex. envio ao IBGE)
CREATE TABLE IF NOT EXISTS public.ibge_analysis_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  id_teste_anonimo UUID NOT NULL DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL,
  faixa_etaria TEXT,
  regiao_geografica TEXT,
  score_bruto NUMERIC,
  consentimento_pesquisa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ibge_analysis_owner ON public.ibge_analysis_records(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_ibge_analysis_test_type ON public.ibge_analysis_records(test_type);

ALTER TABLE public.ibge_analysis_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário registra dados para análise"
  ON public.ibge_analysis_records FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Especialistas visualizam dados agregados"
  ON public.ibge_analysis_records FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));
