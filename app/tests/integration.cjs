// Runs only against the explicitly named product project; never SCA Matrix.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {buildJournal}=require('../src/lib/journal-record.cjs');
const parse=file=>Object.fromEntries(fs.readFileSync(file,'utf8').trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
async function main(){
  const cloud=process.argv[2]==='cloud';
  let url,anon,key;
  if(cloud){const env=parse('.env.cloud.local');url=env.NEXT_PUBLIC_SUPABASE_URL;anon=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;key=parse('.env.cloud-admin.local').SUPABASE_SERVICE_ROLE_KEY;if(url!=='https://cgokgnbcdozzyjrsitft.supabase.co')throw Error('Destino Cloud inesperado');}
  else {const r=cp.spawnSync('supabase',['status','--output','json'],{encoding:'utf8',shell:true,windowsHide:true});if(r.status!==0)throw Error('Stack local no disponible');const env=JSON.parse(r.stdout);url=env.API_URL;anon=env.ANON_KEY;key=env.SERVICE_ROLE_KEY;if(url!=='http://127.0.0.1:56521')throw Error('Destino Docker inesperado');}
  const admin=createClient(url,key,{auth:{persistSession:false}}),users=[];
  try{
    const clients=[];
    for(let i=0;i<2;i++){
      const email=`n3-test-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(24).toString('base64url');
      const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;users.push(data.user.id);
      const client=createClient(url,anon,{auth:{persistSession:false}});const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;clients.push(client);
    }
    const sample={context:'VALIDACIÓN TÉCNICA N3',battery:0,reactivity:'observador',bias:'realidad',tags:['control'],calib1:'Pausa de prueba',calib2:'Hechos de prueba',calib3:'Respuesta de prueba',learning:''};
    const record=buildJournal(sample,users[0],crypto.randomUUID());
    const insert=await clients[0].from('journal_entries').insert(record).select().single();if(insert.error)throw insert.error;assert.equal(insert.data.battery,0);
    const owner=await clients[0].from('journal_entries').select('*').eq('id',record.id);assert.ifError(owner.error);assert.equal(owner.data.length,1);
    const refreshed=createClient(url,anon,{auth:{persistSession:false}});const current=await clients[0].auth.getSession();const resume=await refreshed.auth.setSession(current.data.session);assert.ifError(resume.error);const recovered=await refreshed.from('journal_entries').select('*').eq('id',record.id);assert.ifError(recovered.error);assert.equal(recovered.data.length,1);
    const other=await clients[1].from('journal_entries').select('*').eq('id',record.id);assert.ifError(other.error);assert.equal(other.data.length,0);
    const forged=await clients[1].from('journal_entries').insert({...record,id:crypto.randomUUID()});assert.ok(forged.error);
    const guest=createClient(url,anon,{auth:{persistSession:false}});const guestRead=await guest.from('journal_entries').select('*');assert.ok(guestRead.error);
    const duplicate=await clients[0].from('journal_entries').insert(record);assert.equal(duplicate.error?.code,'23505');
    const invalid=await clients[0].from('journal_entries').insert({...record,id:crypto.randomUUID(),context:'  '});assert.ok(invalid.error);
    console.log(JSON.stringify({environment:cloud?'Cloud':'Docker',checks:['insert','zero preserved','session recovery','cross-user read denied','forged owner denied','guest denied','duplicate denied','database whitespace rejected'],passed:true}));
  }finally{
    for(const id of users){const {error}=await admin.auth.admin.deleteUser(id);if(error)throw Error('No se pudo retirar usuario ficticio de prueba');}
    console.log('Usuarios ficticios y registros de prueba retirados mediante cascada.');
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
