/* 의사랑 기능 가이드 썸네일 생성기 — 앱 로직
   분류·가이드·에셋·규칙 데이터는 data/*.json 에 있고, js/boot.js 가 읽어 window.YSR_DATA 로 넘겨 줍니다. */
const {ASSETS,SERIES,CATS,PRESETS,RULES}=window.YSR_DATA;
const A=Object.fromEntries(ASSETS.map(a=>[a.id,a]));
const $=s=>document.querySelector(s);
const imgs={};
function loadImg(a){return imgs[a.id]||(imgs[a.id]=new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>{delete imgs[a.id];j(new Error("그림을 불러오지 못했어요: "+a.id))};i.src=a.data}))}

/* ---------- render ---------- */
const W=1600,H=900;
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function fit(a,bw,bh){const s=Math.min(bw/a.w,bh/a.h);return[a.w*s,a.h*s]}
function hx(h){h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.substr(i,2),16))}
function mix(a,b,k){const A1=hx(a),B1=hx(b);return`rgb(${A1.map((v,i)=>Math.round(v+(B1[i]-v)*k)).join(',')})`}
function drawPedestal(c,cat,x,y,rx,ry,T){
  // soft drop shadow
  c.save();c.filter="blur(26px)";c.fillStyle="rgba(20,40,80,.16)";c.beginPath();c.ellipse(x,y+T+ry*0.55,rx*1.02,ry*0.9,0,0,Math.PI*2);c.fill();c.restore();
  // side wall (clay thickness)
  let g=c.createLinearGradient(0,y,0,y+T+ry);g.addColorStop(0,mix(cat.b,cat.accent,.10));g.addColorStop(1,mix(cat.b,cat.accent,.30));
  c.fillStyle=g;c.beginPath();c.ellipse(x,y+T,rx,ry,0,0,Math.PI);c.lineTo(x-rx,y);c.ellipse(x,y,rx,ry,0,Math.PI,0,true);c.closePath();c.fill();
  c.save();c.globalAlpha=.5;c.strokeStyle="#FFFFFF";c.lineWidth=6;c.filter="blur(3px)";c.beginPath();c.ellipse(x,y+6,rx-2,ry,0,Math.PI*0.08,Math.PI*0.92);c.stroke();c.restore();
  // top surface: puffy highlight
  g=c.createRadialGradient(x-rx*0.25,y-ry*0.5,ry*0.2,x,y,rx*1.05);g.addColorStop(0,"#FFFFFF");g.addColorStop(0.55,mix(cat.a,"#FFFFFF",.35));g.addColorStop(1,mix(cat.b,cat.accent,.06));
  c.fillStyle=g;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
  // rim highlight + soft inner edge
  c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();
  c.lineWidth=10;c.strokeStyle="rgba(255,255,255,.55)";c.filter="blur(4px)";c.beginPath();c.ellipse(x,y+3,rx-8,ry-5,0,Math.PI*1.05,Math.PI*1.95);c.stroke();
  c.filter="blur(10px)";c.lineWidth=18;c.strokeStyle=`${mix(cat.b,cat.accent,.18)}`;c.globalAlpha=.35;c.beginPath();c.ellipse(x,y-4,rx-2,ry-2,0,Math.PI*0.1,Math.PI*0.9);c.stroke();c.restore();
}
async function render(cv,st){
  const c=cv.getContext("2d"),cat=CATS[st.cat]||CATS.common;
  await document.fonts.load('600 30px "Pretendard"');await document.fonts.load('700 30px "Pretendard"');
  c.clearRect(0,0,W,H);
  let g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,cat.a);g.addColorStop(1,cat.b);c.fillStyle=g;c.fillRect(0,0,W,H);
  const hasSub=st.sub&&A[st.sub];
  const mx=hasSub?720:800,base=760;
  g=c.createRadialGradient(mx+(hasSub?60:0),470,40,mx+(hasSub?60:0),470,520);g.addColorStop(0,"rgba(255,255,255,.75)");g.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=g;c.fillRect(0,0,W,H);
  const m=A[st.main];
  if(!m){if(st.ped!=="off")drawPedestal(c,cat,800,725,300,63,46)}else{
  const K=(st.scale??100)/100,KS=(st.sscale??100)/100,DX=st.dx??0,DY=st.dy??0,FL=!!st.flip,PED=st.ped||"auto";
  const drawI=(img,x,y,w,h)=>{if(FL){c.save();c.translate(x+w,y);c.scale(-1,1);c.drawImage(img,0,0,w,h);c.restore()}else c.drawImage(img,x,y,w,h)};
  const clampX=(x,w)=>Math.max(64+w/2,Math.min(W-64-w/2,x));
  if(m.bleed){
    const [bw,bh]=fit(m,620*K,780*K),bx=clampX((hasSub?720:800)+DX,bw);
    c.save();c.shadowColor="rgba(20,40,80,.18)";c.shadowBlur=50;c.shadowOffsetX=-10;c.shadowOffsetY=20;
    drawI(await loadImg(m),bx-bw/2,H-bh+6+Math.max(0,DY),bw,bh);c.restore();
    if(hasSub){const s=A[st.sub],[sw,sh]=fit(s,300*KS,260*KS),sx=Math.min(bx+bw/2+60,W-120-sw/2);
      c.save();c.shadowColor="rgba(20,40,80,.22)";c.shadowBlur=36;c.shadowOffsetY=18;c.drawImage(await loadImg(s),sx-sw/2,560-sh/2,sw,sh);c.restore();}
  }else{
  const [mw,mh]=fit(m,600*K,470*K);
  let sw=0,sh=0,s=null;if(hasSub){s=A[st.sub];[sw,sh]=fit(s,300*KS,260*KS)}
  let mxx=clampX((hasSub?740:800)+mw*(0.5-(m.ax??0.5))+DX,mw),sx=0;
  if(hasSub){sx=Math.min(mxx+mw/2+sw*0.18,W-120-sw/2)}
  const L=Math.min(mxx-mw/2,hasSub?sx-sw/2:1e9),R=Math.max(mxx+mw/2,hasSub?sx+sw/2:-1e9);
  const pc=(L+R)/2,rx=Math.max(250,Math.min(540,(R-L)/2*0.82+50)),ry=rx*0.21,T=46,py=725;
  const usePed=PED==="on"?true:PED==="off"?false:!(m.noPedestal&&!hasSub);
  if(!usePed){
    // 자체 바닥(아이소메트릭 판 등)이 있는 오브젝트: 받침대 대신 판 중심 기준 정렬 + 접지 그림자
    const [dw,dh]=fit(m,640*K,520*K),ax=FL?1-(m.ax??0.5):(m.ax??0.5),gx=clampX(800+DX,dw),gy=790+DY,ox=gx-dw*ax;
    c.save();c.filter="blur(28px)";c.fillStyle="rgba(20,40,80,.20)";c.beginPath();c.ellipse(gx,790-dh*0.07+Math.max(0,DY),dw*(m.plate??0.8)*0.5,dh*0.08,0,0,Math.PI*2);c.fill();c.restore();
    c.save();c.shadowColor="rgba(20,40,80,.16)";c.shadowBlur=36;c.shadowOffsetY=16;
    drawI(await loadImg(m),ox,gy-dh,dw,dh);c.restore();
    if(hasSub){const [sw2,sh2]=fit(A[st.sub],300*KS,260*KS),sx2=Math.min(gx+dw*0.45,W-120-sw2/2);
      c.save();c.shadowColor="rgba(20,40,80,.22)";c.shadowBlur=32;c.shadowOffsetY=14;c.drawImage(await loadImg(A[st.sub]),sx2-sw2/2,800-sh2,sw2,sh2);c.restore();}
  }else{
  drawPedestal(c,cat,pc,py,rx,ry,T);
  // contact shadows on the pedestal surface
  const contact=(x,y,w)=>{c.save();c.filter="blur(14px)";c.fillStyle="rgba(20,40,80,.20)";c.beginPath();c.ellipse(x,y,w,ry*0.32,0,0,Math.PI*2);c.fill();c.restore()};
  const mb=py+ry*0.15;contact(mxx,mb,mw*0.36*(DY<0?Math.max(0.55,1+DY/200):1));
  c.save();c.shadowColor="rgba(20,40,80,.18)";c.shadowBlur=40;c.shadowOffsetY=18;
  drawI(await loadImg(m),mxx-mw/2,mb-mh+DY,mw,mh);c.restore();
  if(hasSub){const sb=py+ry*0.55;contact(sx,sb,sw*0.34);
    c.save();c.shadowColor="rgba(20,40,80,.22)";c.shadowBlur=32;c.shadowOffsetY=14;
    c.drawImage(await loadImg(s),sx-sw/2,sb-sh,sw,sh);c.restore();}
  }
  }
  }
  // category chip
  if(st.chip!==false){
  c.font='600 42px "Pretendard"';const tw=c.measureText(cat.label).width;
  const cw=tw+36*2+26,ch=88,cxp=64,cyp=60;
  c.save();c.shadowColor="rgba(20,40,80,.08)";c.shadowBlur=18;c.shadowOffsetY=4;c.fillStyle="rgba(255,255,255,.92)";rrect(c,cxp,cyp,cw,ch,44);c.fill();c.restore();
  c.fillStyle=cat.accent;c.beginPath();c.arc(cxp+40,cyp+ch/2,10,0,Math.PI*2);c.fill();
  c.fillStyle=cat.accent;c.textBaseline="middle";c.fillText(cat.label,cxp+64,cyp+ch/2+1);
  }
  const cyp2=60,ch2=88;
  if(st.isNew){
    c.font='700 42px "Pretendard"';c.letterSpacing="1px";const nw=c.measureText("NEW").width+72;
    c.fillStyle=cat.accent;rrect(c,W-64-nw,cyp2,nw,ch2,44);c.fill();c.textBaseline="middle";
    c.fillStyle="#fff";c.fillText("NEW",W-64-nw+36,cyp2+ch2/2+1);c.letterSpacing="0px";
  }
}

