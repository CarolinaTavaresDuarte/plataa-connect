-- Adiciona colunas de consentimento explícito em todas as respostas de testes
ALTER TABLE public.mchat_responses
  ADD COLUMN IF NOT EXISTS consentimento_pesquisa BOOLEAN DEFAULT false;

ALTER TABLE public.assq_responses
  ADD COLUMN IF NOT EXISTS consentimento_pesquisa BOOLEAN DEFAULT false;

ALTER TABLE public.aq10_responses
  ADD COLUMN IF NOT EXISTS consentimento_pesquisa BOOLEAN DEFAULT false;

-- Alinha registros existentes utilizando o campo antigo do M-CHAT, quando disponível
UPDATE public.mchat_responses
SET consentimento_pesquisa = COALESCE(consentimento_pesquisa, aceita_compartilhar_dados)
WHERE consentimento_pesquisa IS NULL;
