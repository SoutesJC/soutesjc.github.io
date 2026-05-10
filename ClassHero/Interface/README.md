# ClassHero v2 — Relatório de Verificação do Protótipo

## Visão Geral

Auditoria técnica do protótipo `ClassHero v2` comparando a implementação atual com o changelog documentado.

O objetivo deste relatório é validar:

* funcionalidades implementadas corretamente;
* falhas de implementação;
* itens parcialmente concluídos;
* melhorias sugeridas para versões futuras.

---

## Resumo

| Categoria                      | Quantidade |
| ------------------------------ | ---------- |
| Implementadas corretamente     | 14         |
| Bugs / falhas de implementação | 4          |
| Implementações parciais        | 2          |
| Melhorias futuras sugeridas    | 8          |

---

# Resultado por ação do changelog

| Ação   | Descrição                     | Status   | Observação                                                                                                              |
| ------ | ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `A-01` | Cards em 3 zonas              | OK       | `mat-zone-a/b/c` com backgrounds distintos e variáveis `--bg-zone-b/c` aplicadas corretamente.                          |
| `A-02` | Cores semânticas              | BUG      | `mat-btn-completed` mantém `onclick` ativo mesmo com `cursor:default`. Faltam `aria-disabled="true"` e `tabindex="-1"`. |
| `A-03` | Labels em ícones              | OK       | Labels visíveis, `aria-label` descritivos e `role="toolbar"` corretamente aplicado.                                     |
| `A-04` | Fallback NaN                  | OK       | Estado de carregamento com animação, texto "Calculando XP..." e `aria-live="polite"`.                                   |
| `A-05` | Overlay 90%                   | OK       | `--overlay-bg: rgba(8,12,24,0.90)` aplicado corretamente em modal e confirm-dialog.                                     |
| `A-06` | Touch target 44px             | PARCIAL  | `btn-sm` usa `min-height:36px`, abaixo do mínimo recomendado.                                                           |
| `A-07` | Máx 3 ações/card              | OK       | Estrutura de ações consistente com o padrão definido.                                                                   |
| `A-08` | CTA full-width em questão     | OK       | `width:100%` e `min-height:52px` aplicados corretamente.                                                                |
| `A-09` | Fechar padronizado ✕          | OK       | Todos os botões de fechar utilizam o padrão definido.                                                                   |
| `A-10` | Erros OTP específicos         | OK       | Estados `wrong` e `expired` implementados com feedback visual adequado.                                                 |
| `A-11` | Linguagem em Novidades        | PENDENTE | Funcionalidade adiada por ausência da view correspondente.                                                              |
| `A-12` | Confirmação ao fechar questão | BUG      | Acúmulo de listeners em `openQuestion()` causando comportamento instável.                                               |
| `A-13` | Sub-itens só no curso ativo   | PARCIAL  | Correto visualmente, mas sem lógica dinâmica de expansão/colapso.                                                       |
| `A-14` | Normalização de e-mail        | OK       | `normalizeEmail()` implementado corretamente com `trim().toLowerCase()`.                                                |
| `A-15` | OTP aceita paste              | BUG      | Evento `onpaste` presente apenas em `otp-0`.                                                                            |
| `A-16` | Padding sub-itens nav 10px    | OK       | `padding` e `min-height` confirmados conforme especificação.                                                            |
| `A-17` | Breadcrumb e atalhos          | OK       | Breadcrumb e atalhos implementados corretamente.                                                                        |
| `A-18` | Tooltip ajuda + critérios     | BUG      | CSS existe, mas o componente não foi implementado no HTML.                                                              |
| `A-19` | Camadas de fundo mantidas     | OK       | Variáveis de background preservadas corretamente.                                                                       |
| `A-20` | Layout login 2 colunas        | OK       | `grid-template-columns: 1fr 420px` confirmado.                                                                          |

---

# Bugs encontrados

## BUG-A02 — Botão não interativo ainda dispara eventos

### Problema

O botão `mat-btn-completed` possui aparência de elemento desabilitado, porém continua funcional:

* mantém `onclick` ativo;
* continua acessível via teclado;
* leitores de tela anunciam como botão interativo.

Isso gera inconsistência entre comportamento visual e semântico.

### Correção recomendada

```html
<button
  aria-disabled="true"
  tabindex="-1"
>
```

Ou substituir completamente por:

```html
<div role="status">
```

---

## BUG-A12 — Acúmulo de listeners em `openQuestion()`

### Problema

A função adiciona um novo listener de `input` toda vez que a questão é aberta:

```js
addEventListener('input', ..., { once:false })
```

Isso cria múltiplos listeners ativos no mesmo campo, causando:

* comportamento imprevisível;
* atualização duplicada de estado;
* possíveis condições de corrida.

### Correção recomendada

```js
if (inp._trackFn) {
  inp.removeEventListener('input', inp._trackFn);
}

inp._trackFn = () => {
  qHasContent = inp.value.trim().length > 0;
};

inp.addEventListener('input', inp._trackFn);
```

---

## BUG-A15 — Paste do OTP funciona apenas no primeiro campo

### Problema

O handler:

```html
onpaste="otpPaste(event)"
```

foi aplicado apenas ao campo `otp-0`.

Se o usuário colar o código em outro campo:

* o paste padrão do navegador ocorre;
* todos os dígitos ficam em apenas um input;
* os demais campos não são preenchidos.

### Correção recomendada

Adicionar `onpaste` em todos os campos OTP:

```html
<input onpaste="otpPaste(event)">
```

---

## BUG-A18 — Tooltip existe apenas no CSS

### Problema

As classes:

```css
.help-tooltip-wrap
.help-tooltip
```

foram definidas no CSS, porém não existem elementos HTML utilizando essas classes.

O componente não aparece na interface.

### Correção recomendada

```html
<div class="help-tooltip-wrap">
  <button class="quick-btn">...</button>
  <span class="help-tooltip">Texto do tooltip</span>
</div>
```

Alternativamente:

```html
<button title="Texto do tooltip">
```

---

# Melhorias futuras sugeridas (v3)

## Acessibilidade

### Focus trap em modais

O foco do teclado deve permanecer dentro do modal enquanto ele estiver aberto.

### Navegação anunciada para leitores de tela

Adicionar:

```html
<div aria-live="polite" aria-atomic="true">
```

para anunciar mudanças de view.

---

## Experiência do usuário

### Timer OTP visual

Adicionar indicador gráfico de contagem regressiva:

* barra linear;
* arco SVG;
* círculo de progresso.

### Upload com progresso real

Implementar feedback visual durante envio:

```txt
Enviando... 36s restantes
```

### Sistema funcional de level-up

O banner `#levelup-banner` existe mas não é acionado pelo JavaScript.

---

## Performance

### Debounce no contador de palavras

Atualmente:

```js
updateWordCount()
```

é executado a cada tecla digitada.

Sugestão:

```js
debounce(updateWordCount, 150)
```

---

## Arquitetura

### Popovers inteligentes

Os popovers devem detectar espaço disponível no viewport antes de decidir abrir para cima ou para baixo.

### Ajuste do token `btn-sm`

Atualmente:

```css
min-height:36px
```

Sugestão:

* aumentar para `40px`;
* ou restringir explicitamente para desktop-only.