/* ---------- UI ---------- */
const cv=$("#cv");
function state(){return{title:$("#title").value.trim(),desc:"",cat:document.querySelector('input[name=cat]:checked').value,main:$("#main").value,sub:$("#sub").value,isNew:$("#isNew").checked,file:$("#fname").value.trim(),scale:+$("#scale").value,sscale:+$("#sscale").value,dx:+$("#dx").value,dy:+$("#dy").value,flip:$("#flip").checked,ped:$("#ped").value,chip:$("#chip").checked}}
const STORE="ysr-thumb:";
function loadOv(file){try{const v=localStorage.getItem(STORE+file);return v?JSON.parse(v):null}catch{return null}}
function saveOv(st){if(!st.file)return;
  const base=PRESETS.find(p=>p.file===st.file);
  const o={cat:st.cat,main:st.main,sub:st.sub,scale:st.scale,sscale:st.sscale,dx:st.dx,dy:st.dy,flip:st.flip,ped:st.ped};
  const same=base&&base.cat===o.cat&&base.main===o.main&&(base.sub||"")===o.sub&&o.scale===100&&o.dx===0&&o.dy===0&&!o.flip&&o.ped==="auto";
  try{same?localStorage.removeItem(STORE+st.file):localStorage.setItem(STORE+st.file,JSON.stringify(o))}catch{}}
function setAdj(o){$("#scale").value=o.scale??100;$("#sscale").value=o.sscale??100;$("#dx").value=o.dx??0;$("#dy").value=o.dy??0;$("#flip").checked=!!o.flip;$("#ped").value=o.ped||"auto";syncOut()}
function syncOut(){$("#scaleO").textContent=$("#scale").value+"%";$("#sscaleO").textContent=$("#sscale").value+"%";const hs=!!$("#sub").value;$("#sscale").disabled=!hs;$("#sscaleRow").classList.toggle("off",!hs);$("#dxO").textContent=$("#dx").value;$("#dyO").textContent=$("#dy").value}
function withOv(p){const o=loadOv(p.file);return {...(o?{...p,...o}:p),chip:chipOn()}}
const CHIPKEY="ysr-thumb:global-chip";
let chipState=true;try{localStorage.removeItem(CHIPKEY)}catch{}
function chipOn(){return chipState}
function optList(sel,withNone){sel.innerHTML=(withNone?'<option value="">없음</option>':'')+Object.keys(SERIES).map(s=>`<optgroup label="${SERIES[s]}">`+ASSETS.filter(a=>a.series===s).map(a=>`<option value="${a.id}">${a.name}  (${a.id})</option>`).join("")+"</optgroup>").join("")}
/* ---------- custom categories ---------- */
const CUSTOM_KEY="ysr-thumb:custom-cats";
const BUILTIN=Object.keys(CATS);
const PALETTE=[
 {n:"스카이 블루",a:"#EEF4FD",b:"#D3E3FA",accent:"#0066E3"},{n:"페리윙클",a:"#EFF1FD",b:"#D6DBF8",accent:"#4453C7"},
 {n:"라벤더",a:"#F4F1FD",b:"#E1D9F8",accent:"#6B4FD8"},{n:"라일락 핑크",a:"#FCF1F7",b:"#F5DAE9",accent:"#B83C78"},
 {n:"코랄",a:"#FFF1F0",b:"#FAD6D2",accent:"#C03A2F"},{n:"피치",a:"#FFF4EF",b:"#FBDDCE",accent:"#B85226"},
 {n:"앰버",a:"#FFF6E6",b:"#FBE1B4",accent:"#A86400"},{n:"버터 옐로",a:"#FFF9E5",b:"#F8EBB4",accent:"#8C6A00"},
 {n:"세이지",a:"#F1F7ED",b:"#D9EBCF",accent:"#3F7A2A"},{n:"민트",a:"#EAF7F3",b:"#C9EADF",accent:"#0B7A6B"},
 {n:"아쿠아",a:"#EAF7FA",b:"#C8EAF2",accent:"#0B6F87"},{n:"쿨 그레이",a:"#F2F4F7",b:"#DCE2EA",accent:"#4A5565"}];
function hexToHsl(h){let [r,g,b]=hx(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let H=0,S=0,L=(mx+mn)/2;if(mx!==mn){const d=mx-mn;S=L>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S*100,L*100]}
function hslToHex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return"#"+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("").toUpperCase()}
function lum(h){return hx(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function pastelFrom(h,s){const S=Math.max(30,Math.min(75,s));let L=46,acc;do{acc=hslToHex(h,Math.min(80,S+10),L);L-=2}while(contrast(acc,"#FFFFFF")<4.5&&L>18);
  return{a:hslToHex(h,Math.min(85,S+5),96),b:hslToHex(h,Math.min(80,S),87),accent:acc}}
function loadCustom(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||"[]")}catch{return[]}}
function saveCustom(list){try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(list))}catch{}}
function syncCustomCats(){for(const k of Object.keys(CATS))if(!BUILTIN.includes(k))delete CATS[k];
  for(const c of loadCustom())CATS[c.id]={label:c.label,a:c.a,b:c.b,accent:c.accent,desc:"사용자가 만든 분류: "+c.label,custom:true}}
function renderCats(sel){
  const cur=sel||document.querySelector('input[name=cat]:checked')?.value||"exchange";
  $("#cats").innerHTML=Object.entries(CATS).map(([k,v])=>`<label><input type="radio" name="cat" value="${k}" ${k===cur?"checked":""}><span class="sw" style="background:linear-gradient(135deg,${v.a},${v.b});box-shadow:inset 0 0 0 3px ${v.accent}33"></span>${v.label.replace(/</g,"&lt;")}${v.custom?`<button class="del" data-del="${k}" aria-label="${v.label.replace(/"/g,"")} 분류 삭제">×</button>`:""}</label>`).join("");
  if(!document.querySelector('input[name=cat]:checked'))document.querySelector('input[name=cat][value=exchange]').checked=true;
}
syncCustomCats();renderCats("exchange");
let catSel=PALETTE[0];
function palHTML(list){return list.map((c,i)=>`<button type="button" data-i="${i}" aria-pressed="${catSel.a===c.a&&catSel.accent===c.accent}" title="${c.n||""}" aria-label="${c.n||"추천 색 "+(i+1)}" style="background:linear-gradient(135deg,${c.a},${c.b})"><span style="background:${c.accent}"></span></button>`).join("")}
let nearList=[];
function drawPal(){$("#pal").innerHTML=palHTML(PALETTE);$("#palNear").innerHTML=palHTML(nearList);drawCatPrev()}
function makeNear(){const [h,s]=hexToHsl($("#catPick").value);nearList=[-30,-15,0,15,30,45].map((d,i)=>({n:"추천 "+(i+1),...pastelFrom((h+d+360)%360,s)}))}
function drawCatPrev(){const nm=$("#catName").value.trim()||"분류 이름";$("#catPrevBox").style.background=`linear-gradient(135deg,${catSel.a},${catSel.b})`;
  $("#catPrev").querySelector("i").style.background=catSel.accent;const b=$("#catPrev").querySelector("b");b.textContent=nm;b.style.color=catSel.accent}
$("#pal").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;catSel=PALETTE[+b.dataset.i];drawPal()});
$("#palNear").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;catSel=nearList[+b.dataset.i];drawPal()});
$("#catPick").addEventListener("input",()=>{makeNear();catSel=nearList[2];drawPal()});
$("#catName").addEventListener("input",drawCatPrev);
$("#catAdd").onclick=()=>{const on=$("#catForm").classList.toggle("on");$("#catAdd").setAttribute("aria-expanded",on);if(on){makeNear();drawPal();$("#catName").focus()}};
$("#catCancel").onclick=()=>{$("#catForm").classList.remove("on");$("#catAdd").setAttribute("aria-expanded","false");$("#catStatus").textContent=""};
$("#catSave").onclick=()=>{
  const name=$("#catName").value.trim();
  if(!name){$("#catStatus").textContent="분류 이름을 입력하세요.";$("#catName").focus();return}
  if(Object.values(CATS).some(c=>c.label===name)){$("#catStatus").textContent="같은 이름의 분류가 이미 있습니다.";return}
  const list=loadCustom();const id="c_"+Date.now().toString(36);
  list.push({id,label:name,a:catSel.a,b:catSel.b,accent:catSel.accent});saveCustom(list);syncCustomCats();renderCats(id);
  $("#catName").value="";$("#catForm").classList.remove("on");$("#catAdd").setAttribute("aria-expanded","false");$("#catStatus").textContent="";
  update();refreshAlts(true);
};
$("#cats").addEventListener("click",e=>{const d=e.target.closest("[data-del]");if(!d)return;e.preventDefault();e.stopPropagation();
  const id=d.dataset.del,lab=CATS[id]?.label;if(!confirm(`‘${lab}’ 분류를 삭제할까요? 이 분류로 만든 썸네일은 ‘공통·설정’으로 바뀝니다.`))return;
  saveCustom(loadCustom().filter(c=>c.id!==id));const wasSel=document.querySelector('input[name=cat]:checked')?.value===id;syncCustomCats();renderCats(wasSel?"common":undefined);
  for(const k in presetThumbs)delete presetThumbs[k];for(const k in altThumbCache)delete altThumbCache[k];update();refreshAlts(true)});
