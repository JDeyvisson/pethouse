# Levantamento de QA e plano de execução — Pet House

Data: 28/10/2026. Escopo: tutor, anfitrião, autenticação, pets, busca, reservas, pagamentos, avaliações, chat, perfil, configurações e estados de interface.

## 1. Método e limites

Auditoria do código React/TypeScript, rotas Express, schemas Zod, serviços, repositórios e modelo Prisma. Foram executados os builds de frontend e backend e sondagens locais dos schemas compilados, sem gravar no banco. Ambos os builds passaram.

**C** = confirmado por leitura do caminho de código; **R** = reproduzido executando o schema local; **H** = hipótese que exige teste integrado ou visual. Confirmação por código não significa reprodução em produção.

Não foram executados testes ponta a ponta em navegador, testes com banco, pagamentos reais, envio de e-mails ou consultas externas de identidade. Responsividade, contraste, leitor de tela, concorrência e comportamento em produção continuam pendentes. Este é um levantamento técnico amplo e um plano de homologação, não uma certificação de ausência de outros bugs.

Nenhuma correção funcional foi aplicada nesta etapa. Não foram encontradas suítes ou scripts de teste nos manifests analisados. Uma pasta não rastreada já existente em `server/` foi preservada.

Prioridades: **P0** = bloqueador de liberação por exposição de dados ou integridade operacional; **P1** = fluxo principal incorreto; **P2** = experiência, robustez e funcionalidades secundárias. Prioridade não é estimativa de esforço.

## 2. Rastreabilidade da lista inicial

| Solicitação | Resultado da análise | IDs |
|---|---|---|
| Limitar telefone do tutor | Cadastro aceita texto sem tamanho máximo; servidor aceita qualquer string. Corrigir também edição de perfil e contatos de emergência. | QA-01, QA-23 |
| Link de LGPD/privacidade | Termos e política são `span`; não existem rotas correspondentes no roteador analisado. | QA-02 |
| Limitar RG e nascimento do pet | RG sem limite; nascimento sem limite de calendário/validação real. `maxLength` sozinho não resolve um campo `date`. | QA-03, QA-04 |
| Retorno no campo NOME do pet | Qualquer exceção de envio é atribuída a `errors.nome`, inclusive erro de servidor. | QA-05 |
| Validar CEP e autenticar CPF | CEP tem máscara/formato, mas falhas de consulta são silenciosas; CPF só tem contagem de dígitos no cliente e é opcional no servidor. | QA-06, QA-07 |
| Termos clicáveis do anfitrião | Mesmo problema dos termos do cadastro geral. Aceites também não são persistidos. | QA-02, QA-08 |
| E-mail errado no cadastro | Servidor já rejeita formato inválido; cadastro geral avança sem validar formato. Não existe confirmação de posse do e-mail. Cadastro direto de anfitrião tem um bloqueio adicional de autenticação. | QA-09, QA-10 |

CPF com dígitos verificadores corretos não comprova identidade ou titularidade. E-mail com sintaxe correta não comprova que a caixa existe ou pertence ao usuário. O plano separa essas capacidades.

## 3. Backlog de problemas

As referências são caminhos relativos à raiz do repositório; as linhas indicam o ponto principal de investigação.

