'use client';
import {useEffect,useState} from 'react';
import {productClient} from '../lib/supabase';

export default function AccountPanel({onSession}) {
  const [configured,setConfigured]=useState(null);
  const [session,setSession]=useState(null);
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const client=productClient();
    setConfigured(!!client);
    if(!client) return;
    let alive=true;
    const apply=(value)=>{if(alive){setSession(value);onSession(value);}};
    client.auth.getSession().then(({data,error})=>{if(error&&alive)setMessage('No se pudo recuperar la sesión.');else apply(data.session);});
    const {data}=client.auth.onAuthStateChange((_event,value)=>apply(value));
    return ()=>{alive=false;data.subscription.unsubscribe();};
  },[onSession]);
  async function requestLink(event) {
    event.preventDefault();setBusy(true);setMessage('');
    try {
      const {error}=await productClient().auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin+'/'}});
      if(error) throw error;
      setMessage('Si el acceso está disponible para este correo, recibirás un enlace. Ábrelo en este navegador.');
    } catch {setMessage('No pudimos enviar el enlace. Revisa el correo o inténtalo más tarde.');}
    finally {setBusy(false);}
  }
  async function leave() {
    setBusy(true);setMessage('');
    try {const {error}=await productClient().auth.signOut();if(error)throw error;}
    catch {setMessage('No se pudo cerrar la sesión. Inténtalo otra vez.');}
    finally {setBusy(false);}
  }
  return <section className="account" aria-label="Acceso a tu bitácora">
    {configured===null?<p role="status">Comprobando acceso…</p>:!configured?<p>El guardado aún no está conectado. Puedes explorar el formulario como borrador temporal.</p>:session?<div className="account-row"><p>Tu bitácora privada <small>{session.user.email}</small></p><button type="button" className="secondary" disabled={busy} onClick={leave}>Cerrar sesión</button></div>:<form onSubmit={requestLink}><label htmlFor="login-email">Accede para guardar tu bitácora</label><div className="account-row"><input id="login-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} placeholder="Tu correo electrónico"/><button className="primary" disabled={busy}>{busy?'Enviando…':'Recibir enlace'}</button></div><p className="hint">Acceso por correo, sin contraseña. Revisa tu reflexión antes de iniciar sesión: abrir el enlace puede recargar la página y perder el borrador.</p></form>}
    {message&&<p role="status" className="hint">{message}</p>}
  </section>;
}
