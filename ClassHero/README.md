# Relatório de Análise — ClassHero
## Plataforma de Testes ##
**Autor:** Jeancarlo | **Perfil:** Frontend, UI/UX e Backend de Apoio  
**Orientador:** Prof. Everton Coimbra de Araújo | **Projeto:** INOVAGRAD · Refatoração Arquitetural

---

## 1. Metodologia de Análise

A análise foi conduzida com base em gravação em tela da plataforma ClassHero em uso real, com 7 minutos e 30 segundos de duração (1920×952px, 30fps), cobrindo os seguintes fluxos: autenticação via magic link, dashboard principal, navegação lateral, listagem de cursos, cards de materiais, submissão de trabalhos, leitura de materiais, perguntas de preenchimento e respostas dissertativas com avaliação por IA. Os achados foram cruzados com as diretrizes identificadas no relatório de Semana 1: fluxo de autenticação, acessibilidade (WCAG), design educacional gamificado e consistência com o modelo DDD.

---

## 2. Fluxo de Autenticação

### 2.1 O que foi observado

A plataforma utiliza autenticação sem senha (passwordless) baseada em **magic link por e-mail com código OTP**. O fluxo observado é:

1. Tela de login com campo de e-mail
2. Envio do código → toast de sucesso ("Código enviado para seu e-mail!")
3. Campo de "Código de acesso" para validação
4. Botão "VALIDAR" (primário) + botão "TROCAR E-MAIL" (secundário, vermelho)
5. Link "REENVIAR CÓDIGO" com cooldown de 30 segundos
6. Rodapé com versão do build e timestamp (ex: `Versão build-20260505.1322 · 2026-05-05 13:22 UTC`)

### 2.2 Pontos Positivos

- Experiência passwordless elimina vulnerabilidades de senha fraca
- Toast de feedback imediato com ícone e mensagem claros
- Cooldown no reenvio previne spam de código
- Identificação de versão no rodapé é útil para debug em produção

### 2.3 Problemas Identificados

**Composição Visual Desequilibrada:**  
A ilustração à esquerda (mascote em esfera) ocupa aproximadamente 40% da viewport e não está visualmente ancorada ao card de login — cria uma relação visual assimétrica sem hierarquia clara entre decoração e funcionalidade. Em viewports menores, o equilíbrio tende a colapsar.

**Fundo Preto Absoluto:**  
O background utiliza preto puro (`#000000` ou muito próximo), o que cria contraste máximo que pode causar "halos" visuais ao redor de elementos em modo escuro — fenômeno conhecido como irradiância. WCAG 2.1 recomenda contraste suficiente, mas não necessariamente máximo; um fundo `#0D0D0D` ou `#111827` seria mais confortável.

**Ausência de Estado de Erro Explícito:**  
Não foi possível observar no vídeo a representação visual de código inválido ou expirado. A ausência de estados de erro bem definidos é um gap de UX crítico para autenticação.

**Botão "TROCAR E-MAIL" com cor vermelha:**  
Vermelho é universalmente associado a ações destrutivas ou de alerta. Trocar e-mail é uma ação reversível e neutra — usar vermelho cria ansiedade desnecessária.

**Ausência de Contexto da Plataforma na Tela de Login:**  
O card não apresenta nome, slogan ou branding textual além da ilustração. Um usuário novo não sabe imediatamente o propósito da plataforma antes de se autenticar.

**Sem Alternativa de Acesso:**  
Não há fluxo visível para caso o e-mail institucional não receba o código (spam, regras de firewall de domínio). Uma opção de suporte ou redirecionamento seria necessária.

---

## 3. Navegação e Arquitetura de Informação

### 3.1 Sidebar Esquerda

A sidebar apresenta: avatar + nome + e-mail truncado + nível + XP, ícones de ação (notificações, achievements?, refresh?, configurações) sem labels, seções de navegação (Início, Meus Cursos, Explorar Cursos, Contestações, Pesquisas, Novidades) e, quando dentro de um curso, expansão com submenu de missões e materiais.