| ID / prioridade / evidência | Problema, impacto e cenário de reprodução | Local principal | Correção e critério de aceite |
|---|---|---|---|
| QA-01 · P1 · C/R | Telefone do tutor sem limite/normalização; schema aceita 200 letras. Nome de usuário só com espaços também passa. | `src/pages/Cadastrar.tsx:84`; `server/src/schemas/auth.schema.ts:3` | Contrato único em criação/edição: trim de nome, limites e telefone nacional de 10/11 dígitos, se confirmado esse escopo. Inválidos retornam 400 com campo; colagem e teclado têm o mesmo resultado. |
| QA-02 · P1 · C | Termos e privacidade aparentam links, mas são texto em ambos os cadastros; não há páginas legais nas rotas. | `src/pages/Cadastrar.tsx:335`; `src/pages/CadastroAnfitriao.tsx:1060`; `src/routes.tsx` | Publicar conteúdo fornecido/aprovado pelo responsável e usar links reais acessíveis sem login. Abrir documento não pode marcar aceite nem perder formulário. |
| QA-03 · P1 · C/R | RG do pet aceita string de 1.000 caracteres. Nome, raça e outros textos não têm limites; nome só com espaços passa no cliente e servidor. | `src/pages/CadastroPet.tsx:330`; `server/src/schemas/pet.schema.ts:6` | Definir o registro aceito e seu tamanho, sem assumir regra de RG humano. Trim e limites compartilhados; aceitar nomes com acentos e pontuação legítima. Testar N−1/N/N+1. |
| QA-04 · P1 · R | Nascimento futuro passa; texto `invalid` produz `Invalid Date`, mas `safeParse` retorna sucesso. Pode chegar à persistência como erro interno. | `server/src/schemas/pet.schema.ts:12`; `src/pages/CadastroPet.tsx:483` | Validar formato ISO de data, existência no calendário e data não futura, com regra de fuso explícita. Data vazia continua opcional; erro atribuído ao campo. |
| QA-05 · P1 · C | Falha de rede/API/upload no cadastro de pet aparece como erro de Nome; `ApiError.fields` é ignorado. | `src/pages/CadastroPet.tsx:432` | Mapear `name→nome`, `birthDate→dataNascimento` etc.; erro global para rede/500, mantendo dados e levando foco ao erro relevante. |
| QA-06 · P1 · C/R | CEP inexistente de 8 dígitos passa na API; ViaCEP com `erro` ou indisponível não gera feedback. Respostas antigas podem sobrescrever endereço de CEP mais recente. | `src/pages/Cadastrar.tsx:98`; `src/pages/CadastroAnfitriao.tsx:526`; `server/src/schemas/host.schema.ts:4` | Separar formato inválido, não encontrado e serviço indisponível; cancelar/descartar consulta obsoleta. Definir fallback manual e registrar origem; não representar consulta de CEP como prova de residência. |
| QA-07 · P1 · R | CPF `11111111111` é aceito pelo schema; cliente exige apenas 11 dígitos. Ausência de CPF também é permitida no servidor. | `src/pages/CadastroAnfitriao.tsx:604`; `server/src/schemas/host.schema.ts` | Normalização, dígitos verificadores e rejeição de repetidos nas duas camadas. Definir obrigatoriedade/unicidade. Verificação de titularidade é integração separada, se requerida. |
| QA-08 · P1 · C/R | Aceites ficam só no estado React; API aceita cadastro sem aceite e banco não guarda versão/data dos termos. | `src/pages/Cadastrar.tsx:145`; `src/pages/CadastroAnfitriao.tsx:626`; `server/prisma/schema.prisma` | Contrato de aceite validado no servidor e registro versionado com data do servidor. Separar aceitação contratual de consentimentos opcionais conforme conteúdo aprovado. |
| QA-09 · P1 · C/R | Cadastro geral só verifica e-mail não vazio antes de avançar; Zod rejeita formato inválido apenas no envio final. Não há normalização nem fluxo de confirmação de posse. | `src/pages/Cadastrar.tsx:84`; `server/src/schemas/auth.schema.ts`; `server/src/services/auth.service.ts` | Validar ao avançar, política consistente de normalização/unicidade e mensagens por campo. Para posse: token com prazo, uso único e reenvio limitado. Não acusar endereço sintaticamente válido de inexistente sem confirmação. |
| QA-10 · P1 · C | `/cadastro-anfitriao` é público e oferece campos de conta, mas o envio só chama `/hosts`, que exige token e papel CUIDADOR. Visitante preenche tudo para receber 401; tutor autenticado recebe 403. | `src/pages/CadastroAnfitriao.tsx:569,612`; `src/routes.tsx`; `server/src/routes/hosts.routes.ts` | Unificar entrada de cadastro/login e continuação do perfil. Visitante deve ser encaminhado antes do formulário longo ou ter conta criada em fluxo explícito. Tutor deve receber orientação antes de preencher. Tratar conta criada com perfil ainda pendente. |
| QA-11 · P0 · R | `z.coerce.boolean()` converte string `"false"` em `true`. FormData envia exatamente essa string. Vacinas, medicamentos, castração, quintal, crianças e outros dados ficam incorretos. | `src/pages/CadastroPet.tsx:399`; `src/pages/CadastroAnfitriao.tsx:633`; schemas de pet/anfitrião | Parser explícito para booleanos JSON e strings permitidas no multipart; rejeitar demais entradas. Criar e editar com “não”, recarregar e conferir false no banco/UI. Auditar dados antigos sem inverter todos cegamente. |
| QA-12 · P0 · C | GET público de anfitriões retorna todos os campos escalares do perfil, inclusive CPF e URL de documento quando preenchidos, além de e-mail, telefone e endereço detalhado. Documentos compartilham `/uploads` estático público. | `server/src/routes/hosts.routes.ts:26`; `server/src/repositories/host.repository.ts:11,30`; `server/src/app.ts:23`; `server/prisma/schema.prisma:138` | DTO público por allowlist, DTO privado separado; armazenar documentos em área privada e autorizar leitura. Testes sem login não recebem dados restritos nem conseguem baixar documento por URL. Verificar exposição real em ambiente autorizado. |
| QA-13 · P1 · C | Upload de identidade cria apenas `docPreview`; arquivo não é anexado ao FormData. Tela promete confirmação em 24h, mas modelo não tem estado de verificação. | `src/pages/CadastroAnfitriao.tsx:521,626,1006` | Guardar/enviar File, validar tipo/tamanho, definir frente/verso e acompanhar estado real. Ajustar promessa ao processo existente. Implementar somente após proteção de QA-12. |
| QA-14 · P0 · C | Reserva aceita `petId` sem conferir dono, `price` informado pelo cliente e não restringe criação por papel. Um usuário autenticado pode tentar reservar pet alheio e definir preço positivo arbitrário. | `server/src/services/reserva.service.ts:15`; `server/src/repositories/reserva.repository.ts:28`; `server/src/routes/reservas.routes.ts` | Exigir tutor, propriedade do pet e anfitrião elegível; recalcular total no servidor com política de diárias. API rejeita IDs alheios e ignora/rejeita total adulterado. |
| QA-15 · P0 · C | Reserva não verifica datas passadas, disponibilidade de todo período, capacidade, conflito do pet ou compatibilidade. Sem transação de ocupação, há risco de sobrelotação concorrente. | `server/src/services/reserva.service.ts:15`; `server/src/schemas/reserva.schema.ts` | Verificar todas as noites e regras em operação atômica; idempotência e controle de capacidade. Duas solicitações simultâneas para última vaga não podem ambas consumir a vaga. |
| QA-16 · P1 · C | Calendário permite início=fim e mostra uma diária; API exige término posterior. Datas intermediárias indisponíveis também não são verificadas pelo seletor. | `src/pages/PerfilSitter.tsx:144,182,203`; `server/src/services/reserva.service.ts:18` | Definir hospedagem por noite versus diária no mesmo dia e alinhar cálculo/seleção/API. Testar fim de mês, ano e lacuna de disponibilidade. |
| QA-17 · P0 · C | Checkout chama só criação de reserva e exibe sucesso; não confirma pagamento. Assinatura ativa por POST autenticado sem confirmação financeira. | `src/pages/PerfilSitter.tsx:203`; `src/pages/Dashboard.tsx:51,64`; `server/src/routes/subscriptions.routes.ts:18` | Definir se produto é demonstrativo ou transacional. Para cobrança: provedor, estados pendente/pago/falhou/estornado e webhook autenticado/idempotente; sucesso só após confirmação. Em demo, comunicar simulação e impedir cobrança aparente. |
| QA-18 · P1 · C | Avaliação sem reserva é permitida; com reserva, não há conferência de que `hostId` corresponde ao anfitrião daquela reserva. Corpo chega ao serviço sem schema. | `server/src/controllers/review.controller.ts:15`; `server/src/services/review.service.ts:41` | Exigir reserva concluída do tutor, derivar host da reserva e validar inteiro 1–5/comentário. Uma avaliação por reserva, incluindo concorrência. |
| QA-19 · P1 · C | Rotas internas não exigem usuário: RoleGuard só bloqueia papel quando `user` existe; layout não verifica login. Token expirado não tem tratamento central de 401. | `src/routes.tsx:24`; `src/layouts/AppLayout.tsx`; `src/lib/api.ts`; `src/context/AuthContext.tsx` | AuthGuard e fluxo de expiração com retorno ao destino após login; limpar sessão inválida. Isso é falha de navegação/sessão, não prova de bypass da autenticação da API. |
| QA-20 · P1 · C | Pet pode ser enviado repetidamente: handler sem trava de envio. Falha ao carregar edição é ignorada e deixa formulário vazio utilizável. | `src/pages/CadastroPet.tsx:240,285,376` | Estado loading/error para leitura; bloquear salvar antes de carregar; retry e estado not-found/forbidden. Trava de envio e idempotência contra duplicidade. |
| QA-21 · P1 · C | Limpar RG, nascimento ou outros opcionais na edição omite a chave do FormData; atualização parcial mantém valor anterior. Fotos do anfitrião só são atualizadas se array tem itens. | `src/pages/CadastroPet.tsx:396`; `server/src/controllers/pet.controller.ts`; `server/src/services/host.service.ts:30` | Distinguir ausente (preservar), null (limpar) e valor novo; comando explícito para remoção de imagem. Recarregar confirma remoção. |
| QA-22 · P1 · R/C | JSON malformado nos arrays do anfitrião lança SyntaxError e termina em 500; arrays vazios e opções arbitrárias passam. Regras condicionais exigidas na UI são opcionais na API. | `server/src/schemas/host.schema.ts`; `server/src/schemas/pet.schema.ts`; `server/src/middleware/error.ts` | Parse seguro, enums, mínimo de itens, limites e refinamentos condicionais. Requisição malformada retorna 400 controlado; manter equivalência cliente/servidor. |
| QA-23 · P1 · C | PATCH de perfil sem telefone atribui `null`, mesmo quando a intenção é alterar só nome. Tipos e limites não são validados por schema. | `server/src/routes/dashboard.routes.ts:24` | Schema parcial preserva campos ausentes e permite limpeza explícita. Atualizar só nome deve manter telefone. |
| QA-24 · P1 · C | Erros viram listas vazias/zeros em reservas, busca, financeiro e dashboard; salvar espaço falha silenciosamente. Usuário pode interpretar indisponibilidade como ausência de dados. | `src/context/ReservasContext.tsx:65`; `src/pages/Buscar.tsx:113`; `src/pages/Financeiro.tsx:30,111`; `src/pages/PerfilAnfitriao.tsx:325` | Separar loading, empty, error e success; retry contextual e preservação de dados anteriores. Nunca exibir sucesso após falha. |
| QA-25 · P1 · C | Recuperar/alterar senha são botões sem implementação. Configurações também mostra gerenciar assinatura, ajuda e confirmação de exclusão sem ação; “última alteração há 3 meses” e “plano gratuito” são textos fixos. | `src/pages/Login.tsx:120`; `src/pages/Perfil.tsx:328`; `src/pages/Configuracoes.tsx:58` | Implementar fluxos e estados reais ou remover promessa de função disponível. Exclusão exige regras para reservas/dados e confirmação; QA só executa em contas descartáveis. |
| QA-26 · P2 · C | Muitos labels do cadastro geral/anfitrião não têm associação com input; botões de mostrar senha sem nome acessível; rolar até erro não transfere foco. | `src/pages/Cadastrar.tsx:239`; `src/pages/CadastroAnfitriao.tsx:712`; `src/pages/CadastroPet.tsx:383` | id/htmlFor, nomes acessíveis, aria-invalid/describedby, resumo anunciado e foco. Homologar por teclado e leitor de tela. |
| QA-27 · P2 · C | Cartões aceitam `last4` com quatro letras e validade sem validação de mês/vencimento. Falha ao salvar cartão pode ser ignorada no cadastro/perfil. | `server/src/controllers/payment-card.controller.ts:6`; `src/pages/Cadastrar.tsx:170`; `src/pages/Perfil.tsx:136` | Validar metadados e mostrar erro; se houver cobrança, tokenizar pelo provedor. Metadados não devem ser apresentados como cartão autorizado para pagamento. |
| QA-28 · P2 · C | Limite de upload gera MulterError sem tradução específica; extensão vem do nome original e filtro só confia no MIME declarado. Arquivo é escrito antes da validação/persistência, com risco de órfãos em falha. | `server/src/middleware/upload.ts`; `server/src/middleware/error.ts`; controllers de upload | Erros de tamanho/quantidade controlados; verificar conteúdo e extensão gerada, limpar temporários em falha. Testar 5 MB e acima, MIME divergente e erro após upload. |
| QA-29 · P1 · C | Transições de reserva leem status e depois atualizam sem condição atômica; iniciar/concluir não verifica janela temporal. Cancelar reserva em andamento é permitido pela regra atual. | `server/src/services/reserva.service.ts:22`; `server/src/repositories/reserva.repository.ts:31` | Definir política de cancelamento/início/fim e implementar máquina de estados com update condicional. Corridas entre cancelar/iniciar/concluir devem resultar em estado único e previsível. |
| QA-30 · P2 · C | Listagens de anfitriões/mensagens sem paginação; mensagens sem limite próprio de texto e validação de tipo. JSON com `text` objeto pode gerar 500. | `server/src/repositories/host.repository.ts:11`; `server/src/repositories/message.repository.ts:4`; `server/src/routes/messages.routes.ts:22` | Schema de mensagem, limite de caracteres, paginação/cursor e feedback de erro. Testar histórico grande e troca rápida de conversa. |

