'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import AccountPanel from './AccountPanel';
import ModalDialog from './ModalDialog';
import LandingPage from './LandingPage';
import OnboardingFlow from './OnboardingFlow';
import GamificationPanel from './GamificationPanel';
import HabitsHub from './HabitsHub';
import AiMirror from './AiMirror';
import {clearLegacyAiStorage} from '../lib/ai-privacy.cjs';
import {productClient} from '../lib/supabase';
import {buildJournal} from '../lib/journal-record.cjs';
import {observeProductSession, sessionView} from '../lib/product-session.cjs';

const reactivityOptions = [
  {id:'impulso',label:'Impulso de Supervivencia (Ataque/Huida)',description:'Reacción física, rápida, defensiva o impositiva.',tone:'red'},
  {id:'emocion',label:'Torbellino Emocional',description:'Sentimientos abrumadores o sensibilidad extrema.',tone:'orange'},
  {id:'mente',label:'Sobrecarga Mental / Racionalización',description:'Sobrepensar, buscar excusas o parálisis por análisis.',tone:'yellow'},
  {id:'observador',label:'Observador Consciente',description:'Una reacción equilibrada, con pausa y claridad.',tone:'green'}
];
const biasOptions = [
  {id:'pasado',label:'Herida del Pasado',description:'Reaccioné por algo que me dolió antes, no por lo que está pasando ahora.'},
  {id:'futuro',label:'Miedo al Futuro',description:'Reaccioné intentando controlar lo que aún no ha pasado.'},
  {id:'creencia',label:'Creencia Limitante',description:'Reaccioné asumiendo que «no soy capaz» o «no merezco».'},
  {id:'realidad',label:'Realidad Objetiva',description:'Considero que mi reacción está alineada con los hechos actuales.'}
];
const tags = [
  ['control','Impaciencia / Exceso de Control'],['duda','Inseguridad / Duda'],
  ['limites','Falta de Límites / Ceder'],['aislamiento','Desconexión / Aislamiento'],
  ['perfeccionismo','Perfeccionismo Paralizante'],['empatia','Falta de Empatía']
];
const phases = [
  ['calib1','Pausa y Calibración','¿Qué puedes hacer para darte una pausa?','Ej.: respirar y darme un momento antes de responder.'],
  ['calib2','Contraste Objetivo','¿Cuáles son los hechos que puedes comprobar?','Ej.: me hicieron una pregunta sobre el reporte.'],
  ['calib3','Respuesta Centrada','Con esos hechos, ¿cómo eliges responder?','Ej.: explicar el proceso con tranquilidad.']
];
const empty = () => ({context:'',battery:50,reactivity:'',bias:'',tags:[],calib1:'',calib2:'',calib3:'',learning:''});
const stepTitles=['Observa el momento','Reconoce tu reacción','Elige tu respuesta'];

const STORAGE_DRAFT_KEY = 'neuro_journal_draft_v1';

