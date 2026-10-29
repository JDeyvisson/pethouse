# Execução do QA — Pet House

Execução iniciada em 28/10/2026. Complementa o levantamento em `QA-PLANO-EXECUCAO-2026-10-28.md`, preservado como baseline anterior às correções.

## Escopo entregue

As correções locais dos 30 itens foram implementadas. Pagamentos, assinatura e envio de e-mail permanecem em demonstração conforme instrução do responsável. Os textos de Termos de Uso e Privacidade foram criados e estão acessíveis sem login. Esta entrega não equivale a implantação ou certificação de produção.

| Itens | Implementação | Evidência principal |
|---|---|---|
| QA-01, 03, 04, 07, 22, 23 | Limites/trim; telefone nacional; CPF com dígitos verificadores; RG livre até 30; nascimento real de 1900 até hoje; enums e condições; PATCH preserva ausentes | Contratos e API; jornadas tutor/pet/anfitrião |
| QA-02, 08 | Links reais em nova aba; versão e data de aceite no servidor; documentos legais públicos | Jornada tutor e persistência de aceites |
| QA-05 | Erros de API associados ao campo correto; falha global não acusa Nome; dados preservados | Falha 500 induzida na jornada pet |
| QA-06 | CEP validado no servidor; erro de consulta visível; respostas obsoletas descartadas | API com CEP inexistente e jornada de anfitrião com serviço controlado |
| QA-09, 10 | E-mail normalizado/validado; entrada do anfitrião exige conta e papel; tokens de e-mail simulados com validade/uso único | UI e API; confirmação de posse real permanece indisponível |
| QA-11 | Parser explícito de booleanos multipart | Criar, recarregar e editar false na API/UI |
| QA-12, 13 | DTO público por allowlist; documento enviado e armazenado em pasta privada; leitura autorizada; retirada da promessa de verificação | API de upload/leitura e DTOs de anfitrião/reserva |
| QA-14, 15, 16, 29 | Papel e propriedade; preço do servidor; noites completas, compatibilidade/capacidade, locks e idempotência; transições condicionais e datas | Concorrência pela última vaga, preço adulterado e transições na API; reserva na UI |
| QA-17 | Reserva e assinatura identificadas como demonstração; nenhum cartão é cobrado; mocks desligados em produção | API e jornada de demonstração |
| QA-18 | Avaliação exige reserva concluída do tutor; host derivado/conferido; unicidade e schema | API de avaliação e repetição |
| QA-19, 20 | Guarda de autenticação, expiração central, trava/idempotência e estados de carregamento/erro | API de propriedade/idempotência e sessão inválida na UI |
| QA-21 | Limpeza explícita dos opcionais e endpoints/botões para remover imagens | Edição de RG/nascimento recarregada na API/UI; remoção de imagem revisada em código |
| QA-24 | Estados de erro e retry, preservação de formulário; falhas não representam listas vazias | Falha induzida na UI; revisão de busca/dashboard/reservas/financeiro |
| QA-25 | Alterar senha; recuperação demonstrativa; ajuda; assinatura demo; exclusão apresentada como solicitação manual | API de senha/token e UI de e-mail; exclusão automática não oferecida |
| QA-26 | Labels, nomes acessíveis, foco e mensagens; contraste nos dois temas; menu fechado fora da navegação | Axe nos formulários e páginas públicas; desktop e celular emulado |
| QA-27 | Metadados de cartão validados; erro exibido; nenhuma autorização financeira alegada | API rejeita últimos dígitos/validade inválidos |
| QA-28 | Limites e assinatura PNG/JPEG; extensão gerada; limpeza após falha | API com arquivo falsificado e acima do limite |
| QA-30 | Mensagens tipadas até 2.000 caracteres, cursor e autorização; busca paginada | Histórico com 106 mensagens, timestamps iguais e participante externo |

## Achados adicionais corrigidos durante a regressão

- Aviso global de erro cobria o botão de envio no celular: passou a ocupar espaço no documento.
- Edição de anfitrião poderia remover noites já reservadas: atualização compartilha lock com a reserva e preserva datas/capacidade comprometidas.
- Datas das reservas normalizadas para meio-dia UTC por dia de calendário, mantendo consistência entre preço e conflito.
- Dados privados do anfitrião também removidos do relacionamento retornado em reservas.
- Arquivos públicos somente são servidos enquanto referenciados como imagem pública; documentos antigos continuam bloqueados.
- Links de retorno do login restritos a caminhos internos.
- Atualizações de dependências: React Router 7, Vite 7/plugin React 5, Zod 4 e correções transitivas; tratamento de erros adaptado ao Zod 4.