## 4. Evidências executadas

Comandos: `npm run build` na raiz; `npm run build` em `server`; execução Node dos schemas em `server/dist/schemas` após compilação. Nenhuma destas sondagens acessou o banco.

| Entrada/sondagem | Resultado observado |
|---|---|
| Pet: `vaccinesUpToDate: 'false'`, `usesMedication: 'false'` | Ambos retornaram `true`. |
| Pet: nome com três espaços, RG com 1.000 caracteres, nascimento `2099-01-01` | Parse aceito. |
| Pet: nascimento `invalid` | Parse aceito com objeto Date inválido. |
| Anfitrião: CPF `11111111111`, CEP `00000-000`, arrays vazios, quintal `'false'` | Parse aceito e quintal convertido em `true`. |
| Anfitrião: `acceptedSizes: '['` | `SyntaxError` lançado, fora do resultado de validação Zod. |
| Conta: nome com dois espaços, telefone com 200 letras, sem aceites | Parse aceito. |
| Conta: e-mail `invalido` | Rejeitado corretamente pelo servidor. |

Controles positivos identificados: hash de senha com bcrypt; validação sintática de e-mail no backend; verificação de proprietário no CRUD de pets; acesso de mensagens limitado aos participantes; checagens de proprietário/papel em algumas operações de anfitrião. Devem ser preservados na regressão.

