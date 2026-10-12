const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildJournal}=require('../src/lib/journal-record.cjs');
const sample=()=>({context:'  Pregunta laboral  ',battery:50,reactivity:'observador',bias:'realidad',tags:['control','duda'],calib1:' Pausar ',calib2:' Hechos ',calib3:' Responder ',learning:''});
test('preserva cero y recorta textos sin inventar fechas',()=>{
  const result=buildJournal({...sample(),battery:0},'owner','id');
  assert.equal(result.battery,0);assert.equal(result.context,'Pregunta laboral');assert.equal(result.owner_id,'owner');assert.equal(result.id,'id');assert.equal(result.created_at,undefined);
});
test('rechaza espacios y exceso de longitud',()=>{
  assert.throws(()=>buildJournal({...sample(),calib2:'   '},'owner','id'));
  assert.throws(()=>buildJournal({...sample(),context:'a'.repeat(501)},'owner','id'));
});
test('rechaza categorías, energía y etiquetas fuera del catálogo',()=>{
  for(const patch of [{battery:101},{battery:3},{reactivity:'otra'},{bias:'otra'},{tags:['duda','duda']},{tags:['otra']}])assert.throws(()=>buildJournal({...sample(),...patch},'owner','id'));
});
test('exige identidad y no modifica el borrador ante error',()=>{
  const data=sample(),before=JSON.stringify(data);assert.throws(()=>buildJournal(data,null,'id'));assert.equal(JSON.stringify(data),before);
});
