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