## 5. Matriz complementar de homologação — ainda pendente

| Área | Cenários e resultado esperado |
|---|---|
| Perfis e sessões | Visitante, tutor A/B, anfitrião A/B, cadastro incompleto, token expirado, refresh e URL direta; rotas e API recusam operações indevidas. |
| Campos | Vazio, espaços, limite−1/limite/limite+1, colagem enorme, acentos, emoji, apóstrofo, autofill, teclado móvel; limites iguais em criar/editar/API. |
| Telefone/CPF/CEP | Formatação e colagem, dígitos repetidos, incompleto, inexistente, timeout e respostas fora de ordem. CEP existente não comprova residência; CPF válido não comprova posse. |
| E-mail | Formato inválido, duplicado, espaços externos, política de maiúsculas, domínio digitado errado, verificação vencida/reutilizada, reenvio; mensagem sem falsa confirmação. |
| Datas | Data futura, ano extenso, fevereiro e bissexto, data impossível, meia-noite de São Paulo, início=fim, fim anterior, datas intermediárias bloqueadas e virada de ano. |
| Persistência | Salvar, recarregar, editar, limpar opcionais, trocar sim/não, remover imagem, reentrar; UI e banco devem concordar. |
| Falhas | 400/401/403/404/409/413/500, offline e conexão lenta; preservar formulário, mostrar erro útil, oferecer retry e evitar duplicata. |
| Reservas | Pet alheio, preço adulterado, incompatibilidade, capacidade exata, duas requisições concorrentes e transições simultâneas. |
| Financeiro | Pagamento pendente, recusado, webhook duplicado/fora de ordem, assinatura vencida e reembolso; só estados confirmados alteram acesso/saldos. |
| Chat/avaliações | Troca rápida de conversa, falha de envio, histórico longo, usuário externo, avaliação de outro host e duplicidade; isolamento e integridade. |
| Visual | 320/375/390/768/1024/1440 px, temas claro/escuro, zoom 200%, nomes longos, formulário com erros, modais e teclado virtual; sem sobreposição ou rolagem horizontal indevida. |
| Acessibilidade | Tab/Shift+Tab/Enter/Escape, foco visível e restaurado, contenção de foco em modal, labels e mensagens anunciados, contraste e redução de movimento. |
| Navegadores | Chrome, Edge, Firefox e Safari/iOS; conferir input date, arquivos/fotos, clipboard, retorno pelo navegador e teclado de telefone. |
| Desempenho | Listas grandes, imagens grandes, latência, polling do chat, duplicação de requests e descarte de URLs de prévia. Medir antes de estabelecer orçamento. |

