(() => {
  'use strict';
  const dialog=document.getElementById('pm-dialog'),opener=document.getElementById('pm-open'),frame=document.getElementById('pm-frame');
  const expectedOrigin='https://n-nyv2a7tyteysbqzgtso5lxujk4ijgczxqkvrlki-0lu-script.googleusercontent.com';
  const loading=document.createElement('div'),message=document.createElement('p'),retry=document.createElement('button');
  loading.id='pm-loading';loading.setAttribute('role','status');loading.hidden=true;
  retry.type='button';retry.textContent='重新載入表單';retry.hidden=true;
  loading.append(message,retry);dialog.append(loading);
  let previousOverflow='',timer=null,ready=false;
  function loadFrame(){
    clearTimeout(timer);ready=false;loading.hidden=false;retry.hidden=true;
    message.textContent='正在載入費用表單…';frame.style.visibility='hidden';
    // Isolate Google's multi-account cookies; server-side Google token checks remain required.
    frame.setAttribute('credentialless','');
    const url=new URL(frame.dataset.src);
    frame.dataset.channel=crypto.randomUUID();
    url.searchParams.set('channel',frame.dataset.channel);frame.src=url.href;
    timer=setTimeout(()=>{
      message.textContent='費用表單未能載入，尚未送出任何資料。請重新載入表單；若仍失敗，請聯絡數位行銷部。';
      retry.hidden=false;
    },20000);
  }
  retry.addEventListener('click',loadFrame);
  window.addEventListener('message',event=>{
    if(event.origin!==expectedOrigin||!event.source||event.data?.type!=='ss-expense-ready'||
      !frame.dataset.channel||event.data.channel!==frame.dataset.channel)return;
    clearTimeout(timer);ready=true;loading.hidden=true;frame.style.visibility='visible';
  });
  opener.addEventListener('click',()=>{
    if(!frame.src||!ready)loadFrame();
    previousOverflow=document.body.style.overflow;
    dialog.showModal();document.body.style.overflow='hidden';
  });
  document.getElementById('pm-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;opener.focus();});
  // Destroy the embedded session when the dashboard signs out.
  function clearSession(){clearTimeout(timer);ready=false;loading.hidden=true;dialog.close();frame.removeAttribute('src');delete frame.dataset.channel;}
  document.getElementById('sms-signout').addEventListener('click',clearSession);
  window.addEventListener('ss:expense-signout',clearSession);
})();