export default function Journal() {
  const [view,setView]=useState('landing');
  const [step,setStep]=useState(1);
  const [data,setData]=useState(empty);
  const [review,setReview]=useState(false);
  const [session,setSession]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  const [authConfigured,setAuthConfigured]=useState(null);
  const [authError,setAuthError]=useState('');
  const [onboardingCompleted,setOnboardingCompleted]=useState(null);
  const [entries,setEntries]=useState([]);
  const [habits,setHabits]=useState([]);
  const [practices,setPractices]=useState([]);
  const [historyError,setHistoryError]=useState('');
  const [saveError,setSaveError]=useState('');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [showPrivacy,setShowPrivacy]=useState(false);
  const recordId=useRef(null);
  const ownerRef=useRef(null);
  const sessionUserId=session?.user.id||null;

  // Restaurar borrador local al montar
  useEffect(()=>{
    if(typeof window!=='undefined'){
      try{
        clearLegacyAiStorage(localStorage);
        const savedDraft=localStorage.getItem(STORAGE_DRAFT_KEY);
        if(savedDraft){
          const parsed=JSON.parse(savedDraft);
          if(parsed&&typeof parsed==='object'){
            setData(prev=>({...prev,...parsed}));
          }
        }
      }catch{}
    }
  },[]);

  // Guardar borrador automáticamente al cambiar datos
  useEffect(()=>{
    if(typeof window!=='undefined'&&!saved){
      try{
        if(data.context||data.reactivity||data.calib1||data.calib2||data.calib3){
          localStorage.setItem(STORAGE_DRAFT_KEY,JSON.stringify(data));
        }
      }catch{}
    }
  },[data,saved]);

  // Exponer salvaguarda explícita para AccountPanel
  useEffect(()=>{
    if(typeof window!=='undefined'){
      window.neuroSaveCurrentDraft=()=>{
        try{localStorage.setItem(STORAGE_DRAFT_KEY,JSON.stringify(data));}catch{}
      };
    }
    return ()=>{
      if(typeof window!=='undefined'){delete window.neuroSaveCurrentDraft;}
    };
  },[data]);

  const receiveSession=useCallback((next)=>{
    const previousId=ownerRef.current;
    if(previousId!==(next?.user.id||null)) {
      setEntries([]);setHabits([]);setPractices([]);setOnboardingCompleted(null);
    }
    if(ownerRef.current&&ownerRef.current!==next?.user.id){
      setData(empty());setStep(1);setReview(false);setSaved(false);recordId.current=null;
      try{localStorage.removeItem(STORAGE_DRAFT_KEY);}catch{}
    }
    ownerRef.current=next?.user.id||null;
    setView(current=>sessionView(previousId,next?.user.id||null,current));
    setSession(next);
  },[]);
  useEffect(()=>{
    const client=productClient();
    setAuthConfigured(!!client);
    if(!client){setAuthReady(true);return;}
    return observeProductSession(client,{
      onSession:receiveSession,
      onReady:()=>setAuthReady(true),
      onError:setAuthError
    });
  },[receiveSession]);
  useEffect(()=>{
    let alive=true;
    let profileSynced=false;
    setEntries([]);setHabits([]);setPractices([]);setHistoryError('');setOnboardingCompleted(null);
    if(!sessionUserId) return ()=>{alive=false;};

    productClient().from('user_profiles').select('onboarding_completed').eq('id',sessionUserId).maybeSingle()
      .then(({data,error})=>{if(alive&&!error&&!profileSynced)setOnboardingCompleted(data?.onboarding_completed===true);}).catch(()=>{});

    // If there is pending onboarding data in localStorage, sync it to user_profiles
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('neuro_onboarding_temp');
        if (stored) {
          const parsed = JSON.parse(stored);
          productClient().from('user_profiles').upsert({
            id: sessionUserId,
            initial_battery: parsed.initial_battery,
            polarity: parsed.polarity,
            primary_layer: parsed.primary_layer || null,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          }).then(({error}) => {
            if (!error && alive) {
              profileSynced=true;
              setOnboardingCompleted(true);
              localStorage.removeItem('neuro_onboarding_temp');
            }
          }).catch(() => {});
        }
      } catch {}
    }

    productClient().from('journal_entries').select('*').eq('owner_id',sessionUserId).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(20)
      .then(({data,error})=>{if(alive){if(error)setHistoryError('No se pudo recuperar el historial.');else setEntries(data);}});

    // Cargar hábitos y prácticas del usuario
    productClient().from('habits').select('*').eq('owner_id',sessionUserId).order('created_at',{ascending:false})
      .then(({data})=>{if(alive&&data)setHabits(data);});

    productClient().from('habit_practices').select('*').eq('owner_id',sessionUserId)
      .then(({data})=>{if(alive&&data)setPractices(data);});

    return ()=>{alive=false;};
  },[sessionUserId]);

  const saveHabit = async (habitData) => {
    if (!session) return;
    const client = productClient();
    const payload = {
      ...habitData,
      owner_id: session.user.id
    };
    const { data: inserted, error } = await client.from('habits').insert(payload).select().single();
    if (error) throw error;
    if (inserted) {
      setHabits(prev => [inserted, ...prev]);
    }
  };

  const recordPractice = async (habitId) => {
    if (!session) return;
    const client = productClient();
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      habit_id: habitId,
      owner_id: session.user.id,
      practiced_at: today
    };
    const { data: inserted, error } = await client.from('habit_practices').upsert(payload).select().single();
    if (!error && inserted) {
      setPractices(prev => [...prev.filter(p => !(p.habit_id === habitId && p.practiced_at === today)), inserted]);
    }
  };
  const titleRef=useRef(null);
  const setField=(field,value)=>setData(previous=>({...previous,[field]:value}));
  const go=(next)=>{setStep(next);requestAnimationFrame(()=>titleRef.current?.focus());};
  const toggleTag=(id)=>setData(previous=>({...previous,tags:previous.tags.includes(id)?previous.tags.filter(tag=>tag!==id):[...previous.tags,id]}));
  const selectedReaction=reactivityOptions.find(option=>option.id===data.reactivity);
  const selectedBias=biasOptions.find(option=>option.id===data.bias);
  const valid = step===1?!!data.context.trim():step===2?!!data.reactivity&&!!data.bias:phases.every(([field])=>!!data[field].trim());
  function advance(event) {
    event.preventDefault();
    if(!valid) return;
    if(step<3) go(step+1);
    else {setReview(true);requestAnimationFrame(()=>titleRef.current?.focus());}
  }
  async function save() {
    if(saving||saved||!session) return;
    setSaving(true);setSaveError('');
    const owner=session.user.id;
    try {
      recordId.current ||= crypto.randomUUID();
      const payload=buildJournal(data,owner,recordId.current);
      const client=productClient();
      let response=await client.from('journal_entries').insert(payload).select().single();
      if(response.error?.code==='23505') {
        response=await client.from('journal_entries').select('*').eq('id',payload.id).eq('owner_id',owner).single();
        if(response.data&&Object.keys(payload).some(key=>JSON.stringify(response.data[key])!==JSON.stringify(payload[key])))
          throw new Error('El intento anterior guardó una versión distinta. Revisa el historial antes de crear otro registro.');
      }
      if(response.error||!response.data) throw new Error('No se pudo guardar. Tu reflexión sigue aquí; puedes reintentar.');
      if(ownerRef.current!==owner) return;
      setSaved(true);
      try{localStorage.removeItem(STORAGE_DRAFT_KEY);}catch{}
      setEntries(previous=>[response.data,...previous.filter(entry=>entry.id!==response.data.id)].slice(0,20));
    } catch(error) {if(ownerRef.current===owner)setSaveError(error.message||'No se pudo guardar. Puedes reintentar.');}
    finally {setSaving(false);}
  }
  if(!authReady) return <main className="shell"><p role="status">Comprobando acceso…</p></main>;
  return <main className="shell">
    {authError&&<p role="alert">{authError} <button type="button" className="text-link" onClick={()=>window.location.reload()}>Reintentar acceso</button></p>}
    <nav className="nav-bar" aria-label="Navegación principal">
      <div className="nav-brand">
        <span className="brand-mark" aria-hidden="true">◌</span>
        <span>NEURO <strong>CONVERGENCIA</strong></span>
        <span className="edition">BITÁCORA PERSONAL</span>
      </div>
      <div className="nav-actions">
        <button
          type="button"
          className={`nav-btn ${view==='landing'?'active':''}`}
          aria-current={view==='landing'?'page':undefined}
          onClick={()=>setView('landing')}
        >
          🌿 El Mapa del Ser
        </button>
        <button
          type="button"
          className={`nav-btn ${view==='onboarding'?'active':''}`}
          aria-current={view==='onboarding'?'page':undefined}
          onClick={()=>setView('onboarding')}
        >
          ✨ {onboardingCompleted===true?'Revisar introducción':session?'Introducción':'Introducción guiada'}
        </button>
        <button
          type="button"
          className={`nav-btn ${view==='habits'?'active':''}`}
          aria-current={view==='habits'?'page':undefined}
          onClick={()=>setView('habits')}
        >
          🔄 Hábitos Poderosos
        </button>
        <button
          type="button"
          className={`nav-btn ${view==='journal'?'active':''}`}
          aria-current={view==='journal'?'page':undefined}
          onClick={()=>setView('journal')}
        >
          📝 Bitácora {session?'Privada':''}
        </button>
      </div>
    </nav>

    {view==='landing' ? (
      <LandingPage
        signedIn={!!session}
        onGoToJournal={()=>setView('journal')}
        onStartOnboarding={()=>setView('onboarding')}
      />
    ) : view==='onboarding' ? (
      <OnboardingFlow
        onComplete={()=>{
          setView('journal');
          const owner=ownerRef.current;
          if(owner)productClient().from('user_profiles').select('onboarding_completed').eq('id',owner).maybeSingle()
            .then(({data,error})=>{if(ownerRef.current===owner&&!error)setOnboardingCompleted(data?.onboarding_completed===true);}).catch(()=>{});
        }}
        onSkip={()=>setView('journal')}
        session={session}
        configured={authConfigured}
      />
    ) : view==='habits' ? (
      <>
        <AccountPanel session={session} configured={authConfigured}/>
        <HabitsHub
          habits={habits}
          practices={practices}
          onSaveHabit={saveHabit}
          onRecordPractice={recordPractice}
          onGoToJournal={()=>setView('journal')}
          session={session}
        />
      </>
    ) : (
      <>
        <div className="intro"><p className="eyebrow">{session?'CONTINÚA TU PRÁCTICA':'UN MOMENTO PARA TI'}</p><h1>Tu reflexión</h1><p>Observa lo que pasó y elige tu respuesta.</p></div>
        {!session&&<p className="journal-access-note">Puedes escribir ahora y acceder al final para guardar.</p>}
        <section className="journal" aria-label="Registro guiado">
          <div className="progress-header"><span>Registro del momento</span><span>{review?'Revisión':`Paso ${step} de 3`}</span></div>
          <ol className="steps" aria-label="Progreso">{['Observar','Reconocer','Responder'].map((label,index)=><li key={label} aria-current={!review&&step===index+1?'step':undefined} className={step>=index+1?'reached':''}><span>{index+1}</span>{label}</li>)}</ol>
          <div className="content">
            {review?<>
              <p className="eyebrow">TU RESPUESTA, CON CLARIDAD</p><h2 ref={titleRef} tabIndex={-1}>{saved?'Reflexión guardada':'Revisa tu reflexión'}</h2><p className="hint" role="status">{saved?'Tu registro está guardado en tu bitácora privada.':session?'Todavía no está guardado. Revisa los datos antes de confirmar.':'Este borrador aún no está guardado. Accede por correo para habilitar el guardado.'}</p>
              <dl className="review"><div><dt>Detonante</dt><dd>{data.context}</dd></div><div><dt>Energía percibida</dt><dd>{data.battery}%</dd></div><div><dt>Nivel de Reactividad</dt><dd>{selectedReaction?.label}</dd></div><div><dt>Filtro de Sesgo</dt><dd>{selectedBias?.label}</dd></div><div><dt>Foco de Desequilibrio</dt><dd>{data.tags.length?tags.filter(([id])=>data.tags.includes(id)).map(([,label])=>label).join(' · '):'Sin etiquetas seleccionadas'}</dd></div>{phases.map(([field,label])=><div key={field}><dt>{label}</dt><dd>{data[field]}</dd></div>)}{data.learning.trim()&&<div><dt>Integración y Crecimiento</dt><dd>{data.learning}</dd></div>}</dl>
              <AiMirror ownerId={session?.user.id || null} data={data} onAdoptLearning={(val)=>setField('learning',val)}/>
              {saveError&&<p role="alert" className="hint">{saveError}</p>}
              <div className="actions">{saved?<button className="primary" type="button" onClick={()=>{setData(empty());setSaved(false);setReview(false);recordId.current=null;setSaveError('');go(1);}}>Nuevo registro</button>:<><button type="button" className="secondary" disabled={saving} onClick={()=>{setReview(false);go(3);}}>Seguir editando</button>{session?<button type="button" className="primary" disabled={saving} onClick={save}>{saving?'Guardando…':'Guardar registro'}</button>:<button type="button" className="primary" onClick={()=>document.getElementById('login-email')?.focus()}>Acceder para guardar</button>}</>}</div>
            </>:<form onSubmit={advance}>
              <p className="eyebrow">{step===1?'EMPIEZA POR LO QUE VIVISTE':step===2?'SIN JUICIO, SOLO OBSERVACIÓN':'UNA PEQUEÑA ELECCIÓN CONSCIENTE'}</p>
              <h2 ref={titleRef} tabIndex={-1}>{stepTitles[step-1]}</h2>
              {step===1&&<>
                <label className="field-label" htmlFor="context">¿Qué detonó tu reacción?</label><p className="hint" id="context-help">Una frase es suficiente. Describe el momento.</p>
                <textarea id="context" aria-describedby="context-help" required maxLength={500} rows={3} value={data.context} onChange={event=>setField('context',event.target.value)} placeholder="Ej.: me pidieron explicar un proceso en la reunión…"/>
                <div className="energy"><div className="energy-heading"><label htmlFor="battery">Batería / Energía Actual</label><output htmlFor="battery">{data.battery}%</output></div><p className="hint">¿Cuánta energía sientes disponible ahora?</p><input id="battery" type="range" min={0} max={100} step={5} value={data.battery} onChange={event=>setField('battery',Number(event.target.value))}/><div className="range-labels"><span>Agotado · 0%</span><span>Óptimo · 100%</span></div></div>
              </>}
              {step===2&&<>
                <fieldset><legend>Nivel de Reactividad</legend><p className="hint">Elige el estado que mejor describe tu reacción.</p><div className="options">{reactivityOptions.map(option=><label key={option.id} className={`option ${option.tone} ${data.reactivity===option.id?'selected':''}`}><input type="radio" name="reactivity" value={option.id} required checked={data.reactivity===option.id} onChange={()=>setField('reactivity',option.id)}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div></fieldset>
                <fieldset><legend>Filtro de Sesgo</legend><p className="hint">¿Qué pudo influir en tu respuesta?</p><div className="options">{biasOptions.map(option=><label key={option.id} className={`option ${data.bias===option.id?'selected':''}`}><input type="radio" name="bias" value={option.id} required checked={data.bias===option.id} onChange={()=>setField('bias',option.id)}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div></fieldset>
              </>}
              {step===3&&<>
                <fieldset><legend>Foco de Desequilibrio</legend><p className="hint">Selecciona los patrones que reconoces. Puedes elegir varios o continuar sin etiquetas.</p><div className="tags">{tags.map(([id,label])=><label key={id} className={`tag ${data.tags.includes(id)?'selected':''}`}><input type="checkbox" checked={data.tags.includes(id)} onChange={()=>toggleTag(id)}/>{label}</label>)}</div></fieldset>
                <p className="reaction-note">Observaste: <strong>{selectedReaction?.label}</strong></p>
                {phases.map(([field,label,prompt,placeholder],index)=><div key={field} className="phase"><span className="phase-number" aria-hidden="true">0{index+1}</span><div><label htmlFor={field}>{label}</label><p id={field+'-help'} className="hint">{prompt}</p><textarea id={field} required maxLength={1000} rows={2} aria-describedby={field+'-help'} value={data[field]} onChange={event=>setField(field,event.target.value)} placeholder={placeholder}/></div></div>)}
                <label className="field-label" htmlFor="learning">Integración y Crecimiento <span className="optional">· opcional</span></label><textarea id="learning" maxLength={1000} rows={2} value={data.learning} onChange={event=>setField('learning',event.target.value)} placeholder="¿Qué te llevas de este momento?"/>
              </>}
              <div className="actions">{step>1&&<button type="button" className="secondary" onClick={()=>go(step-1)}>Atrás</button>}<button type="submit" className="primary" disabled={!valid}>{step===3?'Revisar reflexión':'Continuar'} <span aria-hidden="true">→</span></button></div>
            </form>}
          </div>
        </section>
        <AccountPanel session={session} configured={authConfigured}/>
        <GamificationPanel entries={entries} habits={habits} practices={practices}/>
        {session&&<section className="history" aria-label="Historial privado"><h2>Tu bitácora</h2><p className="hint">Últimos 20 registros guardados.</p>{historyError&&<p role="alert">{historyError}</p>}{!entries.length&&!historyError&&<p className="hint">Todavía no hay registros guardados.</p>}{entries.map(entry=><details key={entry.id}><summary><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString('es-PY')}</time><span>{entry.context}</span></summary><dl className="review"><div><dt>Energía percibida</dt><dd>{entry.battery}%</dd></div><div><dt>Reactividad</dt><dd>{reactivityOptions.find(option=>option.id===entry.reactivity)?.label}</dd></div><div><dt>Sesgo</dt><dd>{biasOptions.find(option=>option.id===entry.bias)?.label}</dd></div><div><dt>Focos</dt><dd>{tags.filter(([id])=>entry.tags.includes(id)).map(([,label])=>label).join(' · ')||'Sin etiquetas'}</dd></div>{phases.map(([field,label])=><div key={field}><dt>{label}</dt><dd>{entry[field]}</dd></div>)}{entry.learning&&<div><dt>Aprendizaje</dt><dd>{entry.learning}</dd></div>}</dl></details>)}</section>}
      </>
    )}

    {showPrivacy&&(
      <ModalDialog labelledBy="privacy-title" onClose={()=>setShowPrivacy(false)}>
        <div className="privacy-modal-card">
          <div className="privacy-modal-header">
            <h3 id="privacy-title">🔒 Privacidad y Seguridad de tus Datos</h3>
            <button type="button" className="close-btn" onClick={()=>setShowPrivacy(false)} aria-label="Cerrar">✕</button>
          </div>
          <div className="privacy-modal-body">
            <p><strong>1. Datos y acceso:</strong> Tus reflexiones se guardan en Supabase cuando confirmas el guardado. El aislamiento por usuario no equivale a cifrado de extremo a extremo ni impide todo acceso administrativo autorizado.</p>
            <p><strong>2. Aislamiento Estricto (RLS):</strong> Utilizamos Row-Level Security en la base de datos para restringir la lectura e inserción desde la aplicación a los registros de tu usuario autenticado.</p>
            <p><strong>3. Conservación Local de Borradores:</strong> Tu borrador se guarda en localStorage para recuperarlo al recargar. Otros usuarios del mismo perfil de navegador y scripts del sitio podrían acceder a él. Puedes borrarlo eliminando los datos del sitio; el navegador también puede eliminarlo.</p>
            <p><strong>4. Sin Fines Publicitarios:</strong> La aplicación no vende tus reflexiones ni las utiliza para publicidad. La consulta opcional a xAI descrita a continuación requiere tu autorización y supone procesamiento por un tercero.</p>
            <p><strong>5. Contenido de Terceros (YouTube):</strong> El video de presentación se aloja en YouTube (Google) en modo de privacidad mejorada. No se carga ni se establecen cookies de YouTube hasta que decides reproducirlo.</p>
            <p><strong>6. IA externa opcional (xAI):</strong> Solo al autorizar y pulsar consultar se envían al servidor de esta aplicación y a xAI la situación, energía percibida, reactividad, sesgo, etiquetas y los tres pasos de reflexión. No se incluyen por diseño tu correo, identificador de cuenta ni aprendizaje final, pero el texto que escribas puede contener datos personales. Evita incluirlos. xAI aplica sus propias condiciones de procesamiento, conservación y entrenamiento; esta aplicación no garantiza su exclusión. La guía local funciona sin enviar datos. Retirar el consentimiento evita nuevas consultas, sin revertir envíos previos.</p>
            <p><strong>7. Clave y respuestas de IA:</strong> La clave personal y el resultado permanecen en memoria durante la vista de reflexión. No se guardan en localStorage. La clave pasa por nuestro servidor hacia xAI al consultar. Desmarcar la autorización borra clave y resultado de la vista. Si adoptas el micro-paso, pasa al borrador y solo se almacena en tu bitácora cuando guardas. Las claves y cachés de IA de versiones anteriores se intentan eliminar al abrir la aplicación.</p>
            <p><strong>8. Límites de consultas:</strong> El servidor verifica tu sesión con Supabase y utiliza tu identificador de cuenta para reservar cuota. En Supabase se guardan contadores por usuario y globales, sin texto de reflexión ni claves de IA. Las consultas fallidas también pueden consumir un cupo. Los contadores antiguos se eliminan durante nuevas reservas una vez que su ventana tiene más de dos días completos de antigüedad.</p>
          </div>
          <div className="privacy-modal-footer">
            <button type="button" className="primary" onClick={()=>setShowPrivacy(false)}>Entendido</button>
          </div>
        </div>
      </ModalDialog>
    )}

    <footer>
      <span>Tu energía es una percepción personal para tu propia calibración diaria.</span>
      <div className="footer-links">
        <span>Tu borrador se conserva en este navegador. Evita compartir su perfil.</span>
        <button type="button" className="text-link" onClick={()=>setShowPrivacy(true)}>Política de Privacidad y Seguridad</button>
      </div>
    </footer>
  </main>;
}