Cada execução deverá registrar ID do caso, ambiente/commit, papel, precondições, passos, resultado esperado/obtido e evidência sanitizada. Não usar dados pessoais reais nos fixtures.

## 6. Plano de execução

### Etapa 0 — Preparação e decisões de produto

- Criar ambiente de QA isolado, banco descartável, contas dos dois papéis e fixtures de reservas em cada status; identificar versão implantada versus código auditado.
- Registrar baseline visual e reproduzir os P0/P1 via UI e API; transformar cada ID em tarefa com responsável e evidência.
- Fechar regras: formato/tamanho do RG do pet; escopo nacional/internacional do telefone; política de diárias; cancelamento; capacidade “4+”; CPF obrigatório/único e eventual verificação de titularidade; confirmação de e-mail; pagamento real ou demo.
- Obter textos/versionamento de termos e privacidade. Propostas iniciais de limites, a validar pelo produto: nome 100, nome do pet 80, RG livre 30, textos descritivos 2.000 caracteres; não tratá-las como padrões oficiais.
- Saída: contratos de validação e regras de negócio documentados. Decisões não bloqueiam correções independentes como booleanos, DTO público e erros globais.

### Etapa 1 — Integridade e proteção imediata

- QA-12: reduzir DTO público e proteger documentos antes de habilitar seu envio.
- QA-11: corrigir booleanos; identificar campos/dados afetados e solicitar reconfirmação quando não houver fonte confiável de recuperação.
- QA-14/15/29: autoridade de preço no servidor, dono do pet, papel, disponibilidade, capacidade, compatibilidade, transações e estados atômicos.
- QA-17: bloquear sucesso financeiro sem confirmação; isolar modo demo até integração concluída.
- Saída: testes de API e concorrência passando; nenhum P0 conhecido aberto para liberação. Se a versão estiver em produção, aplicar contenção urgente após verificar o ambiente afetado.

