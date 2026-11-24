# Cadastro do motorista Anderson

O projeto completo do Apps Script não é versionado neste repositório. No `Code.gs` vinculado à planilha, inclua Anderson na constante `MOTORISTAS`, seguindo o mesmo padrão dos outros motoristas:

```js
  "Anderson": { email: "E-MAIL_DO_ANDERSON" }
```

Use o endereço recebido para o motorista no valor de `email`. Mantenha a função `emailDoMotorista` existente, que já lê os e-mails diretamente dessa constante.

Salve uma nova versão e atualize a implantação do Web App sem alterar a URL usada pelo front-end.

Após a implantação, abra `config.html` com a senha atual da recepção, vá à aba **Senhas**, selecione **Anderson** e defina uma senha inicial com pelo menos 8 caracteres. A senha será armazenada nas Script Properties como `SENHA_MOTORISTA_ANDERSON`; compartilhe-a diretamente com o motorista. Ele poderá alterá-la pelo app.

O app de escala inclui Anderson na lista de atribuição. Quando ele for selecionado em um traslado, o Google Agenda usará o e-mail definido na constante `MOTORISTAS`.
