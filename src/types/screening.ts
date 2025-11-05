export type ScreeningSubject = {
  id?: string;
  nome_completo: string;
  documento_cpf: string;
  regiao_bairro: string;
  contato_telefone: string;
  contato_email: string;
  consentimento_pesquisa: boolean;
};

export type ScreeningTestKey = "mchat" | "assq" | "aq10";

export type ScreeningNavigationState = {
  subject: ScreeningSubject & { screening_subject_id?: string };
  testKey: ScreeningTestKey;
};