optList($("#main"),true);optList($("#sub"),true);
$("#preset").innerHTML+=PRESETS.map((p,i)=>`<option value="${i}">${p.title}</option>`).join("");
let curFlag="";
function seriesNote(st){
  const n=[];if(curFlag)n.push(curFlag);
  if(st.sub&&A[st.sub]&&A[st.main]&&A[st.sub].series!==A[st.main].series&&!curFlag)n.push("메인과 보조 오브젝트의 시리즈가 다릅니다. 같은 시리즈 조합을 먼저 찾아보세요.");
  if(st.main&&st.sub===st.main)n.push("메인과 보조에 같은 오브젝트를 고를 수 없습니다.");
  $("#note").textContent=n.join(" ");
}
let tick=0,drawing=false,queued=null;
let lastKey=null;
function swapAnim(el){el.classList.remove("swap");void el.offsetWidth;el.classList.add("swap")}
async function update(){syncOut();if(typeof syncPed==="function")syncPed();if(typeof syncPickers==="function"&&Object.keys(PK).length)syncPickers();{const ss=$("#saveStatus");if(A[$("#main").value]&&/^메인 오브젝트를 먼저|^새 카드를 만들고/.test(ss.textContent))ss.textContent=""}
  const st=state();seriesNote(st);if(st.sub===st.main){st.sub=""}
  const key=[st.cat,st.main,st.sub,st.isNew,st.chip,st.flip,st.ped,(CATS[st.cat]||{}).a].join("|");
  if(lastKey!==null&&key!==lastKey)swapAnim(cv);lastKey=key;
  /* 미리보기는 한 번에 하나만 그린다. 그림을 서버에서 받는 동안 다음 변경이 들어와도 이전 그림이 겹쳐 그려지지 않는다. */
  queued=st;if(drawing)return;drawing=true;let last=st;
  try{while(queued){last=queued;queued=null;
    try{await render(cv,last)}catch(e){console.warn(e);$("#saveStatus").textContent="그림을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요."}}}
  finally{drawing=false}
  saveOv(last);if(typeof syncRestore==='function')syncRestore();
  drawMock();
}
function slug(t){return t.replace(/[\[\]\/·]/g," ").trim().replace(/\s+/g,"-").toLowerCase()||"thumbnail"}
function apply(p0){
  const p=withOv(p0);histStack.length=0;$("#altUndo").disabled=true;setAdj(p);
  $("#title").value=p.title;(document.querySelector(`input[name=cat][value="${CATS[p.cat]?p.cat:"common"}"]`)).checked=true;$("#main").value=p.main;$("#sub").value=p.sub||"";$("#isNew").checked=!!p.isNew;$("#fname").value=p.file||slug(p.title);curFlag=p.flag||"";update();
}
$("#preset").onchange=e=>{if(e.target.value==="")return;apply(PRESETS[+e.target.value])};
["title","main","sub","isNew"].forEach(id=>$("#"+id).addEventListener(id==="title"?"input":"change",()=>{if(id!=="title")curFlag="";update();if(id!=="isNew")refreshAlts(true)}));
["scale","sscale","dx","dy"].forEach(id=>$("#"+id).addEventListener("input",()=>{syncOut();update()}));
["flip","ped"].forEach(id=>$("#"+id).addEventListener("change",update));
/* 받침대: 그림 선택 버튼 */
function syncPed(){const v=$("#ped").value;document.querySelectorAll(".ped-opt").forEach(b=>{const on=b.dataset.ped===v;b.classList.toggle("on",on);b.setAttribute("aria-checked",on)})}
document.querySelectorAll(".ped-opt").forEach(b=>b.onclick=()=>{$("#ped").value=b.dataset.ped;$("#ped").dispatchEvent(new Event("change"));syncPed()});
syncPed();

$("#adjReset").onclick=()=>{const i=$("#preset").value;setAdj(i!==""?PRESETS[+i]:{ped:"off"});update()};
$("#chip").checked=chipOn();
$("#chip").addEventListener("change",()=>{chipState=$("#chip").checked;for(const k in presetThumbs)delete presetThumbs[k];for(const k in altThumbCache)delete altThumbCache[k];update();refreshAlts(false)});
$("#cats").addEventListener("change",()=>{update();refreshAlts(true)});
$("#title").addEventListener("change",()=>{if(!$("#fname").value)$("#fname").value=slug($("#title").value)});

/* mock of GitBook card grid */
const presetThumbs={};
async function presetURL(i){if(presetThumbs[i])return presetThumbs[i];const c=document.createElement("canvas");c.width=W;c.height=H;await render(c,{...withOv(PRESETS[i]),isNew:false});return presetThumbs[i]=c.toDataURL("image/png")}
let mockBusy=false;
async function drawMock(){
  const st=state(),cur=cv.toDataURL("image/png");
  const idx=$("#preset").value;
  const items=[];
  if(idx!=="")delete presetThumbs[+idx];
  for(let i=0;i<PRESETS.length;i++){items.push({i,t:PRESETS[i].title,u:String(i)===idx?cur:await presetURL(i),c:String(i)===idx})}
  let html=items.map(x=>`<button type="button" class="gb ${x.c?"cur":""}" data-i="${x.i}" aria-pressed="${x.c}" aria-label="${esc(x.t)} 불러오기"><img alt="" src="${x.u}"><div>${esc(x.t)}</div></button>`).join("");
  let lead="";
  if(idx==="") lead=`<button type="button" class="gb cur gb-new" data-i="" aria-pressed="true" aria-label="새 카드 미리보기"><span class="gb-tag">새 카드</span><img alt="" src="${cur}"><div>${esc(st.title||"카드 제목을 적어주세요.")}</div></button>`;
  else lead=`<button type="button" class="gb gb-add" data-new="1" aria-label="새 카드 만들기"><span class="gb-plus" aria-hidden="true">+</span><b>새 카드 만들기</b><span>누르면 새 카드를 시작해요</span></button>`;
  html=lead+html;
  $("#mock").innerHTML=html;
}

/* bottom cards: click to load that guide (분류·오브젝트·조정값 자동 적용) */
$("#mock").addEventListener("click",e=>{const nb=e.target.closest("[data-new]");
  if(nb){startNew();document.querySelector(".panel").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});return}
  const b=e.target.closest(".gb");if(!b||b.dataset.i===""||b.classList.contains("cur"))return;
  const i=b.dataset.i;$("#preset").value=i;apply(PRESETS[+i]);refreshAlts(true);if(typeof syncRestore==="function")syncRestore();
  const cat=CATS[state().cat];$("#saveStatus").textContent=`‘${PRESETS[+i].title}’을(를) 불러왔어요. 분류: ${cat?cat.label:""}`;
  $(".stage").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})});

/* save */
let downloads=null,sample=null;
let db=null,assetsCap=null,userCap=null,uid=null;
(async()=>{if(window.claude){downloads=await claude.use("downloads");sample=await claude.use("sample");try{db=await claude.use("db")}catch{db=null}
    try{assetsCap=await claude.use("assets")}catch{assetsCap=null}
    try{userCap=await claude.use("user");uid=userCap?await userCap.id():null}catch{userCap=null}}
  setTimeout(initLearned,0);


})();
function toBlob(c){return new Promise(r=>c.toBlob(r,"image/png"))}
/* 저장: downloads 기능이 있으면 확인창으로, 없으면(바탕화면 파일 등) 브라우저 다운로드로 */
async function saveBlob(name,blob){
  if(downloads){await downloads.save({filename:name,data:blob});return"app"}
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return"browser"}
function saveErr(e){return e.code==="declined"?"저장을 취소했어요.":e.code==="too_large"?"파일이 너무 커요.":`저장하지 못했어요 (${e.code||e.message}).`}
$("#save").onclick=async()=>{
  const st=state();if(!A[st.main]){$("#saveStatus").textContent="메인 오브젝트를 먼저 골라 주세요.";($("#mainPk")||$("#main")).focus();return}
  const name=(st.file||slug(st.title))+".png";
  try{const how=await saveBlob(name,await toBlob(cv));$("#saveStatus").textContent=(how==="app"?`${name} 저장했어요.`:`${name} 다운로드를 시작했어요. 다운로드 폴더를 확인하세요.`)+" 저장 내역에도 남겼어요.";recordSave(st,cv)}
  catch(e){$("#saveStatus").textContent=saveErr(e)}
};
$("#zip").onclick=async()=>{
  if(!window.JSZip){$("#zipStatus").textContent="ZIP을 만들 수 없어요. 새로고침 후 다시 시도해 주세요.";return}
  const btn=$("#zip");btn.disabled=true;const z=new JSZip();
  try{for(let i=0;i<PRESETS.length;i++){const p=PRESETS[i];$("#zipStatus").textContent=`만드는 중… (${i+1}/${PRESETS.length})`;
      const c=document.createElement("canvas");c.width=W;c.height=H;await render(c,{...withOv(p),isNew:false,chip:chipOn()});z.file(p.file+".png",await toBlob(c))}
    const how=await saveBlob("ysr-feature-guide-thumbnails.zip",await z.generateAsync({type:"blob"}));
    $("#zipStatus").textContent=how==="app"?`ZIP을 저장했어요. 압축을 풀면 ${PRESETS.length}개 PNG가 들어 있어요.`:"ZIP 다운로드를 시작했어요. 다운로드 폴더를 확인하세요."}
  catch(e){$("#zipStatus").textContent=saveErr(e)}
  finally{btn.disabled=false}
};

