const REACTIVITY=['impulso','emocion','mente','observador'];
const BIAS=['pasado','futuro','creencia','realidad'];
const TAGS=['control','duda','limites','aislamiento','perfeccionismo','empatia'];
function buildJournal(data,owner,id) {
  if(!owner||!id) throw new Error('Debes iniciar sesión antes de guardar.');
  const text=(key,max,required=true)=>{
    if(typeof data[key]!=='string') throw new Error('Campo inválido: '+key);
    const value=data[key].trim();
    if((required&&!value)||value.length>max) throw new Error('Revisa el campo '+key+'.');
    return value;
  };
  if(!Number.isInteger(data.battery)||data.battery<0||data.battery>100||data.battery%5!==0) throw new Error('Energía inválida.');
  if(!REACTIVITY.includes(data.reactivity)||!BIAS.includes(data.bias)) throw new Error('Selecciona reactividad y sesgo válidos.');
  if(!Array.isArray(data.tags)||data.tags.some(tag=>!TAGS.includes(tag))||new Set(data.tags).size!==data.tags.length) throw new Error('Etiquetas inválidas.');
  return {id,owner_id:owner,context:text('context',500),battery:data.battery,reactivity:data.reactivity,bias:data.bias,
    tags:[...data.tags],calib1:text('calib1',1000),calib2:text('calib2',1000),calib3:text('calib3',1000),learning:text('learning',1000,false)};
}
module.exports={buildJournal};
