/* Eskedals Univers – fjernkontrollstyring for strømmetjenester (TV 2 Play, Netflix m.fl.)
   Lastes inn i tjenestens eget vindu (Edge-tillegg). Rører ikke avspilling eller kopibeskyttelse:
   den flytter bare fokus med piltastene, klikker med OK og går tilbake med Tilbake.
   v2: markeringen tegnes som egen ramme over elementet (endrer ikke sidens layout),
       og alt som er klikkbart (også profil-/brukerknapper uten rolle) kan nås. */
(function(){
  if(window.__euNav)return;window.__euNav=2;
  const css=`
  html{scrollbar-width:none!important}
  ::-webkit-scrollbar{width:0!important;height:0!important}
  html.eu-kb, html.eu-kb body{cursor:none!important}
  #eu-ring{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483646;border:4px solid #fff;border-radius:12px;
    box-shadow:0 0 0 4px rgba(124,92,255,.75),0 0 28px rgba(124,92,255,.55);transition:left .12s ease,top .12s ease,width .12s ease,height .12s ease,opacity .2s;opacity:0;box-sizing:border-box}
  #intercom-container,#intercom-frame,.intercom-lightweight-app,[class*="intercom-launcher"],iframe[title*="chat" i],[id*="chat-widget" i],[class*="ChatButton"],[class*="chat-launcher" i],#launcher,#hubspot-messages-iframe-container,[data-testid*="chat" i]{display:none!important}
  #eu-hint{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:rgba(10,12,20,.88);color:#fff;font:600 18px/1.3 system-ui,sans-serif;padding:12px 22px;border-radius:14px;z-index:2147483647;pointer-events:none;transition:opacity .4s}
  `;
  const st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
  let cur=null,ring=null;
  const hint=(t,ms)=>{let h=document.getElementById('eu-hint');if(!h){h=document.createElement('div');h.id='eu-hint';document.documentElement.appendChild(h)}h.textContent=t;h.style.opacity='1';clearTimeout(hint.t);hint.t=setTimeout(()=>{h.style.opacity='0'},ms||2500)};
  const SEL='a[href],button,[role="button"],[role="link"],[role="tab"],[role="menuitem"],[role="option"],[role="switch"],[role="checkbox"],[aria-haspopup],[tabindex]:not([tabindex="-1"]),input:not([type="hidden"]),select,summary,[onclick],[data-testid*="card" i],[data-testid*="profile" i],[data-testid*="avatar" i],[data-testid*="user" i],[class*="avatar" i],[class*="profile" i][class*="button" i],[class*="profile-icon" i]';
  const vis=el=>{if(!el||!el.isConnected||el.id==='eu-ring'||el.id==='eu-hint')return false;const r=el.getBoundingClientRect();if(r.width<16||r.height<14)return false;if(r.bottom<-400||r.top>innerHeight+2000||r.right<-50||r.left>innerWidth+3000)return false;const s=getComputedStyle(el);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0||s.pointerEvents==='none')return false;if(el.closest('[aria-hidden="true"],[inert]'))return false;return true};
  /* elementer som ser klikkbare ut (cursor:pointer) men mangler rolle – f.eks. brukerknappen øverst til høyre */
  function pointerEls(){const out=[];
    try{const all=document.body?document.body.getElementsByTagName('*'):[];const n=Math.min(all.length,9000);
      for(let i=0;i<n;i++){const el=all[i];if(el.closest('svg')&&el.tagName.toLowerCase()!=='svg')continue;const s=getComputedStyle(el);if(s.cursor!=='pointer')continue;
        const p=el.parentElement;if(p&&getComputedStyle(p).cursor==='pointer')continue; /* bare ytterste */
        out.push(el)}}catch(_){}
    return out}
  function cands(){const set=new Set([...document.querySelectorAll(SEL)]);for(const el of pointerEls())set.add(el);
    const all=[...set].filter(vis);const S=new Set(all);
    /* fjern elementer som ligger inni et annet kandidat-element (bruk det ytterste kortet), med mindre det ytre er mye større (en hel rad/meny) */
    return all.filter(el=>{let p=el.parentElement;while(p){if(S.has(p)){const a=p.getBoundingClientRect(),b=el.getBoundingClientRect();if(a.width*a.height<b.width*b.height*3)return false}p=p.parentElement}
      /* ytre element som inneholder flere kandidater er en beholder – hopp over */
      let inner=0;for(const o of all){if(o!==el&&el.contains(o)){const a=el.getBoundingClientRect(),b=o.getBoundingClientRect();if(a.width*a.height>=b.width*b.height*3&&++inner>1)return false}}
      return true})}
  /* synlig område: klipp mot foreldre med overflow:hidden og mot skjermen, og bruk bildet om kortet er større enn bildet */
  function visRect(el){let r=el.getBoundingClientRect();let L=r.left,T=r.top,R=r.right,B=r.bottom;
    const im=[...el.querySelectorAll('img,picture,video,canvas')].map(x=>x.getBoundingClientRect()).filter(q=>q.width>20&&q.height>20).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
    if(im&&im.width*im.height>r.width*r.height*.3){const txt=el.innerText&&el.innerText.trim();if(!txt||im.height>r.height*.7){L=Math.max(L,im.left);T=Math.max(T,im.top);R=Math.min(R,im.right);B=Math.min(B,im.bottom)}}
    let p=el.parentElement;while(p&&p!==document.documentElement){const s=getComputedStyle(p);if(s.overflow!=='visible'||s.overflowX!=='visible'||s.overflowY!=='visible'){const q=p.getBoundingClientRect();let l=L,t=T,rr=R,b=B;if(/hidden|clip|auto|scroll/.test(s.overflowX)){l=Math.max(L,q.left);rr=Math.min(R,q.right)}if(/hidden|clip|auto|scroll/.test(s.overflowY)){t=Math.max(T,q.top);b=Math.min(B,q.bottom)}
        /* bare klipp når det gir mening (absolutt plasserte barn klippes ikke alltid av forelderen) */
        if((rr-l)*(b-t)>=(R-L)*(B-T)*.35&&rr>l&&b>t){L=l;T=t;R=rr;B=b}}p=p.parentElement}
    L=Math.max(L,0);T=Math.max(T,0);R=Math.min(R,innerWidth);B=Math.min(B,innerHeight);
    return {left:L,top:T,right:R,bottom:B,width:Math.max(0,R-L),height:Math.max(0,B-T)}}
  function drawRing(){if(!ring){ring=document.createElement('div');ring.id='eu-ring';document.documentElement.appendChild(ring)}
    if(!cur||!cur.isConnected||!document.documentElement.classList.contains('eu-kb')){ring.style.opacity='0';return}
    const v=visRect(cur);if(v.width<6||v.height<6){ring.style.opacity='0';return}
    const pad=3;ring.style.left=(v.left-pad)+'px';ring.style.top=(v.top-pad)+'px';ring.style.width=(v.width+pad*2)+'px';ring.style.height=(v.height+pad*2)+'px';
    const br=parseFloat(getComputedStyle(cur).borderRadius)||8;ring.style.borderRadius=Math.min(br+pad,v.height/2+pad)+'px';ring.style.opacity='1'}
  let raf=0;const loop=()=>{drawRing();raf=requestAnimationFrame(loop)};
  const ctr=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
  function pick(dir){const list=cands();if(!list.length)return null;
    if(!cur||!cur.isConnected||!vis(cur)){return list.sort((a,b)=>{const A=a.getBoundingClientRect(),B=b.getBoundingClientRect();return (A.top-B.top)||(A.left-B.left)}).find(el=>el.getBoundingClientRect().top>=0)||list[0]}
    const r=cur.getBoundingClientRect(),c=ctr(r);let best=null,bs=1e12;
    for(const el of list){if(el===cur||cur.contains(el)||el.contains(cur))continue;const q=el.getBoundingClientRect(),d=ctr(q);
      const dx=d.x-c.x,dy=d.y-c.y;let main,cross,ov;
      if(dir==='ArrowRight'){if(q.left<r.right-8&&d.x<=c.x+4)continue;main=Math.max(0,q.left-r.right);cross=Math.abs(dy);ov=Math.min(q.bottom,r.bottom)-Math.max(q.top,r.top)}
      else if(dir==='ArrowLeft'){if(q.right>r.left+8&&d.x>=c.x-4)continue;main=Math.max(0,r.left-q.right);cross=Math.abs(dy);ov=Math.min(q.bottom,r.bottom)-Math.max(q.top,r.top)}
      else if(dir==='ArrowDown'){if(q.top<r.bottom-8&&d.y<=c.y+4)continue;main=Math.max(0,q.top-r.bottom);cross=Math.abs(dx);ov=Math.min(q.right,r.right)-Math.max(q.left,r.left)}
      else{if(q.bottom>r.top+8&&d.y>=c.y-4)continue;main=Math.max(0,r.top-q.bottom);cross=Math.abs(dx);ov=Math.min(q.right,r.right)-Math.max(q.left,r.left)}
      /* elementer som overlapper i samme rad/kolonne foretrekkes sterkt */
      const hz=dir==='ArrowLeft'||dir==='ArrowRight';const s=main+(ov>0?cross*.15:cross*(hz?3:1.5)+(hz?1600:250));if(s<bs){bs=s;best=el}}
    /* opp fra øverste rad: gå til toppmenyen / brukerknappen selv om den er langt unna */
    return best}
  function focusEl(el){if(!el)return;cur=el;
    try{el.focus({preventScroll:true})}catch(_){}
    const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-40)el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});
    /* horisontale rader som ikke ruller med scrollIntoView */
    let p=el.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(/(auto|scroll|hidden)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+4){const a=el.getBoundingClientRect(),b=p.getBoundingClientRect();if(a.left<b.left||a.right>b.right){try{p.scrollBy({left:a.left-b.left-(b.width-a.width)/2,behavior:'smooth'})}catch(_){p.scrollLeft+=a.left-b.left-(b.width-a.width)/2}}break}p=p.parentElement}
    /* sider som lager sin egen hover-effekt */
    try{el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));el.dispatchEvent(new MouseEvent('mouseenter'))}catch(_){}
    if(!raf)loop()}
  function activate(el){const tag=el.tagName.toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea'){el.focus();return}
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,o={bubbles:true,cancelable:true,clientX:x,clientY:y,view:window};
    try{el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new MouseEvent('mousedown',o));el.dispatchEvent(new PointerEvent('pointerup',o));el.dispatchEvent(new MouseEvent('mouseup',o))}catch(_){}
    el.click()}
  const video=()=>{const v=[...document.querySelectorAll('video')].find(v=>v.readyState>0&&v.getBoundingClientRect().width>innerWidth*.5);return v||null};
  function back(){if(history.length>1){history.back();return}hint('Trykk 🏠 Hjem for å gå tilbake til Eskedals Univers',3500);try{console.log('EU:close')}catch(_){}setTimeout(()=>{try{window.close()}catch(_){}},300)}
  const fs=()=>{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})};
  document.addEventListener('keydown',e=>{
    const k=e.key;const t=e.target,typing=t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable);
    if(/^(Arrow|Enter)/.test(k))document.documentElement.classList.add('eu-kb');
    if(!typing&&/^(Arrow|Enter)/.test(k))fs();
    const v=video();
    if(v&&!typing){ /* avspilling: la spilleren styre, men gi enkle spoleknapper */
      if(k==='Enter'||k===' '||k==='MediaPlayPause'){e.preventDefault();e.stopPropagation();v.paused?v.play():v.pause();hint(v.paused?'⏸ Pause':'▶ Spiller',900);return}
      if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();e.stopPropagation();v.currentTime=Math.max(0,v.currentTime+(k==='ArrowRight'?10:-10));hint((k==='ArrowRight'?'⏩ +10 s':'⏪ −10 s'),900);return}
      if(k==='Escape'||k==='Backspace'||k==='BrowserBack'){e.preventDefault();e.stopPropagation();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});back();return}
      return}
    if(/^Arrow/.test(k)){if(typing&&(k==='ArrowLeft'||k==='ArrowRight'))return;e.preventDefault();e.stopPropagation();if(typing)t.blur();const n=pick(k);if(n)focusEl(n);else if(cur&&(k==='ArrowUp'))window.scrollBy({top:-innerHeight*.6,behavior:'smooth'});else if(cur&&k==='ArrowDown')window.scrollBy({top:innerHeight*.6,behavior:'smooth'});return}
    if(k==='Enter'&&cur&&!typing){e.preventDefault();e.stopPropagation();activate(cur);return}
    if((k==='Escape'||k==='BrowserBack'||(k==='Backspace'&&!typing))){e.preventDefault();e.stopPropagation();if(typing){t.blur();return}back();return}
  },true);
  document.addEventListener('mousemove',e=>{if(Math.abs(e.movementX)+Math.abs(e.movementY)>2)document.documentElement.classList.remove('eu-kb')},true);
  /* når siden bytter innhold (enkeltside-app), velg første element på nytt */
  let lastUrl=location.href;setInterval(()=>{if(location.href!==lastUrl){lastUrl=location.href;cur=null;setTimeout(()=>{if(!video()){document.documentElement.classList.add('eu-kb');focusEl(pick('ArrowDown'))}},1200)}else if(cur&&!cur.isConnected){cur=null;if(!video())focusEl(pick('ArrowDown'))}},700);
  setTimeout(()=>{if(!video()){document.documentElement.classList.add('eu-kb');focusEl(pick('ArrowDown'));hint('Bruk piltastene og OK · Tilbake går tilbake',3500)}},1500);
})();