/* ---------- medical-professional people ---------- */
const ROLES=RULES.roles;
/* ---------- learned assets ---------- */
const LKEY="ysr-thumb:learned";
function addLearned(list){
  let changed=false;
  for(const d of list){if(!d||!d.id||!d.data)continue;const ex=A[d.id];
    const a={id:d.id,series:d.person?"P":"U",name:d.name||"학습한 그림",kw:d.kw||"",src:d.src||"출처 미기재",license:d.license||"",w:d.w,h:d.h,data:d.data,learned:true,claimOk:!d.person&&!!d.claimOk,person:!!d.person,role:d.role||"",bleed:!!d.bleed,blobId:d.blobId||"",by:d.by||"",at:d.at||0};
    if(ex){Object.assign(ex,a)}else{ASSETS.push(a);A[a.id]=a}changed=true}
  return changed}
function removeLearned(id){const i=ASSETS.findIndex(a=>a.id===id);if(i>=0)ASSETS.splice(i,1);delete A[id]}
function refreshAfterAssets(){const m=$("#main").value,s=$("#sub").value;optList($("#main"),true);optList($("#sub"),true);
  if(A[m])$("#main").value=m;else $("#main").selectedIndex=0;$("#sub").value=A[s]?s:"";renderAssets();
  
  const pi=$("#preset").value;if(pi!==""){const o=loadOv(PRESETS[+pi].file);if(o&&o.main&&A[o.main]&&$("#main").value!==o.main){apply(PRESETS[+pi]);return}}
  update();if(typeof refreshAlts==="function")refreshAlts(false)}
function localLearned(){try{return JSON.parse(localStorage.getItem(LKEY)||"[]")}catch{return[]}}
function saveLocalLearned(list){try{localStorage.setItem(LKEY,JSON.stringify(list));return true}catch{return false}}
let learnedSource="local";
function initLearned(){
  if(addLearned(localLearned()))refreshAfterAssets();
  initLog();initHist();
  if(!db){$("#mineHint").textContent="지금은 이 브라우저에만 저장돼요. 모든 직원이 함께 쓸 그림은 생성기 담당자에게 등록을 요청해 주세요.";return}
  learnedSource="db";
  const timer=setTimeout(()=>{},10000);
  db.collection("learned").onSnapshot(snap=>{clearTimeout(timer);
    for(const ch of snap.docChanges()){if(ch.type==="removed")removeLearned(ch.doc.id)}
    addLearned(snap.docs.map(d=>({...d.data(),id:d.id})));refreshAfterAssets()},
    err=>{clearTimeout(timer);learnedSource="local";console.warn(err)});
}
$("#assets").addEventListener("click",e=>{const b=e.target.closest("[data-try]");if(!b)return;const id=b.dataset.try;if(!A[id])return;
  showTab("make");useAlt(id,false);
  const msg=`‘${A[id].name}’을(를) 메인 오브젝트로 적용했어요. 마음에 들지 않으면 ‘이전 이미지로 되돌리기’를 누르세요.`;
  $("#altStatus").textContent=msg;$("#saveStatus").textContent=msg;
  setTimeout(()=>document.querySelector(".stage").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"}),60)});
$("#assets").addEventListener("click",async e=>{const b=e.target.closest("[data-del-asset]");if(!b)return;const id=b.dataset.delAsset;
  if(!confirm(`‘${A[id]?.name}’ 에셋을 삭제할까요?${learnedSource==="db"?" 팀 모두의 목록에서 사라져요.":""}`))return;
  try{const nm=A[id]?.name||"";if(learnedSource==="db"){const blobId=A[id]?.blobId;await db.doc("learned/"+id).delete();if(blobId&&assetsCap){try{await assetsCap.delete(blobId)}catch{}}}
    saveLocalLearned(localLearned().filter(x=>x.id!==id));removeLearned(id);refreshAfterAssets();await logAct("delete",nm)}
  catch(err){alert(err.code==="permission_denied"?"삭제 권한이 없어요. 생성기 담당자에게 요청하세요.":"삭제하지 못했어요: "+(err.message||err.code))}});

/* ---------- alternatives ---------- */
const CLAIM_OK=RULES.claimOk;
const DELIVERY=RULES.delivery;
const FACE_ROBOT=RULES.faceRobot;
const AFF=RULES.affinity;
function allowed(id,st){
  const text=(st.title+" "+(st.desc||""));
  if(A[id]&&A[id].person&&st.cat==="claim")return false;
  if(st.cat==="claim")return CLAIM_OK.includes(id)||!!(A[id]&&A[id].claimOk);
  if(FACE_ROBOT.includes(id)&&!/AI|인공지능/i.test(text))return false;
  if(/^heart_.*_(blue|mint)$/.test(id)){if(st.cat==="exchange")return id.endsWith("_blue");if(st.cat==="care")return id.endsWith("_mint");return !!(CATS[st.cat]&&CATS[st.cat].custom)}
  return true;
}
function tokens(s){return (s||"").replace(/[\[\]\(\)\/·,.]/g," ").split(/\s+/).filter(w=>w.length>=2)}
function rank(st){
  const text=st.title+" "+(st.desc||""),tk=tokens(text),cur=A[st.main];
  return ASSETS.filter(a=>a.id!==st.main&&a.id!==st.sub&&allowed(a.id,st)).map(a=>{
    let sc=0;const kws=a.kw.split(/,\s*/);
    for(const k of kws){if(text.includes(k))sc+=3;else if(tk.some(t=>k.includes(t)||t.includes(k)))sc+=2}
    if((AFF[st.cat]||[]).includes(a.id))sc+=2;
    if(a.person&&ROLES[a.role]&&ROLES[a.role].kw.split(/,\s*/).some(w=>text.includes(w)))sc+=3;
    if(cur&&a.series===cur.series)sc+=1;
    return{a,sc};
  }).sort((x,y)=>y.sc-x.sc||ASSETS.indexOf(x.a)-ASSETS.indexOf(y.a));
}
let altList=[],altPage=0;const histStack=[];const altThumbCache={};
async function altThumb(st){
  const key=JSON.stringify([st.cat,st.main,st.sub]);if(altThumbCache[key])return altThumbCache[key];
  const c=document.createElement("canvas");c.width=W;c.height=H;await render(c,{...st,isNew:false,scale:100,dx:0,dy:0,flip:false,ped:"auto"});
  const s=document.createElement("canvas");s.width=480;s.height=270;s.getContext("2d").drawImage(c,0,0,480,270);
  return altThumbCache[key]=s.toDataURL("image/webp",0.85);
}
function pushHistory(){const st=state();histStack.push({main:st.main,sub:st.sub});if(histStack.length>20)histStack.shift();$("#altUndo").disabled=false}
function useAlt(id,asSub){
  if(asSub&&A[id]&&A[id].person){$("#altStatus").textContent="의료인 인물은 메인으로만 쓸 수 있어요.";return}
  if(!asSub&&A[id]&&A[id].person&&A[$("#sub").value]?.person)$("#sub").value="";
  pushHistory();
  if(asSub){$("#sub").value=id}else{$("#main").value=id;if($("#sub").value===id)$("#sub").value=""}
  if(state().cat==="claim")$("#sub").value="";
  curFlag="";setAdj({});update();refreshAlts(true);
  $("#altStatus").textContent=`${asSub?"보조":"메인"} 오브젝트를 ‘${A[id].name}’(으)로 바꿨습니다.`;
  document.querySelector(".stage").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
}
async function drawAlts(items,reasons){
  const st=state(),grid=$("#altGrid");
  if(!items.length){grid.innerHTML="";$("#altStatus").textContent="이 분류 규칙에 맞는 다른 에셋이 더 없습니다. 새 에셋을 등록하면 여기에 나타납니다.";return}
  grid.innerHTML=items.map((x,i)=>`<div class="altc" data-id="${x.a.id}" style="animation-delay:${i*45}ms"><img alt="" src=""><div class="meta"><b>${x.a.name}</b><span>${reasons&&reasons[x.a.id]?reasons[x.a.id]:x.a.kw}</span></div><div class="acts"><button class="pri" data-act="main">이 이미지로 바꾸기</button>${st.cat==="claim"||x.a.person?"":`<button data-act="sub">보조로 추가</button>`}</div></div>`).join("");
  for(const el of grid.querySelectorAll(".altc")){
    const id=el.dataset.id;el.querySelector("img").src=await altThumb({...st,main:id,sub:st.cat==="claim"?"":(st.sub===id?"":st.sub)});
  }
}
$("#altGrid").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;useAlt(b.closest(".altc").dataset.id,b.dataset.act==="sub")});
function refreshAlts(reset){
  const st=state();
  altList=rank(st);if(reset)altPage=0;
  const per=6,start=(altPage*per)%Math.max(altList.length,1);
  drawAlts(altList.slice(start,start+per));
  $("#altMore").disabled=altList.length<=per;
  if(reset)$("#altStatus").textContent="";
  if(picker.classList.contains("on"))drawPicker();
}
$("#altMore").onclick=()=>{altPage++;refreshAlts(false)};
let newBase=null;
function startNew(){$("#preset").value="";$("#title").value="";$("#fname").value="";$("#main").value="";$("#sub").value="";$("#isNew").checked=false;setAdj({ped:"off"});curFlag="";histStack.length=0;$("#altUndo").disabled=true;
  newBase={cat:state().cat,main:"",sub:""};update();refreshAlts(true);if(typeof syncRestore==="function")syncRestore();
  $("#saveStatus").textContent="새 카드를 만들고 있어요. 카드 제목을 적고 메인 오브젝트를 골라 주세요.";$("#title").focus()}
$("#preset").addEventListener("change",()=>{if($("#preset").value==="")startNew()});
$("#altReset").onclick=()=>{
  const i=$("#preset").value;histStack.length=0;$("#altUndo").disabled=true;
  if(i!==""){try{localStorage.removeItem(STORE+PRESETS[+i].file)}catch{};delete presetThumbs[+i];apply(PRESETS[+i]);if(typeof syncRestore==="function")syncRestore()}
  else{const b=newBase||{cat:"exchange",main:ASSETS[0].id,sub:""};const r=document.querySelector(`input[name=cat][value="${CATS[b.cat]?b.cat:"exchange"}"]`);if(r)r.checked=true;$("#main").value=A[b.main]?b.main:"";$("#sub").value=A[b.sub]?b.sub:"";setAdj({});curFlag="";update()}
  refreshAlts(true);$("#altStatus").textContent=i!==""?"이 가이드를 처음 상태(디자인팀 기본 매칭)로 되돌렸어요.":"처음 상태로 되돌렸어요."};
$("#altUndo").onclick=()=>{const h=histStack.pop();if(!h)return;$("#main").value=h.main;$("#sub").value=h.sub||"";$("#altUndo").disabled=!histStack.length;setAdj({});update();refreshAlts(true);$("#altStatus").textContent="이전 이미지로 되돌렸습니다."};
const picker=$("#picker");
$("#altPick").onclick=()=>{const on=picker.classList.toggle("on");$("#altPick").setAttribute("aria-expanded",on);if(on)drawPicker()};
function drawPicker(){
  const st=state(),q=$("#pq").value.trim(),mode=$("#pmode").value;
  const list=ASSETS.filter(a=>allowed(a.id,st)&&(!q||(a.name+" "+a.kw+" "+a.id).includes(q)));
  $("#pgrid").innerHTML=list.length?list.map(a=>`<button data-id="${a.id}" aria-pressed="${(mode==="main"?st.main:st.sub)===a.id}" title="${a.kw}"><img alt="" src="${a.data}">${a.name}</button>`).join(""):`<p class="hint">‘${q.replace(/</g,"&lt;")}’에 맞는 에셋이 없습니다. 다른 키워드로 찾아보세요.</p>`;
}
$("#pq").addEventListener("input",drawPicker);$("#pmode").addEventListener("change",drawPicker);
$("#pgrid").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(!b)return;
  if($("#pmode").value==="sub"&&state().cat==="claim"){$("#altStatus").textContent="청구·보고 분류는 보조 오브젝트를 쓰지 않습니다.";return}
  useAlt(b.dataset.id,$("#pmode").value==="sub");drawPicker()});