## Ambiente e evidências

Windows, Node 22.14.0, PostgreSQL 16 em contêiner `pethouse-qa-20261028`, porta 55432. Banco descartável `pethouse_qa`, contas sintéticas `example.test`. API de teste 3301 e frontend 5175. O banco original do `.env` não recebeu migrações nem correções de dados.

- Frontend e backend: builds aprovados.
- `server/test/qa.test.cjs`: 21 testes aprovados, incluindo dois testes agrupadores contabilizados pelo Node.
- `tests/qa.spec.ts`: 12 cenários aprovados (6 por projeto); jornadas de tutor, pet, anfitrião, reserva/assinatura/e-mail e acessibilidade, executadas em Chromium desktop e emulação móvel.
- `npm audit`: zero vulnerabilidades conhecidas na raiz e em `server` após atualização. Resultado pontual, não garantia de ausência de vulnerabilidades.
- Auditoria somente leitura em QA: nenhum registro sinalizado pelos critérios de aceites, telefone, e-mails duplicados, CPF, documentos antigos, pets e reservas.
- Capturas em `docs/qa-evidence/`; traces e capturas de falha são gerados em `test-results/` (ignorado no Git).
- Workflow `.github/workflows/qa.yml` preparado. A execução remota do GitHub Actions ainda não ocorreu.

## Reproduzir

Requer Node 22.14 ou compatível, Docker e portas livres. Instalar com `npm ci` na raiz e `npm ci --prefix server`. Criar um PostgreSQL dedicado com banco cujo nome termine em `_qa`; os testes recusam outro sufixo. O padrão dos testes é `postgresql://postgres:qa_local_only@localhost:55432/pethouse_qa`.

No diretório `server`, com `DATABASE_URL` explicitamente apontando para esse banco de QA, executar o Prisma local: `npx prisma generate` e `npx prisma migrate deploy`. Na raiz: `npx playwright install chromium` e `npm run test:qa`.

As duas migrações adicionam aceites, versão de sessão, tokens e chaves de idempotência. Não usar reset de banco para aplicar a entrega. O servidor de teste controla CEP, e-mail e pagamento; não realiza transações financeiras nem envia mensagens.

Para demonstração local fora dos testes, configurar `MOCK_SERVICES=true` e ambiente diferente de `production`, conforme `server/.env.example`. O modo demo permite prévias de recuperação de senha, portanto destina-se exclusivamente a dados/contas de demonstração. As prévias não são prova de posse do e-mail.

## Regras adotadas

Telefone brasileiro com DDD (10/11 dígitos); RG do pet como texto livre (30); CPF obrigatório para anfitrião, validado matematicamente sem consulta de titularidade e sem imposição de exclusividade entre contas. Hospedagem por noite: check-in incluído/check-out excluído, 1–365 noites, sem passado. Capacidade “4+” é tratada como quatro vagas. Cancelamento apenas antes de iniciar; início dentro da estadia; conclusão a partir do check-out. CEP exige consulta válida; indisponibilidade retorna erro recuperável, sem inventar endereço.

## Limites e próxima etapa operacional

Homologação em dispositivos físicos/Safari/Firefox/Edge, leitor de tela real, zoom 200%, teste de carga e toda a matriz exploratória do levantamento não foram concluídos. Emulação de iPhone no Chromium não representa Safari. A varredura Axe não substitui auditoria manual de acessibilidade.

Não houve deploy, smoke em produção, cobrança, envio de e-mail real ou verificação de identidade. O fluxo de exclusão é um pedido manual via aplicativo de e-mail, sem alegar exclusão concluída. A retenção/remoção física de arquivos substituídos e a reconfirmação dos booleanos históricos exigem procedimento operacional; não é seguro inferir respostas antigas.

Antes de liberar um ambiente existente: realizar backup do banco e pastas de upload; executar `server/scripts/audit-data.cjs` com DATABASE_URL explícita; resolver achados históricos; aplicar as duas migrações; configurar URLs/segredos e ambiente; implantar frontend/backend juntos; executar smoke com contas de teste. O script de auditoria é somente leitura e não imprime dados pessoais. Rollback de código deve usar versão compatível com os campos adicionados; não remover tabelas/colunas com dados sem restauração planejada.

Para operação comercial, completar identificação do controlador, política concreta de retenção/atendimento e revisão dos textos legais; integrar fornecedores reais quando essa etapa for solicitada. Nenhuma confirmação financeira ou de identidade será simulada como real.
