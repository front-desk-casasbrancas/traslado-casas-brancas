# Correção do cancelamento no Google Calendar

O backend implantado é um Apps Script vinculado à planilha `Traslados`; antes desta correção, o código não estava versionado neste repositório.

## Aplicação no Apps Script

1. Adicione `calendar-cancellation.gs` ao projeto vinculado à planilha.
2. Aplique `Code.gs.patch` ao arquivo `Código.gs` atual.
3. Crie uma nova versão do Apps Script e atualize a implantação do web app sem alterar a URL usada pelo front-end.
4. Teste o cancelamento com um transfer de homologação e confirme que o evento desapareceu antes de usar em produção.

O patch mantém o status anterior quando o Calendar falha, preserva `EventoID` para permitir nova tentativa e devolve o erro ao dashboard. Ele também procura o evento na agenda configurada e na agenda padrão, cobrindo eventos antigos criados durante fallback.

## Eventos órfãos anteriores

Os cancelamentos antigos tiveram `EventoID` apagado pelo código anterior. Esses eventos não são removidos automaticamente porque já não existe uma chave segura para distingui-los de outros compromissos. Revise-os uma única vez no Calendar usando ID, data, horário e hóspede da planilha; não execute uma exclusão em massa por título.

## Testes locais

```text
node --test tests/*.test.js
```

## Fechamento da Búzios Technology

O arquivo `fechamento-buzios-technology.gs` implementa um fechamento independente da comissão do hotel:

- calcula 5% sobre os transfers não cancelados do mês anterior;
- mantém a comissão de 15% do hotel e sua taxa de cartão fora desse cálculo;
- usa `Pagamento` apenas para apresentar o resumo por forma de pagamento;
- prepara o envio no dia 05, com vencimento no dia 10;
- para outubro de 2026, usa excepcionalmente vencimento em 11/11/2026;
- impede duplicidade por mês e não contém destinatário fixo;
- envia exclusivamente ao e-mail confirmado do Marcelo, sem cópia;
- não grava o valor da Búzios Technology na planilha nem o expõe no app financeiro.

O fluxo é somente de saída por e-mail. Ele não deve ser ligado ao `doGet`, ao `doPost`, à aba `Pagamentos`, ao dashboard, ao financeiro ou ao menu compartilhados com o Casas Brancas. As funções de pré-visualização existem apenas para validação manual no editor do Apps Script.

### Validação e ativação

1. Adicione o arquivo ao Apps Script vinculado à planilha `Traslados`.
2. Execute `previsualizarFechamentoBuziosTechnologyOutubro2026()` e confira o objeto retornado antes de configurar qualquer envio.
3. Cadastre somente o e-mail confirmado do Marcelo na propriedade de script `FECHAMENTO_BUZIOS_TECH_EMAIL_MARCELO`. A configuração rejeita listas, cópias e múltiplos destinatários. Não use um endereço presumido.
4. Depois da aprovação do fechamento e dos destinatários, defina `FECHAMENTO_BUZIOS_TECH_ENVIO_ATIVO` como `true`.
5. Para a exceção de outubro, execute uma única vez `enviarFechamentoBuziosTechnologyOutubro2026()`.
6. Execute `instalarTriggerFechamentoBuziosTechnologyDia05()` para os meses seguintes. O instalador recusa a criação enquanto o envio estiver desativado ou sem destinatários.

Nenhuma dessas configurações ou funções de ativação é executada automaticamente pelo código versionado.