/* prompt */
function buildPrompt(title,desc){
return `당신은 GC메디아이 디자인팀의 썸네일 기준을 적용하는 담당자입니다. 의사랑(병·의원 EMR) GitBook 기능 가이드 카드의 커버 이미지에 쓸 '분류'와 '오브젝트'를 정해 주세요. 이미지를 직접 그리지 말고, 아래 목록에 있는 값만 고르세요.

[분류] 하나만 선택
${Object.entries(CATS).map(([k,v])=>`- ${k}: ${v.label} — ${v.desc}`).join("\n")}

[오브젝트 목록] id | 이름 | 시리즈 | 의미 키워드
${ASSETS.map(a=>`- ${a.id} | ${a.name} | ${a.series}${a.person?"(의료인:"+(ROLES[a.role]?.label||"")+")":""} | ${a.kw}`).join("\n")}

[규칙]
1. main은 기능의 핵심 행위나 대상을 가장 직접적으로 나타내는 오브젝트 1개.
2. sub는 main만으로 다른 가이드와 구분되지 않을 때만 1개 추가. 아니면 빈 문자열.
3. main과 sub는 같은 시리즈를 우선. 의미상 대안이 없을 때만 다른 시리즈 허용.
4. 이미 쓰인 조합(아래)과 main·sub가 모두 같으면 안 됨: ${PRESETS.map(p=>p.main+(p.sub?"+"+p.sub:"")).join(", ")}
5. 목록에 의미가 맞는 오브젝트가 없으면 가장 가까운 것을 고르고 fit을 "weak"로 표시. 억지로 "good"이라 하지 말 것.
6. 제공된 설명에 없는 기능 내용을 추측해 근거로 쓰지 말 것.
7. 달러($) 표기가 있는 화폐 오브젝트(coins, cash_wings, wallet, money_bag, coin_wings, hand_cash, building_coins)는 비용·수납·청구·지원금 의미가 기능의 핵심일 때만 사용.
8. 얼굴이 있는 로봇(robot_chart, robot_check, robot_monitor)은 AI 기능 가이드에만 사용. AI가 아닌 자동화 기능은 box_wings, gear 등 다른 오브젝트 우선.
9. 기능명에 쓰인 단어와 키워드가 겹친다는 이유만으로 고르지 말고, 사용자가 그 기능으로 하는 행위(조회·작성·제출·전송·수납·관리)를 기준으로 고를 것.
10. category가 claim(청구·보고)이면 main은 영수증·보고서·서식 형태(receipt_check, receipt_shield, phone_receipt, clipboard_blue, clipboard_pencil, clipboard_mint) 중에서 고르고 sub는 빈 문자열. 배송·택배 오브젝트(truck_side, truck_34, box_pin, box_wings, hand_box, shop_bag)는 claim에 쓰지 말 것.
11. 하트·손 오브젝트(heart_*)는 색 접미사를 분류에 맞출 것: exchange는 _blue, care는 _mint. 두 손(heart_hands2_*)은 주고받는 교류, 한 손(heart_hand1_*)은 한쪽에서 제공·지원하는 기능.
12. 시리즈 P(의료인 인물)는 그 직군이 직접 하는 일(의사=진료·처방, 간호사=간호·투약·교육, 약사=조제·복약지도, 치료사=치료·재활, 원무=접수·수납·예약)이 기능의 핵심일 때만 main으로 사용. 인물은 한 썸네일에 1명만, sub에 인물을 넣지 말 것. claim 분류에는 쓰지 말 것.

[출력] JSON 하나만 출력
{"category":"exchange|claim|care|common","main":"오브젝트 id","sub":"오브젝트 id 또는 빈 문자열","fit":"good|weak","reason":"한 문장 근거","missing":"fit이 weak일 때 필요한 에셋 설명, 아니면 빈 문자열"}

[가이드 제목] ${title}
[기능 설명] ${desc}`}



/* spec + assets */
$("#spec").innerHTML=`
<h2>이 썸네일은</h2>
<p>제목이 비슷한 가이드도 그림만 보고 기능을 구분하고, 새로 나온 기능이 눈에 띄도록 만든 카드 커버예요.<br>색·배치·질감은 생성기가 자동으로 맞춰요.</p>

<h2>만드는 방법</h2>
<ol class="steps">
<li><b class="t">카드 제목 쓰기</b>GitBook 카드 제목과 똑같이 써요. 그림 안에는 글자가 들어가지 않아요(제목은 카드 아래에 표시돼요).</li>
<li><b class="t">분류 고르기</b>아래 ${BUILTIN.length}가지 중 기능에 가장 가까운 것 1개를 골라요. 배경색이 정해져요.</li>
<li><b class="t">그림 확인하기</b>미리보기를 보고, 어울리지 않으면 ‘다른 이미지도 원하시나요?’에서 바꿔요.<br>‘에셋 목록’ 탭에서 그림을 골라 <b>사용해보기</b>로 넣을 수도 있어요.</li>
<li><b class="t">NEW 배지 정하기</b>새로 배포된 기능이면 켜요. 배포일부터 30일이 지나면 배지를 끈 그림으로 바꿔 올려요.</li>
<li><b class="t">저장하기</b>파일명을 확인하고 PNG로 저장해요.</li>
</ol>

<h2>분류</h2>
<div class="tbl"><table>
<tr><th>분류</th><th>이런 기능에 써요</th></tr>
${Object.values(CATS).map(v=>`<tr><td><span class="sw" style="display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px;background:linear-gradient(135deg,${v.a},${v.b})"></span>${v.label}</td><td>${v.desc}</td></tr>`).join("")}
</table></div>
<p class="hint">${BUILTIN.length}가지에 맞지 않으면 ‘만들기’ 탭의 ‘+ 분류 직접 만들기’로 추가할 수 있어요.</p>

<h2>그림 고르기 규칙</h2>
<ul>
<li>그림은 <b>1개</b>가 기본이에요. 하나로 구분이 어려울 때만 보조 그림을 1개 더해요.</li>




</ul>

<h2>하지 않아요</h2>
<ul>
<li>그림에 글자·로고를 넣거나, 인터넷에서 찾은 이미지를 쓰지 않아요(저작권).</li>
<li>크기·비율을 바꾸지 않아요. 모든 카드는 1600×900(16:9)로 같아야 해요.</li>

</ul>

<h2>저장하기</h2>
<ul>
<li>파일명은 가이드 페이지 주소의 마지막 부분과 같게 저장해요. 예: reporting-non-reimbursable.png</li>

</ul>
`;
function renderAssets(){$("#assets").innerHTML=ASSETS.map(a=>`<div class="asset" title="${a.id}"><img alt="" loading="lazy" src="${a.data}"><b>${esc(a.name)}</b><span>${esc(a.kw.split(/\s*,\s*/).slice(0,2).join(", "))}</span><button type="button" class="try" data-try="${a.id}" aria-label="${esc(a.name)} 사용해보기">사용해보기</button>${a.learned?`<em class="mine-tag">직접 추가</em><button type="button" class="del2" data-del-asset="${a.id}">삭제</button>`:""}</div>`).join("")}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
renderAssets();

