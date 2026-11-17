const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync(__dirname+'/expense-entry.js','utf8');
function setup(){
  const elements={},events={},timers=new Map();let sequence=0;
  function element(){return {dataset:{},style:{},hidden:false,src:'',listeners:{},children:[],
    addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(k,v){this[k]=v;},
    removeAttribute(k){delete this[k];},append(...nodes){this.children.push(...nodes);},
    showModal(){},close(){this.listeners.close?.();},focus(){}};}
  for(const id of ['pm-dialog','pm-open','pm-frame','pm-close','sms-signout'])elements[id]=element();
  elements['pm-frame'].dataset.src='https://script.google.com/macros/s/test/exec';
  vm.runInNewContext(code,{document:{getElementById:id=>elements[id],createElement:element,body:{style:{}}},
    window:{addEventListener:(k,fn)=>events[k]=fn},URL,crypto:{randomUUID:()=>String(++sequence)},
    setTimeout:fn=>{timers.set(sequence,fn);return sequence;},clearTimeout:id=>timers.delete(id)});
  return {elements,events,timers};
}
test('isolates cookies before loading and masks unknown iframe content',()=>{
  const {elements:e}=setup();e['pm-open'].listeners.click();
  assert.equal(e['pm-frame'].credentialless,'');assert.equal(e['pm-frame'].style.visibility,'hidden');
  assert.match(e['pm-frame'].src,/channel=1/);
});
test('wrong origin and stale channel cannot reveal the iframe',()=>{
  const {elements:e,events}=setup();e['pm-open'].listeners.click();
  for(const [origin,channel] of [['https://evil.example','1'],['https://n-nyv2a7tyteysbqzgtso5lxujk4ijgczxqkvrlki-0lu-script.googleusercontent.com','stale']])
    events.message({origin,source:{},data:{type:'ss-expense-ready',channel}});
  assert.equal(e['pm-frame'].style.visibility,'hidden');
});
test('valid ready reveals form; successful reopen retains it',()=>{
  const {elements:e,events,timers}=setup();e['pm-open'].listeners.click();
  events.message({origin:'https://n-nyv2a7tyteysbqzgtso5lxujk4ijgczxqkvrlki-0lu-script.googleusercontent.com',source:{},data:{type:'ss-expense-ready',channel:'1'}});
  assert.equal(e['pm-frame'].style.visibility,'visible');assert.equal(timers.size,0);
  e['pm-open'].listeners.click();assert.equal(e['pm-frame'].dataset.channel,'1');
});
test('timeout offers retry with a new channel; signout destroys session',()=>{
  const {elements:e,timers}=setup();e['pm-open'].listeners.click();[...timers.values()][0]();
  const panel=e['pm-dialog'].children[0],retry=panel.children[1];assert.equal(retry.hidden,false);
  retry.listeners.click();assert.equal(e['pm-frame'].dataset.channel,'2');
  e['sms-signout'].listeners.click();assert.equal(e['pm-frame'].src,undefined);assert.equal(timers.size,0);
});