**Problema crítico — ícones sem label:**  
A linha de quatro ícones (sino, cadeado, seta circular, engrenagem) não possui texto de apoio. Para usuários com deficiência visual usando leitores de tela, esses controles são invisíveis semanticamente se não tiverem `aria-label`. Além disso, a convenção de ícone único é ambígua: o "cadeado" pode ser achievements, privacidade ou segurança — sem label, o usuário precisa experimentar para descobrir.

**Positivo:**  
- A sidebar ativa o item corrente com destaque visual (azul)
- O nível e XP são sempre visíveis no topo — reforço constante da progressão
- Submenu contextual por curso é uma solução elegante de hierarquia

### 3.2 Breadcrumb e Orientação Espacial

Dentro das perguntas (frames 10, 14, 15), o cabeçalho exibe:
```
Curso: [nome] / Missão: [nome] / Material: [nome]
```
Esse padrão de trilha contextual é excelente para orientação do aluno dentro de uma estrutura de três níveis. Contudo, a fonte é muito pequena (estimada ~11px) e em cinza claro sobre fundo escuro, tornando-a praticamente invisível na prática.

---

## 4. Sistema de Gamificação — XP e Progressão

### 4.1 Estrutura Observada

O sistema de gamificação está estruturado em camadas:

**Por curso (missão):** Iniciante → Aprendiz → Praticante → Veterano → Maestro  
**Por material:** XP parcial (ex: +207/380 XP) com barra de progresso verde  
**Por prazo:** XP máximo até data limite; XP parcial após deadline  
**Global:** Nível do aluno (ex: Nível 5 · 2030 XP) visível na sidebar

**Tipos de conteúdo identificados com XP próprio:**
- NotebookLM (material de leitura)
- Texto de Apoio (bônus pequeno, ~3-5 XP)
- Quiz (formato "desafio de competência")
- Trilha interativa
- Trabalho/entrega individual
- Vídeo do professor
- Resposta dissertativa (avaliada por IA)

### 4.2 Pontos Positivos

- Granularidade do XP parcial incentiva o engajamento incremental sem punir quem não conclui tudo
- A barra de progressão por estágio (ex: "Faltam 123 XP para Veterano") cria metas concretas e próximas
- Histórico de acesso visível nos cards ("Acessado 1x — há cerca de 1 mês") aumenta autoconsciência do aluno
- Avaliação dissertativa por IA com timer de resposta ("Avaliando sua resposta... 01:20") é diferencial tecnológico forte

### 4.3 Problemas Identificados

**Bug crítico — "+NaN XP conquistado":**  
Observado diretamente no frame 9 do vídeo: o campo de XP conquistado exibe "+NaN XP conquistado" para um material em andamento. `NaN` (Not a Number) indica um erro de cálculo no frontend, provavelmente na tentativa de somar ou multiplicar valores ainda não carregados. Este bug quebra a confiança do aluno no sistema de recompensa, que é o núcleo da gamificação.

**Ausência de animação/feedback de conquista:**  
Não foi possível observar nenhum efeito visual ao completar um material ou subir de nível. Em plataformas gamificadas, o feedback imediato de conquista (animação, som, partículas) é um dos principais fatores de engajamento dopaminérgico. A plataforma parece apenas atualizar valores silenciosamente.

**XP por prazo é punitivo sem comunicação clara:**  
O sistema de "XP parcial até 13/07" com "100% terminou em 26/03" e "Última tentativa: +98 XP" sugere degradação de recompensa, mas a lógica não está explicada de forma visual clara ao aluno no momento do acesso ao material.

**Tooltip de XP sobrepõe conteúdo:**  
No frame 9, o tooltip do XP sobrepõe o botão de ação, criando uma área de sobreposição que dificulta a interação.

---

## 5. Cards de Materiais — Densidade e Usabilidade

### 5.1 Estrutura dos Cards