/* status fade */
document.querySelectorAll(".status").forEach(el=>new MutationObserver(()=>{if(!el.textContent.trim())return;el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash")}).observe(el,{childList:true,characterData:true,subtree:true}));

/* tabs */
function moveInd(){const b=document.querySelector('nav button[aria-selected="true"]'),i=$("#tabInd");if(!b||!i)return;i.style.left=b.offsetLeft+"px";i.style.width=b.offsetWidth+"px"}
function showTab(v){document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===v));document.querySelectorAll(".view").forEach(el=>el.classList.toggle("on",el.id==="v-"+v));moveInd()}
addEventListener("resize",moveInd);document.fonts.ready.then(moveInd);setTimeout(moveInd,50);
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>showTab(b.dataset.v));

/* onboarding */
const OB_KEY="ysr-thumb:onboard-hide";
const OB=[
 {t:"이 도구는 무엇인가요?",h:`<p>GitBook <b>기능 가이드 카드</b>에 넣을 그림(썸네일)을 만드는 도구예요.</p>
 <div class="ob-flow"><span>① 제목 쓰기</span><i>→</i><span>② 그림 고르기</span><i>→</i><span>③ 저장</span></div>
 <div class="ob-tip">한 장에 1~2분이면 충분해요. 이 안내는 오른쪽 위 <b>사용 가이드</b>로 언제든 다시 볼 수 있어요.</div>`},
 {t:"① 제목 쓰기",h:`<ul><li><b>이미 있는 가이드</b>라면 ‘기존 가이드 불러오기’에서 고르기만 하면 끝이에요.</li><li><b>새 가이드</b>라면 ‘새 가이드’를 고르고, 카드 제목을 GitBook과 <b>똑같이</b> 써요.</li></ul>`},
 {t:"② 그림 고르기",h:`<ul><li><b>분류</b>를 고르면 배경색이 정해져요.</li><li>미리보기 아래 추천 그림에서 <b>이 이미지로 바꾸기</b>를 눌러요.</li><li>잘못 바꿨다면 <b>이전 이미지로 되돌리기</b>를 누르면 돼요.</li><li><b>에셋 목록</b> 탭에서 원하는 그림의 <b>사용해보기</b>를 눌러 바로 골라도 돼요.</li></ul><div class="ob-tip">규칙에 안 맞는 그림은 처음부터 목록에 나오지 않으니 편하게 고르세요.</div>`},
 {t:"③ 저장하기",h:`<ul><li>새로 나온 기능이면 <b>NEW 배지</b>를 켜요.</li><li><b>파일명</b>을 확인하고 <b>PNG 저장</b>을 눌러요.</li><li>크기·위치를 바꾸고 싶으면 <b>세부 조정</b>을 열어요. (선택)</li></ul>`}
];
let obI=0,obLast=null;
let obDir=1;
function obRender(){const s=OB[obI];const bd=$("#obBody");bd.style.setProperty("--dir",(obDir*14)+"px");bd.classList.remove("anim");void bd.offsetWidth;bd.classList.add("anim");$("#obStep").textContent=`${obI+1} / ${OB.length}`;$("#obBody").innerHTML=`<h2 id="obTitle">${s.t}</h2>${s.h}`;
  $("#obDots").innerHTML=OB.map((_,i)=>`<b class="${i===obI?"on":""}"></b>`).join("");$("#obPrev").disabled=obI===0;
  $("#obNext").textContent=obI===OB.length-1?"시작하기":"다음";$("#obBody").scrollTop=0}
function obOpen(){obLast=document.activeElement;obI=0;try{$("#obHide").checked=localStorage.getItem(OB_KEY)==="1"}catch{};obRender();$("#obBack").classList.add("on");$("#obNext").focus()}
function obClose(){try{$("#obHide").checked?localStorage.setItem(OB_KEY,"1"):localStorage.removeItem(OB_KEY)}catch{};$("#obBack").classList.remove("on");(obLast||$("#obOpen")).focus()}


/* ---------- 그림 직접 추가 + 이력 ---------- */
const LOGKEY="ysr-thumb:asset-log";
let addData=null;
function fmtTime(ms){const d=new Date(ms);const p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
async function renderLog(rows){const ol=$("#assetLog");$("#logCount").textContent=rows.length?`(${rows.length})`:"";
  if(!rows.length){ol.innerHTML='<li class="log-empty">아직 이력이 없어요.</li>';return}
  let names={};const ids=[...new Set(rows.map(r=>r.by).filter(Boolean))];
  if(userCap&&ids.length){try{const ps=await userCap.profiles(ids);for(const id of ids)names[id]=(ps[id]&&ps[id].name)||""}catch{}}
  ol.innerHTML=rows.map(r=>`<li><span class="log-act ${r.act}">${r.act==="delete"?"삭제":"추가"}</span><b></b><span class="log-meta">${fmtTime(r.at)} · <i></i></span></li>`).join("");
  [...ol.children].forEach((li,i)=>{li.querySelector("b").textContent=`‘${rows[i].name}’`;li.querySelector("i").textContent=(rows[i].by&&names[rows[i].by])||(rows[i].by?"팀원":"이 브라우저")})}
function localLog(){try{return JSON.parse(localStorage.getItem(LOGKEY)||"[]")}catch{return[]}}
function initLog(){
  if(!db){renderLog(localLog());return}
  const timer=setTimeout(()=>renderLog(localLog()),10000);
  db.collection("asset_log").orderBy("at","desc").limit(100).onSnapshot(s=>{clearTimeout(timer);renderLog(s.docs.map(d=>d.data()))},()=>{clearTimeout(timer);renderLog(localLog())})}
async function logAct(act,name){const row={act,name,at:Date.now(),by:uid||""};
  if(db){try{await db.collection("asset_log").doc().set(row);return}catch{}}
  const l=localLog();l.unshift(row);try{localStorage.setItem(LOGKEY,JSON.stringify(l.slice(0,100)))}catch{};renderLog(localLog())}
/* 배경 처리: 투명 PNG는 그대로, 단색 배경은 가장자리에서부터 지우고 여백·크기를 맞춤 */
async function prepImage(file){
  const url=URL.createObjectURL(file);const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});
  const W=im.naturalWidth,H=im.naturalHeight;const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.drawImage(im,0,0);URL.revokeObjectURL(url);
  const id=g.getImageData(0,0,W,H),p=id.data;
  let edge=0,clear=0;for(let x=0;x<W;x++)for(const y of[0,H-1]){edge++;if(p[(y*W+x)*4+3]<250)clear++}
  for(let y=0;y<H;y++)for(const x of[0,W-1]){edge++;if(p[(y*W+x)*4+3]<250)clear++}
  let keyed=false;
  if(clear/edge<0.5){ // opaque background → flood fill from border
    const br=[],bg_=[],bb=[];for(let x=0;x<W;x+=4){for(const y of[0,H-1]){const k=(y*W+x)*4;br.push(p[k]);bg_.push(p[k+1]);bb.push(p[k+2])}}
    const med=a=>a.sort((u,v)=>u-v)[a.length>>1];const R=med(br),G=med(bg_),B=med(bb);
    const dist=k=>Math.hypot(p[k]-R,p[k+1]-G,p[k+2]-B);
    const seen=new Uint8Array(W*H),st=[];const push=i=>{if(!seen[i]&&dist(i*4)<12){seen[i]=1;st.push(i)}};
    for(let x=0;x<W;x++){push(x);push((H-1)*W+x)}for(let y=0;y<H;y++){push(y*W);push(y*W+W-1)}
    while(st.length){const i=st.pop(),x=i%W,y=(i-x)/W;if(x>0)push(i-1);if(x<W-1)push(i+1);if(y>0)push(i-W);if(y<H-1)push(i+W)}
    for(let i=0;i<W*H;i++){if(seen[i]){p[i*4+3]=0;continue}
      const x=i%W,y=(i-x)/W;const nb=(x>0&&seen[i-1])||(x<W-1&&seen[i+1])||(y>0&&seen[i-W])||(y<H-1&&seen[i+W]);
      if(nb){const d=dist(i*4);p[i*4+3]=Math.max(0,Math.min(255,Math.round((d-6)/16*255)))}}
    g.putImageData(id,0,0);keyed=true}
  let x0=W,y0=H,x1=-1,y1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(p[(y*W+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)throw new Error("empty");
  const cw=x1-x0+1,ch=y1-y0+1,pad=Math.round(Math.max(cw,ch)*0.02)+8,s=Math.min(1,780/(Math.max(cw,ch)+2*pad));
  const o=document.createElement("canvas");o.width=Math.round((cw+2*pad)*s);o.height=Math.round((ch+2*pad)*s);
  const og=o.getContext("2d");og.imageSmoothingQuality="high";og.drawImage(c,x0,y0,cw,ch,pad*s,pad*s,cw*s,ch*s);
  return{canvas:o,blob:await toBlob(o),dataURL:o.toDataURL("image/png"),w:o.width,h:o.height,keyed,small:Math.max(cw,ch)<500}}
$("#addImgBtn").onclick=()=>$("#addImgFile").click();
$("#addImgFile").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  $("#addStatus").textContent="그림을 정리하고 있어요…";$("#addForm").hidden=false;
  try{addData=await prepImage(f);$("#addPrev").src=addData.dataURL;
    $("#addName").value=f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").slice(0,30);$("#addKw").value="";
    $("#addStatus").textContent=(addData.keyed?"배경을 지웠어요. ":"")+(addData.small?"그림이 작아서 썸네일에서 흐릴 수 있어요. 1024px 이상을 권장해요.":"미리보기를 확인하고 이름을 적어 주세요.");$("#addName").focus();$("#addName").select()}
  catch{addData=null;$("#addForm").hidden=true;$("#mineHint").textContent="그림을 읽지 못했어요. PNG·JPG·WEBP 파일인지 확인해 주세요."}};
