/* Eskedals Univers – fjernkontrollstyring for strømmetjenester (TV 2 Play, Netflix m.fl.)
   Lastes inn i tjenestens eget vindu av Windows-appen. Rører ikke avspilling eller kopibeskyttelse:
   den flytter bare fokus med piltastene, klikker med OK og går tilbake med Tilbake. */
(function(){
  if(window.__euNav)return;window.__euNav=1;
  const host=location.hostname;
  const css=`
  html{scrollbar-width:none!important}
  ::-webkit-scrollbar{width:0!important;height:0!important}
  body.eu-kb, body.eu-kb *{cursor:none!important}
  .eu-f{outline:4px solid #fff!important;outline-offset:4px!important;border-radius:10px!important;box-shadow:0 0 0 8px rgba(124,92,255,.55),0 12px 40px rgba(0,0,0,.6)!important;transform:scale(1.04);transition:transform .12s,box-shadow .12s!important;z-index:5;position:relative}
  #intercom-container,#intercom-frame,.intercom-lightweight-app,[class*="intercom-launcher"],iframe[title*="chat" i],iframe[title*="Chat" i],[id*="chat-widget" i],[class*="ChatButton"],[class*="chat-launcher" i],#launcher,#hubspot-messages-iframe-container,[data-testid*="chat" i]{display:none!important}
  #eu-hint{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(10,12,20,.88);color:#fff;font:600 18px/1.3 system-ui,sans-serif;padding:12px 22px;border-radius:14px;z-index:2147483647;pointer-events:none;transition:opacity .4s}
  `;
  const st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
  let cur=null;
  const hint=(t,ms)=>{let h=document.getElementById('eu-hint');if(!h){h=document.createElement('div');h.id='eu-hint';document.documentElement.appendChild(h)}h.textContent=t;h.style.opacity='1';clearTimeout(hint.t);hint.t=setTimeout(()=>{h.style.opacity='0'},ms||2500)};
  const SEL='a[href],button,[role="button"],[role="link"],[role="tab"],[role="menuitem"],[tabindex]:not([tabindex="-1"]),input,select,[data-testid*="card" i],[class*="card" i][onclick]';
  const vis=el=>{if(!el||!el.isConnected)return false;const r=el.getBoundingClientRect();if(r.width<24||r.height<18)return false;if(r.bottom<-400||r.top>innerHeight+2000)return false;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;if(el.closest('[aria-hidden="true"]'))return false;return true};
  function cands(){const all=[...document.querySelectorAll(SEL)].filter(vis);
    /* fjern elementer som ligger inni et annet kandidat-element (bruk det ytterste kortet) */
    const set=new Set(all);return all.filter(el=>{let p=el.parentElement;while(p){if(set.has(p)){const a=p.getBoundingClientRect(),b=el.getBoundingClientRect();if(a.width*a.height<b.width*b.height*3)return false}p=p.parentElement}return true})}
  const ctr=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
  function pick(dir){const list=cands();if(!list.length)return null;
    if(!cur||!cur.isConnected||!vis(cur)){return list.sort((a,b)=>{const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();return (A.top-B.top)||(A.left-B.left)}).find(el=>el.getBoundingClientRect().top>=0)||list[0]}
    const r=cur.getBoundingClientRect(),c=ctr(r);let best=null,bs=1e12;
    for(const el of list){if(el===cur||cur.contains(el)||el.contains(cur))continue;const q=el.getBoundingClientRect(),d=ctr(q);
      const dx=d.x-c.x,dy=d.y-c.y;let main,cross;
      if(dir==='ArrowRight'){if(q.left<r.right-8)continue;main=dx;cross=Math.abs(dy)}
      else if(dir==='ArrowLeft'){if(q.right>r.left+8)continue;main=-dx;cross=Math.abs(dy)}
      else if(dir==='ArrowDown'){if(q.top<r.bottom-8)continue;main=dy;cross=Math.abs(dx)}
      else{if(q.bottom>r.top+8)continue;main=-dy;cross=Math.abs(dx)}
      const s=main+cross*(dir==='ArrowLeft'||dir==='ArrowRight'?3:1.2);if(s<bs){bs=s;best=el}}
    return best}
  function focusEl(el){if(!el)return;if(cur)cur.classList.remove('eu-f');cur=el;el.classList.add('eu-f');
    try{el.focus({preventScroll:true})}catch(_){}
    el.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
    /* horisontale rader som ikke ruller med scrollIntoView */
    let p=el.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth){const a=el.getBoundingClientRect(),b=p.getBoundingClientRect();if(a.left<b.left||a.right>b.right)p.scrollLeft+=a.left-b.left-(b.width-a.width)/2;break}p=p.parentElement}}
  const video=()=>{const v=[...document.querySelectorAll('video')].find(v=>v.readyState>0&&v.getBoundingClientRect().width>innerWidth*.5);return v||null};
  function back(){if(history.length>1){history.back();return}hint('Trykk 🏠 Hjem for å gå tilbake til Eskedals Univers',3500);try{console.log('EU:close')}catch(_){}setTimeout(()=>{try{window.close()}catch(_){}},300)}
  const fs=()=>{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})};
  document.addEventListener('keydown',e=>{
    const k=e.key;const t=e.target,typing=t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable);
    document.body&&document.body.classList.add('eu-kb');
    if(!typing&&/^(Arrow|Enter)/.test(k))fs();
    const v=video();
    if(v&&!typing){ /* avspilling: la spilleren styre, men gi enkle spoleknapper */
      if(k==='Enter'||k===' '||k==='MediaPlayPause'){e.preventDefault();e.stopPropagation();v.paused?v.play():v.pause();hint(v.paused?'⏸ Pause':'▶ Spiller',900);return}
      if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();e.stopPropagation();v.currentTime=Math.max(0,v.currentTime+(k==='ArrowRight'?10:-10));hint((k==='ArrowRight'?'⏩ +10 s':'⏪ −10 s'),900);return}
      if(k==='Escape'||k==='Backspace'||k==='BrowserBack'){e.preventDefault();e.stopPropagation();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});back();return}
      return}
    if(/^Arrow/.test(k)){if(typing&&(k==='ArrowLeft'||k==='ArrowRight'))return;e.preventDefault();e.stopPropagation();focusEl(pick(k));return}
    if(k==='Enter'&&cur&&!typing){e.preventDefault();e.stopPropagation();cur.click();return}
    if((k==='Escape'||k==='BrowserBack'||(k==='Backspace'&&!typing))){e.preventDefault();e.stopPropagation();if(typing){t.blur();return}back();return}
  },true);
  document.addEventListener('mousemove',()=>{document.body&&document.body.classList.remove('eu-kb')},true);
  /* når siden bytter innhold (enkeltside-app), velg første element på nytt */
  let lastUrl=location.href;setInterval(()=>{if(location.href!==lastUrl){lastUrl=location.href;cur=null;setTimeout(()=>{if(!video())focusEl(pick('ArrowDown'))},1200)}},700);
  setTimeout(()=>{if(!video()){focusEl(pick('ArrowDown'));hint('Bruk piltastene og OK · Tilbake går tilbake',3500)}},1500);
})();
