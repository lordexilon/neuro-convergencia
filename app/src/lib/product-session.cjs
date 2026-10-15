function sessionView(previousId, nextId, currentView) {
  if (nextId && nextId !== previousId) return 'journal';
  if (previousId && !nextId) return 'landing';
  return currentView;
}

function observeProductSession(client, {onSession, onReady, onError}) {
  let alive = true;
  let revision = 0;
  let subscription;
  const timer = setTimeout(() => {
    if (alive && revision === 0) {
      onError('No se pudo comprobar el acceso. Puedes reintentar o explorar el mapa.');
      onReady();
    }
  }, 8000);
  const apply = next => {
    if (!alive) return;
    revision++;
    clearTimeout(timer);
    onError('');
    onSession(next);
    onReady();
  };
  const fail = () => {
    if (!alive || revision !== 0) return;
    clearTimeout(timer);
    onError('No se pudo recuperar la sesión. Reintenta el acceso.');
    onReady();
  };
  try {
    // Subscribe first. A late bootstrap result must not undo a newer login/logout event.
    subscription = client.auth.onAuthStateChange((_event, next) => apply(next)).data.subscription;
    Promise.resolve().then(() => client.auth.getSession()).then(({data, error}) => {
      if (!alive || revision !== 0) return;
      if (error) fail();
      else apply(data.session);
    }).catch(fail);
  } catch {fail();}
  return () => {alive = false; clearTimeout(timer); subscription?.unsubscribe();};
}

module.exports = {observeProductSession, sessionView};