### Etapa 2 — Cadastros e contratos de dados

- QA-01/03/04/06/07/09/22/23/27: criar validadores reutilizáveis no cliente e contratos equivalentes no servidor, mensagens por campo e semântica de PATCH.
- QA-10: unificar onboarding do anfitrião, tratar conta existente e retomada de perfil incompleto.
- QA-02/08: links reais, persistência de aceites/versionamento e conteúdo acessível sem autenticação.
- QA-13/28: envio privado e persistente de documento, erros de upload e limpeza de temporários.
- Saída: cadastro completo e edição persistem dados corretos, inclusive rejeições por chamada direta à API.

### Etapa 3 — UX de erro, edição e sessão

- QA-05/19/20/21/24: campos corretos, banners globais, foco, retry, loading, prevenção de duplicidade, limpeza explícita e sessão expirada.
- QA-16: alinhar calendário e diárias com a regra aprovada.
- QA-26: labels, nomes acessíveis, foco e mensagens anunciadas.
- Saída: falhas induzidas não apagam formulário, não geram sucesso falso nem criam registros duplicados; QA manual em telas pequenas e desktop.

### Etapa 4 — Funcionalidades complementares

- QA-18: avaliações vinculadas à reserva correta, schema e unicidade.
- QA-25: recuperação/alteração de senha, ajuda, assinatura e exclusão com operações reais ou comunicação explícita de indisponibilidade.
- QA-30: mensagens tipadas, limites, paginação e teste de histórico grande.
- Finalizar confirmação de e-mail/identidade e integração financeira conforme escopo aprovado na etapa 0.
- Saída: todas as ações visíveis possuem comportamento verificável; estados de perfil e assinatura vêm de dados reais.

