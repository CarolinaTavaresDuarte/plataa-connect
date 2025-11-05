-- Adicionar campos de dados pessoais ao perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS documento_cpf TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS regiao_bairro TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone TEXT;

-- Adicionar campo para controlar se o usuário já fez teste
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS teste_realizado BOOLEAN DEFAULT false;

-- Adicionar índice para busca por CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(documento_cpf);

-- Atualizar política para permitir usuários atualizarem seus dados
CREATE POLICY "Usuários podem completar seus dados pessoais"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);