Cada card de material apresenta: ícone + título + tags de tipo (NotebookLM, Orientações), resumo truncado, badge de acesso recente, badge de conclusão, barra de XP, e até **9 botões de ação**:

> +XP | Continuar Revisar | Respondido em... | Resumo | Material Complementar | Texto de Apoio | Ver Avaliação Checkout | Ver Plano Avaliado Nota XX | Registrar para Aula | Ver Trabalho Concluído

### 5.2 Problema de Densidade Cognitiva

9 ações por card é excessivo. A carga cognitiva para decidir qual ação tomar é alta, especialmente para alunos em estados diferentes de progresso. O Nielsen Norman Group documenta que menus com mais de 5-7 itens de ação frequentemente resultam em paralisia de decisão.

**Proposta de hierarquia de ações:**
- **Ação primária única** (CTA principal, destaque máximo): a próxima ação lógica do aluno naquele material
- **Ações secundárias** (2-3 no máximo, texto ou ícone pequeno): histórico, complementar, checkout
- **Ações terciárias** (ocultas em "mais opções"): avaliação detalhada, registros

### 5.3 Inconsistência de Cores dos Botões

Foram observadas as seguintes cores de botão nos cards: azul (ação principal), verde (plano avaliado), amarelo/laranja (registrar para aula), vermelho/magenta (ver trabalho), cinza (ações neutras), e teal (continuar revisar). Sem sistema de design claro, as cores perdem seu significado semântico. O aluno não consegue inferir a hierarquia pela cor.

---

## 6. Modal de Submissão de Trabalho

### 6.1 Observações

O modal de entrega apresenta: status "Prazo expirado" em badge laranja, mensagem "Envio com atraso permitido", prazo final, formato aceito (PDF/ZIP até 50MB), avisos de penalidade, upload de arquivo com progress bar e estimativa de tempo, seção "Pré-análise da entrega" com IA, e botões Salvar Rascunho / Pré-Analisar / Enviar.

### 6.2 Pontos Positivos

- A feature de "Pré-análise" via IA antes do envio definitivo é inovadora e reduz retrabalho
- Progress bar de upload com tempo estimado é excelente feedback
- Mensagem de atraso permitido com clareza sobre penalização respeita o aluno

### 6.3 Problemas

**Duplo modal sem escape visual claro:**  
O modal abre sobre a tela de curso já carregada, mas não há overlay suficientemente escuro para separar contextos. A mensagem "Revise os detalhes antes de fechar esta janela" no rodapé é correta mas pouco proeminente.

**"Abrir Mão (0 PTS)" como label de botão:**  
O botão com label "ABRIR MÃO (0 PTS)" é ambíguo — sugere desistência do trabalho. Semanticamente deveria ser algo como "Não entregar esta atividade" com confirmação explícita.

---

## 7. Leitor de Material

### 7.1 Observações

O leitor ocupa a tela inteira com barra superior (título, paginação "1/12", timer "Tempo 9s/420s", zoom 220%) e barra inferior (← Anterior | Próxima → | atalhos de teclado | aviso de bônus por leitura completa).

### 7.2 Pontos Positivos

- Timer de leitura com progresso incentiva a leitura completa para desbloqueio de bônus
- Atalhos de teclado visíveis (↑↓, PgUp/PgDn, J/K)
- Conteúdo renderizado com boa tipografia (fundo claro para leitura de documento)

### 7.3 Problemas

**Timer "9s/420s" como texto puro:**  
A exibição do tempo de leitura apenas como texto sem barra de progresso visual é uma oportunidade perdida. Uma barra circular ou linear tornaria o progresso imediatamente legível.

**Contraste de contexto:**  
O leitor usa fundo branco/claro para o documento, mas a UI ao redor usa tema escuro. Essa transição pode ser desconfortável em ambientes de baixa luminosidade.

---

## 8. Telas de Pergunta (Avaliação)

### 8.1 Tipos Observados