### Etapa 5 — Migrações, automação e regressão completa

- Migrações versionadas para aceites, verificação e pagamentos conforme contratos; verificar duplicidades antes de normalizar e-mail/CPF ou criar índices únicos.
- Tests unitários dos validadores de fronteira; integração para multipart, autorização, DTO público, pagamentos e máquina de estados; ponta a ponta para tutor e anfitrião.
- Incluir build e testes em CI. Executar a matriz complementar em ambiente isolado; anexar evidências e vincular cada defeito ao teste que evita regressão.
- Verificar dados antigos afetados pelos booleanos, remoção de opcionais, preços e reservas; não corrigir dados ambíguos automaticamente.
- Saída: matriz com status PASS/FAIL/BLOCKED por cenário e triagem dos novos achados.

### Etapa 6 — Homologação e liberação

- Homologar jornadas completas: criar tutor → pet → busca → reserva → pagamento confirmado → chat → conclusão → avaliação; criar anfitrião → espaço/documento → disponibilidade → receber/iniciar/concluir reserva.
- Critérios: zero P0/P1 aberto no escopo de lançamento, builds/CI aprovados, fluxo de falha testado, acesso público sem dados restritos, responsividade/acessibilidade verificadas e P2 restante explicitamente priorizado.
- Preparar backup e rollback das migrações/dados antes de implantar; monitorar erros de cadastro, 401/403/500, uploads e falhas de pagamento sem registrar documentos/senhas em logs.
- Realizar smoke após deploy em contas de teste e comparar indicadores com baseline.

## 7. Dependências e organização sugerida

Backend: QA-11/12/14/15/17/18/22/23/27/28/29/30. Frontend: QA-01–10/13/16/19–21/24–27. QA participa em todas as etapas; produto define contratos e conteúdo, operação define identidade e atendimento, infraestrutura sustenta armazenamento privado e integrações.

Sequência crítica: decisões mínimas → integridade/privacidade → contratos → cadastros → UX → regressão → liberação. Upload de identidade depende de armazenamento privado; pagamento confirmado depende de provedor/webhook; confirmação de e-mail depende de serviço de envio. Essas integrações precisam ser dimensionadas antes de assumir prazo.

O plano cobre os 30 itens enumerados. As etapas são ordem de execução, não promessa de duração. Estimar esforço depois da reprodução integrada e das decisões da etapa 0, separando correções locais de integrações externas.