$("#addCancel").onclick=()=>{addData=null;$("#addForm").hidden=true;$("#addStatus").textContent=""};
$("#addSave").onclick=async()=>{if(!addData)return;const name=$("#addName").value.trim();if(!name){$("#addStatus").textContent="그림 이름을 적어 주세요.";$("#addName").focus();return}
  const kw=$("#addKw").value.split(/[,，]/).map(s=>s.trim()).filter(Boolean).join(", ");
  const id="u_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);const btn=$("#addSave");btn.disabled=true;$("#addStatus").textContent="추가하는 중이에요…";
  try{let row={name,kw,src:"직접 추가",w:addData.w,h:addData.h,at:Date.now(),by:uid||""};
    if(db&&assetsCap){const up=await assetsCap.upload(addData.blob);row={...row,data:up.url||("/_blob/"+up.id),blobId:up.id};await db.collection("learned").doc(id).set(row)}
    else{row={...row,data:addData.dataURL};const l=localLearned();l.push({...row,id});if(!saveLocalLearned(l))throw{code:"quota"}}
    addLearned([{...row,id}]);refreshAfterAssets();await logAct("add",name);
    $("#addForm").hidden=true;addData=null;$("#mineHint").textContent=`‘${name}’을(를) 추가했어요. 아래 목록에서 바로 사용해볼 수 있어요.`;
    const card=document.querySelector(`[data-try="${id}"]`);if(card)card.closest(".asset").scrollIntoView({behavior:"smooth",block:"center"})}
  catch(err){$("#addStatus").textContent=err&&err.code==="quota"?"이 브라우저 저장 공간이 부족해요. 직접 추가한 그림을 지우거나, 생성기 담당자에게 등록을 요청해 주세요.":err&&(err.code==="permission_denied"||err.code==="not_granted")?"추가 권한이 없어요. 생성기 담당자에게 편집 권한을 요청해 주세요.":"추가하지 못했어요. 잠시 후 다시 시도해 주세요."}
  finally{btn.disabled=false}};

/* ---------- 오브젝트 선택: 미리보기 그리드 ---------- */
const PK={};
function pkLabel(id){const a=A[id];return a?`<img alt="" src="${a.data}"><span class="pk-nm"><b>${esc(a.name)}</b><small>${a.id}</small></span>`:`<span class="pk-none" aria-hidden="true"></span><span class="pk-nm"><b>없음</b><small>선택 안 함</small></span>`}
function syncPickers(){for(const k in PK){const s=PK[k].sel;PK[k].btn.innerHTML=pkLabel(s.value)+'<span class="pk-chev" aria-hidden="true"></span>';PK[k].btn.disabled=s.disabled}}
function pkClose(){for(const k in PK){PK[k].pop.hidden=true;PK[k].btn.setAttribute("aria-expanded","false")}}
function pkFill(k,q){const {sel,grid}=PK[k];const ql=(q||"").trim().toLowerCase();
  const ok=id=>!ql||(A[id]&&(A[id].name+" "+A[id].kw+" "+id).toLowerCase().includes(ql));
  const row=id=>`<button type="button" class="pk-item${id===sel.value?" on":""}" data-pk="${id}" role="option" aria-selected="${id===sel.value}">${id?`<img alt="" src="${A[id].data}" loading="lazy">`:'<span class="pk-none"></span>'}<span class="pk-t"><b>${id?esc(A[id].name):"없음"}</b>${id?`<small>${id}</small>`:""}</span></button>`;
  let h="";if(sel.querySelector('option[value=""]')&&!ql)h+=row("");
  for(const og of sel.querySelectorAll("optgroup")){const ids=[...og.querySelectorAll("option")].map(o=>o.value).filter(ok);if(ids.length)h+=`<div class="pk-grp">${esc(og.label)}</div>`+ids.map(row).join("")}
  grid.innerHTML=h||'<p class="pk-empty">맞는 그림이 없어요.</p>'}
function buildPicker(selId){const sel=$("#"+selId);sel.classList.add("pk-native");sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");
  const wrap=document.createElement("div");wrap.className="pk";
  const btn=document.createElement("button");btn.type="button";btn.className="pk-btn";btn.setAttribute("aria-haspopup","dialog");btn.setAttribute("aria-expanded","false");
  const lab=document.querySelector(`label[for="${selId}"]`);if(lab){btn.id=selId+"Pk";lab.setAttribute("for",btn.id)}
  const pop=document.createElement("div");pop.className="pk-pop";pop.hidden=true;
  pop.innerHTML='<input type="search" class="pk-q" placeholder="그림 이름·키워드 검색" aria-label="그림 검색"><div class="pk-grid" role="listbox"></div>';
  wrap.append(btn,pop);sel.after(wrap);const grid=pop.querySelector(".pk-grid"),q=pop.querySelector(".pk-q");
  PK[selId]={sel,btn,pop,grid};
  btn.onclick=()=>{const open=pop.hidden;pkClose();if(open){pop.hidden=false;btn.setAttribute("aria-expanded","true");q.value="";pkFill(selId,"");q.focus();const on=grid.querySelector(".on");if(on)on.scrollIntoView({block:"nearest"})}};
  q.oninput=()=>pkFill(selId,q.value);
  grid.onclick=e=>{const b=e.target.closest("[data-pk]");if(!b)return;sel.value=b.dataset.pk;sel.dispatchEvent(new Event("change",{bubbles:true}));pkClose();syncPickers();btn.focus()};
  pop.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();pkClose();btn.focus()}})}
document.addEventListener("click",e=>{if(!e.target.closest(".pk"))pkClose()});
buildPicker("main");buildPicker("sub");syncPickers();

/* ---------- 저장 내역 ---------- */
const HKEY="ysr-thumb:save-history";let histRows=[],histSrc="local";
function localHist(){try{return JSON.parse(localStorage.getItem(HKEY)||"[]")}catch{return[]}}
function saveLocalHist(l){try{localStorage.setItem(HKEY,JSON.stringify(l.slice(0,60)));return true}catch{return false}}
async function thumbOf(c){const t=document.createElement("canvas");t.width=400;t.height=225;const g=t.getContext("2d");g.imageSmoothingQuality="high";g.drawImage(c,0,0,400,225);return t.toDataURL("image/webp",0.82)}
async function recordSave(st,c){const at=Date.now();const id="h_"+at.toString(36)+Math.random().toString(36).slice(2,5);
  const row={id,title:st.title||"(제목 없음)",file:(st.file||slug(st.title)),settings:{...st},at,by:uid||""};
  if(db&&uid&&histSrc==="db"){try{
    let thumb=await thumbOf(c),thumbId="";
    if(assetsCap){try{const tc=document.createElement("canvas");tc.width=400;tc.height=225;tc.getContext("2d").drawImage(c,0,0,400,225);
      const up=await assetsCap.upload(await new Promise(r=>tc.toBlob(r,"image/webp",0.82)));thumb=up.url||("/_blob/"+up.id);thumbId=up.id}catch{}}
    const ref=db.doc("saves/"+uid);const cur=(await ref.get()).data()||{};const entries=[{...row,thumb,thumbId},...(cur.entries||[])].slice(0,150);
    await ref.set({by:uid,entries,updatedAt:at});return}catch(e){console.warn(e)}}
  const l=localHist();l.unshift({...row,thumb:await thumbOf(c)});saveLocalHist(l);if(histSrc!=="db"){histRows=localHist();renderHist()}}
let isAdmin=false;
async function renderHist(){const box=$("#hist");const q=($("#histQ").value||"").trim().toLowerCase();
  const rows=histRows.filter(r=>!q||(r.title+" "+r.file).toLowerCase().includes(q));
  $("#histInfo").textContent=(histRows.length?`${histRows.length}건 · `:"")+(histSrc==="db"?(isAdmin?"관리자 보기: 팀 전체 저장 내역":"내가 저장한 내역만 보여요"):"이 브라우저에만 저장");
  if(!rows.length){box.innerHTML=`<p class="log-empty">${histRows.length?"검색 결과가 없어요.":"아직 저장한 썸네일이 없어요."}</p>`;return}
  let names={};const ids=[...new Set(rows.map(r=>r.by).filter(Boolean))];
  if(userCap&&ids.length){try{const ps=await userCap.profiles(ids);for(const id of ids)names[id]=(ps[id]&&ps[id].name)||""}catch{}}
  box.innerHTML=rows.map(r=>`<article class="hcard" data-h="${r.id}" data-by="${r.by||""}"><img alt="" src="${r.thumb}"><div class="hmeta"><b></b><span class="hfile"></span><span class="hwho">${fmtTime(r.at)} · <i></i></span></div>
    <div class="hacts"><button type="button" class="btn primary" data-hact="open">다시 열기</button><button type="button" class="btn" data-hact="save">다시 저장</button>${histSrc!=="db"||isAdmin||r.by===uid?'<button type="button" class="btn hdel" data-hact="del" aria-label="삭제">삭제</button>':""}</div></article>`).join("");
  [...box.children].forEach((el,i)=>{const r=rows[i];el.querySelector("b").textContent=r.title;el.querySelector(".hfile").textContent=r.file+".png";el.querySelector("i").textContent=r.by===uid&&uid?"나":((r.by&&names[r.by])||(r.by?"팀원":"이 브라우저"))})}