Foram identificados dois tipos: **preenchimento de lacuna** (cloze) e **resposta dissertativa**. Ambos em tela cheia com timer regressivo por pergunta.

### 8.2 Pontos Positivos

- Mascote contextual muda por tipo de questão (personagem pensativo para dissertativa, personagem animado para XP). Isso cria identidade visual dinâmica
- Timer por pergunta é claramente exibido no canto superior direito
- Contador de palavras na resposta dissertativa (ex: "58 palavras")
- Avaliação por IA com tempo estimado visível ("Avaliando sua resposta... 01:20")

### 8.3 Problemas

**Tipografia de pergunta muito grande para uso prático:**  
O texto da pergunta (estimado ~28-32px) ocupa grande parte da área útil, forçando o campo de resposta a ser pequeno. Em questões longas, o usuário precisa rolar antes de responder.

**Ausência de indicador de progresso de perguntas:**  
"Pergunta 1 de 1" sugere que o sistema mostra apenas uma questão por material. Se houver múltiplas perguntas em sessões futuras, será necessário um indicador claro de progresso.

**Barra azul de progresso superior sem rótulo:**  
A barra no topo da tela de questão não tem label. O aluno não sabe o que ela representa (tempo? progresso na missão?).

---

## 9. Seção "Novidades" (Changelog)

### 9.1 Observações

A seção de Novidades é um changelog detalhado com cards por release, organizados por tipo (Correção, Nova Feature), prioridade (Alta, Média), status (Publicado) e data. Cada card tem: título, data/hora, motivo da mudança, o que foi feito, impacto esperado, ação necessária, e tags de módulos afetados.

### 9.2 Análise

Este nível de transparência com os usuários é incomum em plataformas educacionais e é muito positivo — cria confiança e demonstra cuidado. Contudo, a apresentação atual é densa demais para o perfil de aluno médio. Um aluno não precisa saber sobre "seed e hidratação progressiva do ranking por curso" — precisa saber "o ranking ficou mais preciso". A linguagem técnica pode ser simplificada para mensagens voltadas ao benefício do usuário.

---

## 10. Análise de Acessibilidade (WCAG 2.1)

| Critério | Nível | Status | Observação |
|---|---|---|---|
| Contraste de texto (AA = 4.5:1) | AA | ⚠️ Parcial | Fundo preto + texto cinza em metadados pode não atingir 4.5:1 |
| Labels em controles interativos | A | ❌ Falha | Ícones sem aria-label na sidebar |
| Foco visível | AA | ⚠️ Não verificado | Nenhum estado de foco foi observado no vídeo |
| Hierarquia de títulos | A | ⚠️ Parcial | Estrutura de headings não verificável pelo vídeo |
| Indicadores de erro | A | ⚠️ Não observado | Estados de erro de formulário não exibidos no vídeo |
| Dependência de cor | AA | ❌ Parcial | Status de materiais (concluído/em andamento) dependem de cor e badge, sem alternativa textual consistente |
| Tempo suficiente | A | ⚠️ Risco | Timer de pergunta regressivo sem opção de extensão para alunos com necessidades especiais |
| Redimensionamento de texto | AA | ⚠️ Não verificado | Zoom de 220% no leitor de material sugere que a plataforma pode ser usada em zoom, mas não foi testado |

---

## 11. Consistência com o Modelo de Domínio (DDD)

A arquitetura de informação reflete claramente os bounded contexts identificados no estudo de DDD:

- **Contexto de Identidade:** Login, perfil do usuário, nível, XP global
- **Contexto de Aprendizado:** Cursos → Missões → Materiais → Atividades
- **Contexto de Avaliação:** Submissões, notas, XP parcial, avaliação por IA
- **Contexto de Gamificação:** Ranking, conquistas, progressão de nível
- **Contexto de Comunicação:** Novidades/changelog, contestações, pesquisas

O design atual respeita razoavelmente esses limites, mas a **densidade de informação nos cards de material** viola o princípio de responsabilidade única ao tentar expor dados de todos os contextos simultaneamente em um único componente.

