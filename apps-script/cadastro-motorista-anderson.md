# Cadastro do motorista Anderson

O projeto completo do Apps Script não é versionado neste repositório. Aplique estas alterações no `Code.gs` vinculado à planilha de traslados.

## 1. Registrar o motorista

Na constante `MOTORISTAS`, antes do fechamento `};`, acrescente:

```js
  "Anderson": { email: "" } // O e-mail fica em Script Properties.
```

## 2. Buscar o e-mail pela propriedade privada

Substitua a função atual `emailDoMotorista` por:

```js
function emailDoMotorista(nome) {
  var k = _achaMotorista(nome);
  if (!k) return "";
  if (k === "Anderson") return _prop("EMAIL_MOTORISTA_ANDERSON");
  return MOTORISTAS[k].email || "";
}
```

Em **Configurações do projeto → Propriedades do script**, crie a propriedade:

- Chave: `EMAIL_MOTORISTA_ANDERSON`
- Valor: o endereço informado para o Anderson

Salve uma nova versão e atualize a implantação do Web App mantendo a URL atual.

## 3. Criar a senha inicial

Após a implantação, abra `config.html` com a senha atual da recepção, vá à aba **Senhas**, selecione **Anderson** e defina uma senha inicial com pelo menos 8 caracteres. Entregue a senha diretamente ao motorista; ele poderá alterá-la pelo app.

O app de escala já inclui Anderson na lista de atribuição. Quando ele for selecionado em um traslado, a sincronização do Google Agenda usará o e-mail guardado na propriedade privada.