async function initHist(){
  if(!db||!uid){const hs=$("#histScope");if(hs)hs.textContent="저장 내역은 이 브라우저에만 남아요.";histRows=localHist();renderHist();return}
  try{isAdmin=!!(userCap&&await userCap.canEdit())}catch{isAdmin=false}
  histSrc="db";const timer=setTimeout(()=>{histSrc="local";histRows=localHist();renderHist()},10000);
  db.collection("saves").onSnapshot(s=>{clearTimeout(timer);histSrc="db";const out=[];
      for(const d of s.docs){const v=d.data()||{};if(Array.isArray(v.entries))for(const e of v.entries)out.push({...e,by:e.by||v.by||d.id,_doc:d.id});else if(v.title)out.push({...v,id:d.id,_doc:d.id,_flat:true})}
      histRows=out.sort((a,b)=>b.at-a.at);renderHist()},
    ()=>{clearTimeout(timer);histSrc="local";histRows=localHist();renderHist()})}
$("#histQ").addEventListener("input",renderHist);
function openSettings(s){const st={...s};$("#preset").value="";$("#title").value=st.title||"";$("#fname").value=st.file||"";
  const c=document.querySelector(`input[name=cat][value="${CATS[st.cat]?st.cat:"common"}"]`);if(c)c.checked=true;
  $("#main").value=A[st.main]?st.main:"";$("#sub").value=A[st.sub]?st.sub:"";$("#isNew").checked=!!st.isNew;setAdj(st);curFlag="";histStack.length=0;$("#altUndo").disabled=true;
  newBase={cat:st.cat,main:$("#main").value,sub:$("#sub").value};update();refreshAlts(true);
  return !A[st.main]&&st.main}
$("#hist").addEventListener("click",async e=>{const b=e.target.closest("[data-hact]");if(!b)return;const id=b.closest("[data-h]").dataset.h;const r=histRows.find(x=>x.id===id);if(!r)return;
  if(b.dataset.hact==="open"){const missing=openSettings({...r.settings,title:r.title,file:r.file});showTab("make");scrollTo({top:0,behavior:"smooth"});
    $("#saveStatus").textContent=missing?"저장할 때 쓴 그림이 지금 에셋 목록에 없어요. 메인 오브젝트를 다시 골라 주세요.":`‘${r.title}’을(를) 불러왔어요.`}
  if(b.dataset.hact==="save"){if(!A[r.settings.main]){alert("저장할 때 쓴 그림이 에셋 목록에서 삭제되어 다시 저장할 수 없어요.");return}
    const c=document.createElement("canvas");c.width=W;c.height=H;await render(c,{...r.settings,chip:r.settings.chip!==false});
    try{await saveBlob(r.file+".png",await toBlob(c))}catch(err){alert(saveErr(err))}}
  if(b.dataset.hact==="del"){if(!confirm(`‘${r.title}’ 저장 내역을 삭제할까요?`))return;
    try{if(histSrc==="db"){if(r._flat)await db.doc("saves/"+r._doc).delete();else{const ref=db.doc("saves/"+r._doc);const cur=(await ref.get()).data()||{};
        await ref.set({...cur,entries:(cur.entries||[]).filter(x=>x.id!==id),updatedAt:Date.now()});if(r.thumbId&&assetsCap){try{await assetsCap.delete(r.thumbId)}catch{}}}}
      else{saveLocalHist(localHist().filter(x=>x.id!==id));histRows=localHist();renderHist()}}
    catch(err){alert(err.code==="permission_denied"?"삭제 권한이 없어요.":"삭제하지 못했어요. 잠시 후 다시 시도해 주세요.")}}});
/* ---------- 새 그림 만들기 꿀팁 ---------- */
const TIP_REFS=(RULES.styleRefs||[]).filter(id=>A[id]);
function tipPromptText(subj){return `첨부한 아이콘들과 같은 스타일로 「${subj||"[그릴 대상]"}」을(를) 3D 아이콘 1개로 그려 주세요.

- 스타일: 첨부 이미지와 같은 부드러운 3D 클레이, 매끈한 표면, 둥근 모서리, 은은한 광택
- 색: 첨부 이미지와 같은 톤의 블루·민트·코랄·노랑·흰색 중심, 채도는 첨부 이미지 수준
- 조명: 왼쪽 위에서 부드러운 빛, 오브젝트 아래에 옅은 그림자
- 구도: 정면 또는 살짝 위에서 본 3/4 시점, 오브젝트 1개만 화면 가운데, 여백 넉넉히
- 배경: 투명 배경 (어려우면 순수 흰색 단색)
- 넣지 말 것: 글자, 숫자, 로고, $·% 기호, 테두리, 여러 개 나열, 사람(의료인 제외)
- 크기: 정사각형 1024×1024 이상`}
function tipSync(){$("#tipPrompt").textContent=tipPromptText($("#tipSubject").value.trim())}
let tipLast=null;
function tipOpen(){tipLast=document.activeElement;$("#tipRefs").innerHTML=TIP_REFS.map(id=>`<img alt="${esc(A[id].name)}" src="${A[id].data}">`).join("");
  if(!$("#tipSubject").value)$("#tipSubject").value=$("#title").value.trim();tipSync();$("#tipBack").classList.add("on");$("#tipSubject").focus()}
function tipClose(){$("#tipBack").classList.remove("on");(tipLast||$("#tipFab")).focus()}
$("#tipFab").onclick=tipOpen;
$("#tipGoAdd").onclick=()=>{tipClose();showTab("lib");setTimeout(()=>{$("#mine").scrollIntoView({behavior:"smooth",block:"start"});$("#addImgFile").click()},120)};$("#tipX").onclick=tipClose;$("#tipClose").onclick=tipClose;
$("#tipBack").addEventListener("click",e=>{if(e.target.id==="tipBack")tipClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#tipBack").classList.contains("on"))tipClose()});
$("#tipSubject").addEventListener("input",tipSync);
$("#tipCopy").onclick=async()=>{const t=$("#tipPrompt").textContent;try{await navigator.clipboard.writeText(t);$("#tipCopyStatus").textContent="복사했어요"}catch{const r=document.createRange();r.selectNodeContents($("#tipPrompt"));const s=getSelection();s.removeAllRanges();s.addRange(r);$("#tipCopyStatus").textContent="선택했어요 — Ctrl+C로 복사하세요"}};
$("#tipRefDl").onclick=async()=>{
  if(!window.JSZip){$("#tipRefStatus").textContent="지금은 받을 수 없어요. 새로고침 후 다시 시도해 주세요.";return}
  try{const z=new JSZip();for(const id of TIP_REFS){const im=await loadImg(A[id]);const c=document.createElement("canvas");c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext("2d").drawImage(im,0,0);z.file(`example_${id}.png`,await toBlob(c))}
    const how=await saveBlob("thumbnail-style-examples.zip",await z.generateAsync({type:"blob"}));$("#tipRefStatus").textContent=how==="app"?"저장했어요.":"다운로드를 시작했어요."}
  catch(e){$("#tipRefStatus").textContent=saveErr(e)}};
$("#obOpen").onclick=obOpen;$("#obX").onclick=obClose;
$("#obPrev").onclick=()=>{if(obI>0){obI--;obDir=-1;obRender()}};
$("#obNext").onclick=()=>{if(obI<OB.length-1){obI++;obDir=1;obRender()}else{const go=OB[obI].go;obClose();if(go){showTab(go);scrollTo(0,0)}}};
$("#obBack").addEventListener("click",e=>{if(e.target===$("#obBack"))obClose()});
document.addEventListener("keydown",e=>{if(!$("#obBack").classList.contains("on"))return;
  if(e.key==="Escape")obClose();
  if(e.key==="Tab"){const f=[...$("#obBack").querySelectorAll("button,input,a[href]")].filter(x=>!x.disabled);const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
(()=>{let hide=false;try{hide=localStorage.getItem(OB_KEY)==="1"}catch{};if(!hide)obOpen()})();

{const d=Math.max(0,PRESETS.findIndex(p=>p.default));$("#preset").value=String(d);apply(PRESETS[d]);refreshAlts(true)}
$("#preset").addEventListener("change",()=>refreshAlts(true));
function syncRestore(){const i=$("#preset").value;$("#restore").hidden=!(i!==""&&loadOv(PRESETS[+i].file))}
$("#preset").addEventListener("change",syncRestore);
$("#restore").onclick=()=>{const i=$("#preset").value;if(i==="")return;try{localStorage.removeItem(STORE+PRESETS[+i].file)}catch{};delete presetThumbs[+i];apply(PRESETS[+i]);refreshAlts(true);syncRestore();$("#altStatus").textContent="디자인팀 기본 매칭으로 복원했습니다."};
document.querySelectorAll("[data-preset-count]").forEach(e=>e.textContent=PRESETS.length);