---

## 12. Síntese dos Problemas por Prioridade

### Crítico (bloqueia experiência ou confiança)
1. **Bug NaN XP** — quebra a confiança no sistema de recompensa
2. **Ícones sem label** na sidebar — falha de acessibilidade nível A

### Alto (impacta significativamente a usabilidade)
3. **Excesso de botões nos cards** de material (até 9 ações)
4. **Inconsistência de cores de botão** sem sistema de design definido
5. **Botão "Trocar E-mail" vermelho** — cor inadequada para ação neutra
6. **Ausência de feedback visual de conquista** (animação ao subir de nível, completar material)
7. **Timer de leitura apenas textual** — oportunidade de visualização perdida

### Médio (degrada a experiência mas não impede uso)
8. **Fundo preto absoluto** — conforto visual prejudicado
9. **Breadcrumb de pergunta com fonte mínima** — dificulta orientação espacial
10. **Linguagem técnica no changelog** — não adequada para alunos
11. **Tooltip de XP sobrepõe botões** de ação

### Baixo (oportunidade de melhoria)
12. **Ausência de contexto de plataforma** na tela de login
13. **Transição de tema** entre leitor (claro) e plataforma (escuro)
14. **Modal de entrega sem overlay** suficientemente opaco

---

## 13. Pontos Positivos Consolidados

A plataforma demonstra maturidade em várias dimensões que devem ser preservadas na refatoração:

- Autenticação passwordless com feedback de cooldown é moderna e segura
- Avaliação de respostas dissertativas por IA com timer visível é diferencial competitivo
- Progressão em 5 estágios por missão cria uma estrutura de evolução clara e motivadora
- Pré-análise de entrega antes do envio definitivo reduz frustração e retrabalho
- Transparência via changelog detalhado constrói confiança com os usuários
- Mascote contextual variando por tipo de atividade cria identidade visual dinâmica
- Histórico de acesso por material aumenta a autoconsciência do aluno sobre seus hábitos de estudo

---

## 14. Ideia Complementar — Sistema de XP Mais Interativo

> **Nota:** Esta seção é uma contribuição exploratória de design e não é o foco central deste relatório.

### Pet Companion (Tamagotchi Educacional)

O aluno cria e nomeia um pet que evolui com o engajamento da plataforma. O pet tem estados visuais que refletem a atividade do aluno: dorme se o aluno fica dias sem acessar, fica animado ao completar materiais, usa "roupas" desbloqueadas por conquistas. O pet pode aparecer contextualmente nas telas de pergunta (substituindo ou complementando o mascote fixo atual) e na sidebar como indicador de estado.

### Build Your Own Story

Ao subir de nível global, o aluno recebe uma escolha narrativa que ramifica sua "história no ClassHero" — por exemplo, ao passar do Nível 3 para 4, o aluno escolhe entre "Especialista em Frontend" ou "Mestre do Backend", e essa escolha recolore sutilmente sua interface, nomeia conquistas de forma diferente e desbloqueia materiais recomendados coerentes com o caminho escolhido.

Ambas as ideias se integram ao modelo de domínio existente sem substituir o sistema de XP atual — funcionam como camada de significado narrativo sobre a mecânica já construída.

---

## 15. Próximos Passos para o SDD

Com base nesta análise, o SDD da feature de **Autenticação e Perfil** deve endereçar:

1. Tela de login com composição visual equilibrada e contexto de plataforma
2. Sistema de cores para estados de botão dentro de um design system coerente
3. Labels acessíveis em todos os controles interativos
4. Estados de erro, loading e sucesso para o fluxo OTP
5. Tela de perfil que consolide: dados pessoais, nível global, histórico de XP, conquistas
6. Especificação de `aria-label`, `role` e navegação por teclado para todos os componentes de autenticação

---

*INOVAGRAD · Projeto ClassHero — Refatoração Arquitetural · Análise Semana 1 · Jeancarlo*
