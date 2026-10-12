(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TransferUpdate = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function assertSuccess(data) {
    var message = data && (data.error || data.erro);
    var confirmed = data && (data.ok === true || data.success === true);
    if (!confirmed || message) {
      throw new Error(message || 'O servidor não confirmou a atualização.');
    }
    return data;
  }

  async function persistUpdate(postApi, id, fields) {
    var data = await postApi(Object.assign({ action: 'update', id: id }, fields));
    return assertSuccess(data);
  }

  return { assertSuccess: assertSuccess, persistUpdate: persistUpdate };
}));
