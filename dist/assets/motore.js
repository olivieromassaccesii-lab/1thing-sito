/* 1thing — il motore a pastello dell'app, per il sito.
   Estratto da motore-pastello/index.html (17/11/2026): stesso codice di disegno,
   solo la parte che serve a dipingere un dipinto giorno per giorno. */
(function(){
'use strict';
var DATI=window.DATI=window.DATI||{};
const BASE=(document.currentScript&&document.currentScript.src||'').replace(/[^/]*$/,'');
let STYLE='nuovo',OPT={fields:true,fill:true,shade:true,ink:true},RUN=0,CUR=null,X=null;
function show(c){X.setTransform(1,0,0,1,0,0);X.drawImage(c,0,0)}
const S=2, W=390, H=880, PAPER='#f8f5ee';
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const hexRgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
const css=(c,a=1)=>`rgba(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)},${a})`;
const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
function rgb2hsl([r,g,b]){const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h,s,l]}
function hsl2rgb([h,s,l]){if(!s)return[l,l,l];const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;const f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[f(h+1/3),f(h),f(h-1/3)]}
const PC=new Map(); const P2=d=>{let p=PC.get(d);if(!p){p=new Path2D(d);PC.set(d,p)}return p};
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}

// ================= grana e tratti del pastello, grandi quanto il foglio =================
function specks(seed,p){
  const w=W*S>>1,h=H*S>>1,c=mk(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),R=rng(seed);
  for(let i=0;i<w*h;i++){im.data[i*4+3]=R()<p?150+R()*105:0}
  x.putImageData(im,0,0);return c;
}
function hatchTex(angle,gap,w0,w1,seed,holes){
  const c=mk(W*S,H*S),x=c.getContext('2d');x.scale(S,S);x.lineCap='round';
  const R=rng(seed),u=[Math.cos(angle),Math.sin(angle)],n=[-u[1],u[0]];
  const cs=[[0,0],[W,0],[0,H],[W,H]];
  const dn=cs.map(p=>p[0]*n[0]+p[1]*n[1]),dt=cs.map(p=>p[0]*u[0]+p[1]*u[1]);
  const d0=Math.min(...dn),d1=Math.max(...dn),t0=Math.min(...dt),t1=Math.max(...dt);
  for(let d=d0;d<d1;d+=gap*(0.85+R()*0.3)){
    let t=t0-R()*20;
    while(t<t1){
      const len=14+R()*20,j=(R()-0.5)*0.5;
      const ax=u[0]*t+n[0]*(d+j),ay=u[1]*t+n[1]*(d+j),bx=u[0]*(t+len)+n[0]*(d-j),by=u[1]*(t+len)+n[1]*(d-j);
      if(!((ax<-4&&bx<-4)||(ax>W+4&&bx>W+4)||(ay<-4&&by<-4)||(ay>H+4&&by>H+4))){
        x.globalAlpha=0.55+R()*0.45;x.lineWidth=w0+R()*(w1-w0);
        x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.stroke();
      }
      t+=len+0.6+R()*1.6;
    }
  }
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='destination-out';
  x.drawImage(holes,0,0,W*S,H*S);
  return c;
}
function grainTex(holes){
  const c=mk(W*S,H*S),x=c.getContext('2d');x.fillRect(0,0,c.width,c.height);
  x.globalCompositeOperation='destination-out';x.translate(c.width,0);x.scale(-1,1);x.drawImage(holes,0,0,W*S,H*S);return c;
}
const TEX={};
function buildTex(){
  const h1=specks(11,0.15),h2=specks(29,0.10);
  TEX.diag=hatchTex(-0.95,1.25,0.95,1.35,101,h1);   // oggetti e cielo
  TEX.horiz=hatchTex(-0.035,1.2,0.95,1.4,202,h1);   // acqua
  TEX.sand=hatchTex(-0.16,1.25,1.0,1.45,303,h1);    // terreno
  TEX.grain=grainTex(h2);
}
// una campitura: tratti (kind) + velo sfumato sotto (under), colore rgb, dentro
// bbox; grad = [[y,alpha],…] in verticale. Il clip è di chi chiama.
const SCR=mk(4,4),SG=SCR.getContext('2d');
function pastel(ctx,b,rgb,alpha,kind,under,grad){
  if(alpha<=0.004)return;
  const px=Math.max(0,Math.floor(b[0]*S)-2),py=Math.max(0,Math.floor(b[1]*S)-2);
  const qx=Math.min(W*S,Math.ceil(b[2]*S)+2),qy=Math.min(H*S,Math.ceil(b[3]*S)+2);
  const sw=qx-px,sh=qy-py;if(sw<1||sh<1)return;
  SCR.width=sw;SCR.height=sh;
  SG.drawImage(TEX[kind],px,py,sw,sh,0,0,sw,sh);
  if(under){SG.globalAlpha=under;SG.drawImage(TEX.grain,px,py,sw,sh,0,0,sw,sh);SG.globalAlpha=1}
  if(grad){
    const y0=grad[0][0],yN=grad[grad.length-1][0];
    const g=SG.createLinearGradient(0,y0*S-py,0,yN*S-py);
    for(const [y,a] of grad)g.addColorStop((y-y0)/(yN-y0),`rgba(0,0,0,${a})`);
    SG.globalCompositeOperation='destination-in';SG.fillStyle=g;SG.fillRect(0,0,sw,sh);
  }
  SG.globalCompositeOperation='source-in';SG.fillStyle=css(rgb);SG.fillRect(0,0,sw,sh);
  SG.globalCompositeOperation='source-over';
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(SCR,px/S,py/S,sw/S,sh/S);ctx.restore();
}
let PAPERC=null;
function paper(x){
  if(!PAPERC){
    PAPERC=mk(W*S,H*S);const p=PAPERC.getContext('2d');p.scale(S,S);
    p.fillStyle=PAPER;p.fillRect(0,0,W,H);
    const R=rng(5);p.fillStyle='#8a7a5e';
    for(let i=0;i<2600;i++){p.globalAlpha=0.02+R()*0.03;p.beginPath();p.arc(R()*W,R()*H,0.3+R()*0.5,0,7);p.fill()}
    p.strokeStyle='#8a7a5e';p.lineWidth=0.3;
    for(let i=0;i<90;i++){const a=R()*W,b=R()*H,t=R()*6.3;p.globalAlpha=0.05;p.beginPath();p.moveTo(a,b);p.quadraticCurveTo(a+Math.cos(t)*5+R()*3,b+Math.sin(t)*5+R()*3,a+Math.cos(t)*10,b+Math.sin(t)*10);p.stroke()}
  }
  x.drawImage(PAPERC,0,0,W,H);
}
const INKTILE=new Map();
function inkPat(ctx,rgb){
  const k=rgb.join();let c=INKTILE.get(k);
  if(!c){c=mk(96,96);const g=c.getContext('2d'),im=g.createImageData(96,96),R=rng(77);
    for(let i=0;i<96*96;i++){im.data[i*4]=rgb[0]*255;im.data[i*4+1]=rgb[1]*255;im.data[i*4+2]=rgb[2]*255;im.data[i*4+3]=R()<0.84?255:90+R()*90}
    g.putImageData(im,0,0);INKTILE.set(k,c)}
  const p=ctx.createPattern(c,'repeat');p.setTransform(new DOMMatrix().scale(1/S));return p;
}

// ================= attrezzi per gli sfondi =================
const band=(x,y0,y1,hex,tex,under,stops,a=1)=>pastel(x,[0,y0,W,y1],hexRgb(hex),a,tex,under,stops);
function lens(cx,cy,w,h){const p=new Path2D();p.moveTo(cx-w/2,cy);p.bezierCurveTo(cx-w/4,cy-h,cx+w/4,cy-h,cx+w/2,cy);p.bezierCurveTo(cx+w/4,cy+h,cx-w/4,cy+h,cx-w/2,cy);return p}
function below(fn){const p=new Path2D();p.moveTo(-2,H+2);p.lineTo(W+2,H+2);for(let q=W+2;q>=-2;q-=3)p.lineTo(q,fn(q));p.closePath();return p}
function between(top,fn){const p=new Path2D();p.moveTo(-2,top);p.lineTo(W+2,top);for(let q=W+2;q>=-2;q-=3)p.lineTo(q,fn(q));p.closePath();return p}
function patch(x,cx,cy,w,h,hex,a,tex){const p=lens(cx,cy,w,h*1.5);x.save();x.clip(p);pastel(x,[cx-w/2,cy-h*1.5,cx+w/2,cy+h*1.5],hexRgb(hex),a,tex,0.3,[[cy-h*1.15,0],[cy-h*0.3,1],[cy+h*0.3,1],[cy+h*1.15,0]]);x.restore()}
function patches(x,seed,n,y0,y1,w0,w1,h0,h1,cols,a,tex){const R=rng(seed);for(let i=0;i<n;i++)patch(x,R()*W,y0+R()*(y1-y0),w0+R()*(w1-w0),h0+R()*(h1-h0),cols[i%cols.length],a*(0.8+R()*0.4),tex)}
const flat=(top,amp,ph)=>q=>top+amp*Math.sin(q/47+ph)+amp*0.5*Math.sin(q/17+ph*2);

// ================= i cinque dipinti: cosa diventa sfondo, e come =================
const shoreY=x=>508+5*Math.sin(x/55+0.6)+2.5*Math.sin(x/19);
const CFG={
 costa:{nome:'la costa d’inverno',
  bg:['cielo','mare','orizzonte','sabbia','sabbia bagnata','sabbia-estesa','sera'],
  white:['nuvola'],soft:{'duna':['#c79f62',0.42],'pozza — conca':['#c79f62',0.42]},hosted:['acqua'],dropWash:['schiuma'],
  fields:[
   {kinds:['cielo'],draw(x){
     band(x,70,302,'#93b7d2','diag',0.45,[[76,0],[132,0.56],[196,0.5],[258,0.22],[302,0.08]]);
     band(x,150,302,'#f0bf97','diag',0.45,[[150,0],[236,0.46],[302,0.66]]);}},
   {kinds:['mare','orizzonte'],draw(x,P){
     x.save();x.clip(between(300,shoreY));
     band(x,300,520,'#79a8be','horiz',0.32,[[300,0.9],[335,0.66],[420,0.56],[520,0.5]]);
     band(x,300,420,'#42718f','horiz',0.3,[[300,0.7],[316,0.4],[350,0.1],[420,0]]);
     band(x,430,520,'#8fcdb9','horiz',0.5,[[430,0],[520,0.55]]);
     const R=rng(9);
     for(let i=0;i<16;i++){const cy=318+R()*165,w=70+R()*170,cx=R()*W,h=1.6+R()*2.6;patch(x,cx,cy,w,h,'#3f6f8d',0.3+R()*0.2,'horiz')}
     // il riflesso del sole: carta lasciata libera, poi un filo di giallo
     const G=rng(31),sx=P.sun?P.sun[0]:226;
     for(let i=0;i<110;i++){
       const t=Math.pow(G(),1.9),y=303+t*150,hw=5+t*26,cx=sx+(G()-0.5)*2*hw,len=3+G()*(5+t*10);
       x.strokeStyle=PAPER;x.globalAlpha=0.92;x.lineWidth=0.9+G()*0.7;x.beginPath();x.moveTo(cx-len/2,y);x.lineTo(cx+len/2,y+(G()-0.5)*0.5);x.stroke();
       if(G()<0.55){x.strokeStyle='#f1c75e';x.globalAlpha=0.5;x.lineWidth=0.7;x.beginPath();x.moveTo(cx-len/3,y+0.2);x.lineTo(cx+len/3,y+0.2);x.stroke()}
     }
     x.globalAlpha=1;x.strokeStyle=PAPER;x.lineWidth=1.8;x.setLineDash([26,9,40,14,18,11]);x.beginPath();
     for(let q=-2;q<=W+2;q+=3){const y=shoreY(q+40)-13+1.5*Math.sin(q/11);q<0?x.moveTo(q,y):x.lineTo(q,y)}x.stroke();x.setLineDash([]);
     x.restore();}},
   {kinds:['sabbia','sabbia bagnata','schiuma'],draw(x){
     x.save();x.clip(below(shoreY));
     band(x,496,H,'#e6c88f','sand',0.36,null,0.8);
     band(x,496,566,'#a98a6c','sand',0.5,[[500,0.62],[530,0.4],[566,0]]);
     patches(x,17,9,575,865,120,310,8,21,['#c39f69','#eab49a'],0.3,'sand');
     band(x,740,H,'#b98f5c','sand',0.4,[[740,0],[880,0.4]]);
     x.restore();
     x.strokeStyle=PAPER;x.lineWidth=5;x.lineCap='round';x.beginPath();
     for(let q=-4;q<=W+4;q+=3){const y=shoreY(q)+0.5;q<0?x.moveTo(q,y):x.lineTo(q,y)}x.stroke();}}
  ]},
 giardino:{nome:'il giardino',
  bg:['cielo','prato','erba secca','orizzonte','prato-esteso','sera'],
  white:[],soft:{},hosted:['acqua'],dropWash:[],path:['sentiero'],darkMix:0.4,alphaK:0.8,under:{'mucca — zampe':'mucca — corpo'},
  fields:[
   {kinds:['cielo'],draw(x){
     band(x,60,300,'#a3c6dd','diag',0.45,[[66,0],[150,0.42],[215,0.36],[270,0.16],[300,0.06]]);
     band(x,170,300,'#f4dfb0','diag',0.45,[[170,0],[250,0.26],[300,0.34]]);}},
   {kinds:['prato','erba secca','orizzonte'],draw(x){
     // le colline lontane, dietro gli alberi
     x.save();x.clip(below(q=>203+7*Math.sin(q/61+0.8)+4*Math.sin(q/23)));
     band(x,188,304,'#9fb8b0','diag',0.45,[[192,0.5],[240,0.42],[300,0.3]]);x.restore();
     x.save();x.clip(below(q=>226+5*Math.sin(q/44+2)+3*Math.sin(q/17)));
     band(x,214,304,'#a9bf96','diag',0.45,[[218,0.36],[300,0.34]]);x.restore();
     // il prato: chiaro dove sta l'obiettivo, più verde verso chi guarda
     x.save();x.clip(below(flat(298,1.5,0.4)));
     band(x,294,H,'#bdd07e','sand',0.36,[[296,0.5],[330,0.36],[470,0.38],[620,0.6],[880,0.74]]);
     band(x,294,350,'#8fb09a','sand',0.4,[[296,0.42],[318,0.2],[350,0]]);
     patches(x,41,7,486,860,110,280,7,16,['#d9da86','#9cbc66','#cbd88a'],0.26,'sand');
     patches(x,43,3,640,800,100,200,7,13,['#d8c27a'],0.26,'sand');
     band(x,640,H,'#78a052','sand',0.4,[[640,0],[880,0.4]]);
     x.restore();}}
  ]},
 bosco:{nome:'il bosco d’autunno',
  bg:['cielo','suolo','radura','nebbia','terra-estesa','muschio-esteso','sera'],
  white:['nuvola'],soft:{},hosted:['acqua'],dropWash:[],dropUnhosted:['colline'],under:{'cervo — zampe':'cervo — corpo'},washK:{'ruscello':0.75},
  fields:[
   {kinds:['cielo'],draw(x){
     band(x,66,306,'#a6c2d6','diag',0.45,[[72,0],[122,0.42],[190,0.2],[250,0]]);
     band(x,90,306,'#f2c98f','diag',0.45,[[96,0],[170,0.3],[250,0.5],[306,0.6]]);}},
   {kinds:['suolo','radura','nebbia'],draw(x){
     x.save();x.clip(below(flat(296,1.5,1.3)));
     band(x,292,H,'#dfae68','sand',0.36,[[294,0.5],[360,0.46],[480,0.5],[620,0.78],[880,0.92]]);
     patch(x,195,405,560,54,'#b6bd6c',0.34,'sand');
     patch(x,250,360,260,22,'#efd9a6',0.4,'sand');
     patches(x,57,11,500,865,90,260,6,16,['#c9743a','#e6b758','#b98a4c'],0.3,'sand');
     band(x,600,H,'#a25a34','sand',0.4,[[600,0],[880,0.5]]);
     x.restore();}}
  ]},
 deserto:{nome:'il deserto rosso',
  bg:['cielo','polvere','polvere della luna','suolo','ombre della sabbia','orizzonte','sabbia-estesa','sera'],
  white:[],soft:{},hosted:['acqua'],dropWash:[],washK:{'crepa':0.32,'luce della crepa':0.5},
  fields:[
   {kinds:['cielo'],draw(x){
     band(x,62,310,'#d58a96','diag',0.45,[[68,0],[112,0.36],[180,0.16],[230,0]]);
     band(x,80,310,'#eeae88','diag',0.45,[[86,0],[150,0.42],[240,0.5],[310,0.4]]);
     band(x,220,310,'#f7d9a2','diag',0.45,[[220,0],[310,0.5]]);}},
   {kinds:['suolo','polvere','orizzonte','ombre della sabbia'],draw(x){
     x.save();x.clip(below(flat(300,1.2,2.1)));
     band(x,296,H,'#d2824c','sand',0.36,[[298,0.56],[350,0.5],[480,0.54],[620,0.8],[880,0.94]]);
     patch(x,195,302,420,5,'#8f4a30',0.5,'sand');
     patches(x,71,6,540,800,120,280,7,17,['#8e6480'],0.3,'sand');
     patches(x,73,7,340,860,110,280,6,15,['#eeb07c','#b9653c'],0.3,'sand');
     band(x,620,H,'#8a4026','sand',0.4,[[620,0],[880,0.52]]);
     x.restore();}}
  ]},
 luminoso:{nome:'il luminoso',
  bg:['cielo','suolo','terra-estesa','sera'],
  white:[],soft:{},hosted:['acqua','pianeta — fasce'],dropWash:[],extFree:['fiume-esteso'],washK:{'fiume':0.7,'fiume — luce':0.35,'fiume-esteso':0.55},
  fields:[
   {kinds:['cielo'],draw(x){
     band(x,60,314,'#98a3d8','diag',0.45,[[66,0],[122,0.62],[230,0.56],[314,0.34]]);
     band(x,200,314,'#e6b8d4','diag',0.45,[[200,0],[314,0.5]]);}},
   {kinds:['suolo'],draw(x){
     x.save();x.clip(below(flat(300,1.2,0.7)));
     band(x,296,H,'#909dc0','sand',0.36,[[298,0.56],[350,0.5],[480,0.52],[620,0.76],[880,0.92]]);
     patches(x,91,10,340,860,110,290,6,16,['#7fd0c8','#a98fe0','#5f6d96'],0.26,'sand');
     band(x,600,H,'#474e7c','sand',0.4,[[600,0],[880,0.56]]);
     x.restore();}}
  ]},
 // lo studio del pittore (il profilo): non ha sfondi a parte, le pareti e il
 // pavimento sono unità come le altre (l'app le ripete ai lati). Le loro
 // velature libere diventano campiture a pastello dentro la loro forma.
 studio:{nome:'lo studio',studio:true,
  bg:[],white:[],soft:{},hosted:[],dropWash:[],noFar:true,keepTop:true,emblems:false,
  room:k=>k==='muro'||k==='pavimento'||k.startsWith('pareti:'),
  fields:[]},
 // il prato dell'onboarding: la striscia d'erba è una campitura, il resto
 // (l'albero, le capre, i fiori che arrivano a ogni domanda) come i dipinti
 prato:{nome:'il prato dell’onboarding',
  bg:[],white:[],soft:{},hosted:[],dropWash:[],noFar:true,keepTop:true,emblems:false,
  room:k=>k==='prato-esteso',dropUnhosted:['chioma'],
  fields:[]}
};
// le decorazioni dello studio: per ogni posto la variante mostrata
// (StudioData.swift: la prima è quella di partenza; gli stili ne cambiano tante)
const DECO_BASE={soffitto:'niente',pareti:'tinta',tende:'rosa',lucine:'niente',davanzale:'basilico',mensola:'niente',parete:'niente',scrivania:'niente',sottotavolo:'niente',angolo:'niente',tappeto:'rosa',cuccia:'niente'};
const DECO_STYLES={
 partenza:{},
 autunno:{pareti:'legno',soffitto:'lanterna',tende:'rosa',lucine:'lampadine',davanzale:'geranio',mensola:'candela',parete:'cucu',scrivania:'tazza',sottotavolo:'gomitoli',angolo:'scala',tappeto:'juta',cuccia:'plaid'},
 primavera:{pareti:'fiori',soffitto:'nuvole',tende:'fiori',lucine:'bandierine',davanzale:'lavanda',mensola:'rampicante',parete:'ghirlanda',scrivania:'fiori',sottotavolo:'pouf',angolo:'monstera',tappeto:'rosa',cuccia:'cuscino'},
 mare:{pareti:'azzurre',soffitto:'acchiappasogni',tende:'azzurre',lucine:'niente',davanzale:'cactus',mensola:'tazze',parete:'mappa',scrivania:'libri',sottotavolo:'dischi',angolo:'lampada',tappeto:'blu',cuccia:'cesta'},
 serra:{pareti:'salvia',soffitto:'pianta',tende:'salvia',lucine:'lampadine',davanzale:'felce',mensola:'rampicante',parete:'bacheca',scrivania:'fiori',sottotavolo:'libri',angolo:'monstera',tappeto:'scacchi',cuccia:'cesta'}};
let DECO='partenza',STUDIO_TELA=null;
function studioShows(k){
  if(k==='matita'||k==='gatto'||k==='gatto — zzz'||k==='sveglia — suona')return false;
  const i=k.indexOf(':');if(i<0)return true;
  const slot=k.slice(0,i);if(!(slot in DECO_BASE))return true;
  return k.slice(i+1)===(DECO_STYLES[DECO][slot]||DECO_BASE[slot]);
}
const GLOW=/acces|luce|aurora|sera/;
const DETAIL=/lontano|erba|sassolini|olivello|cardo|fiore di duna|onde|schiuma|catena|cima|alghe|riflessi|raggi|fumo|tralcio|viticci|canne|foglie a terra|rami|stelle|increspature|filamenti/;

// ================= colore =================
const INK=[58/255,45/255,38/255], SHADOW=[0.36,0.29,0.40], PAPERRGB=hexRgb(PAPER);
const HC=new Map();
// il pelo grigio degli animali resta caldo: niente ardesia
let WARM=false;
function tune(hex,fam){
  const k=hex+fam+(WARM?'w':'');if(HC.has(k))return HC.get(k);
  const o=hexRgb(hex);let [h,s,l]=rgb2hsl(o);const f=fam?fam[0]:'';let c;
  if(l>0.86)c=mix(o,PAPERRGB,0.5);                                     // i bianchi restano carta
  else{
    if(f==='g'){s=Math.min(1,s*(s<0.2?2.1:1.25));l*=0.93}             // foglie: verde salvia, non grigio
    else if(!WARM&&((f==='n'&&s<0.2)||s<0.1)){h=0.61;s=Math.min(0.2,s+0.07);l*=0.97} // pietre e grigi: ardesia
    else if(f==='r'){s=Math.min(1,s*1.1);l=Math.min(0.8,l*1.03)}
    else if(f==='b'){s=Math.min(1,s*1.25);l*=0.95}
    else if(f==='y'){s=Math.min(1,s*(s>0.5?1.1:1.2))}
    c=hsl2rgb([h,s,l]);
  }
  HC.set(k,c);return c;
}
const deeper=c=>mix(c,SHADOW,0.42);
const inside=(b,m,e)=>b[0]>=m[0]-e&&b[1]>=m[1]-e&&b[2]<=m[2]+e&&b[3]<=m[3]+e;
const area=b=>Math.max(0.01,(b[2]-b[0])*(b[3]-b[1]));
const inkWidth=u=>(u[3]<=0.7?0.85:u[2]>520?1.25:1.05)*(DETAIL.test(u[0])?0.86:1);
const inkColor=u=>u[3]<=0.7?mix(INK,[0.5,0.56,0.62],0.22):INK;

// ================= una unità, stile nuovo =================
// le maschere dell'app sono un filo più larghe del contorno: sul prato
// verde la carta usciva dalle linee (le zampe della mucca). Si stringono di
// circa un punto verso il centro, così carta e colore restano dentro.
const INSET=new Map();
function insetP(d,b){let p=INSET.get(d);if(p)return p;
  const w=b[2]-b[0],h=b[3]-b[1],k=1.1;
  if(w<4||h<4)p=P2(d);else{const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,sx=(w-2*k)/w,sy=(h-2*k)/h;
    p=new Path2D();p.addPath(P2(d),new DOMMatrix().translate(cx,cy).scale(sx,sy).translate(-cx,-cy))}
  INSET.set(d,p);return p}
let HOSTS=[];
function drawUnit(x,u,cfg,isExt,o){
  const kind=u[0],far=!cfg.noFar&&u[3]<=0.7&&u[2]<480,layers=u[4];
  if(cfg.bgSet.has(kind))return;
  if(cfg.noFar&&u[3]<=0.7)u=[u[0],u[1],u[2],1,u[4]];
  if(o.pass==='line'){if(!o.ink)return;const iw=inkWidth(u),ic=inkColor(u);
    for(const L of layers)if(L[0]==='s'&&!L.skip){x.globalAlpha=Math.min(1,L[2]*0.92);x.strokeStyle=inkPat(x,ic);x.lineWidth=iw;x.stroke(P2(L[1]))}
    x.globalAlpha=1;return}
  const dropW=cfg.dropWash.includes(kind),glow=GLOW.test(kind),hosted=cfg.hosted.includes(kind);
  const softC=cfg.soft[kind],white0=cfg.white.includes(kind);
  const inkW=inkWidth(u),inkC=inkColor(u);
  let cur=null,grp=[],painted=false,first=null;
  const flush=()=>{
    if(cur&&!grp.length&&softC&&softC[0]&&!painted&&o.fill){x.save();x.clip(cur.p);pastel(x,cur.b,hexRgb(softC[0]),softC[1],'sand',0.6,null);x.restore();painted=true}
    if(!cur||!grp.length){grp=[];return}
    const big=grp.filter(L=>area(L[5])>area(cur.b)*0.55),src=big.length?big:grp;
    const light=tune(src[0][2],src[0][4]);
    const cnt={};src.slice(1).forEach(L=>cnt[L[2]]=(cnt[L[2]]||0)+L[3]);
    const dk=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
    const dark=dk?tune(dk,src[src.length-1][4]):light;
    let local=mix(light,dark,cfg.darkMix??0.62);
    if(far)local=mix(local,[0.78,0.84,0.88],0.2);
    const b=cur.b,w=b[2]-b[0],h=b[3]-b[1],size=Math.max(w,h);
    let A=(far?0.74:0.94)*(size>170?0.8:1)*(cfg.alphaK??1)*((cfg.washK||{})[kind]??1);
    if(softC){A*=softC[1];if(softC[0])local=hexRgb(softC[0])}
    const [,s,l]=rgb2hsl(local),white=white0||(l>0.84&&s<0.4);
    x.save();x.clip(cur.p);
    if(!white&&o.fill){
      pastel(x,b,local,A*0.62,'diag',0.75,null);
      // il centro più carico: resta chiaro l'orlo in alto a sinistra
      if(size>7&&!softC){x.save();const P=new Path2D();P.addPath(cur.p,new DOMMatrix().translate(Math.min(5,w*0.1),Math.min(5,h*0.1)));x.clip(P);pastel(x,b,local,A*0.6,'diag',0.5,null);x.restore()}
    }
    // l'ombra: la falce in basso a destra
    if(o.shade&&size>7&&size<190&&!softC){
      const dx=Math.min(9,Math.max(1.2,w*0.2)),dy=Math.min(9,Math.max(1.2,h*0.16));
      const P=new Path2D();P.rect(-20,-20,W+40,H+40);P.addPath(cur.p,new DOMMatrix().translate(-dx,-dy));
      x.save();x.clip(P,'evenodd');pastel(x,b,white?mix(dark,SHADOW,0.5):deeper(local),white?0.42:A*0.7,'diag',0.5,null);x.restore();
    }
    x.restore();grp=[];painted=true;
  };
  for(const L of layers){
    const t=L[0];
    if(t==='m'){flush();cur={p:insetP(L[1],L[2]),b:L[2]};if(!first)first=cur;painted=false;if(!softC){x.fillStyle=PAPER;x.fill(cur.p)}
      if(Math.max(L[2][2]-L[2][0],L[2][3]-L[2][1])>30){HOSTS.push(cur);if(HOSTS.length>14)HOSTS.shift()}}
    else if(t==='w'){
      if(dropW)continue;
      if(cur&&!painted&&inside(L[5],cur.b,3)){grp.push(L);continue}
      flush();
      if(!o.fill)continue;
      // le pareti e il pavimento dello studio: campitura dentro la velatura,
      // del suo colore (i crema restano crema, non diventano carta)
      if(!cur&&cfg.room&&cfg.room(kind)){const b=L[5],[,s,l]=rgb2hsl(hexRgb(L[2])),c=l>0.86?hexRgb(L[2]):tune(L[2],L[4]);
        const base=L[3]>=0.3,floor=kind==='pavimento'||kind==='prato-esteso';
        x.save();x.clip(P2(L[1]));pastel(x,b,c,base?Math.min(0.5,L[3]*0.8):L[3]*1.3,floor?'sand':'diag',base?0.75:0.3,null);x.restore();continue}
      if(isExt&&!(cfg.extFree||[]).includes(kind))continue;
      if((cfg.dropFree||[]).includes(kind))continue;
      if((cfg.path||[]).includes(kind)){if(L[4][0]!=='y')continue;const b=L[5],q=P2(L[1]);
        x.save();x.globalAlpha=0.3;x.fillStyle=PAPER;x.fill(q);x.globalAlpha=1;x.clip(q);
        pastel(x,b,hexRgb('#ddc68e'),0.3,'sand',0.3,null);x.restore();continue}
      const b=L[5],c=tune(L[2],L[4]);let a=Math.min(0.7,L[3]*2.4)*(far?0.8:1);
      if(kind==='finestra del faro'&&b[2]-b[0]>26)continue;        // l'alone largo della lanterna
      if(kind==='fumo'||kind==='vapore')a*=0.5;
      if(glow)a*=kind.startsWith('aurora')?0.3:0.5;
      a*=(cfg.washK||{})[kind]??1;
      let host=cur&&inside(b,cur.b,4)?cur:(first&&inside(b,first.b,4)?first:null);
      if(!host&&hosted)for(let i=HOSTS.length-1;i>=0;i--)if(inside(b,HOSTS[i].b,5)){host=HOSTS[i];break}
      if(host&&kind==='scogliera'&&L[4][0]!=='g')a*=0.45;
      const water=kind==='acqua'||kind.startsWith('fiume')||kind==='ruscello';
      if(!host&&(cfg.dropUnhosted||[]).includes(kind))continue;
      if(b[3]<70&&!cfg.keepTop)continue;
      if(!host&&first&&!glow&&!water&&L[3]<0.15)continue;               // macchiette uscite dalla forma                                           // sopra il bordo del foglio
      if(!host&&!glow&&!water&&b[2]-b[0]>55)continue;                 // le grandi macchie d'atmosfera
      x.save();if(host)x.clip(host.p);x.clip(P2(L[1]));
      pastel(x,b,water?mix(c,PAPERRGB,0.22):host||glow?c:mix(hexRgb(L[2]),SHADOW,0.3),water?a*0.8:host?a*0.6:a*0.8,water?'horiz':'diag',0.4,null);x.restore();
    }
    else if(t==='s'){flush();if(L.skip||!o.ink||o.pass==='fill')continue;
      x._len=L[3];x._far=far||u[3]<=0.7;x.globalAlpha=Math.min(1,L[2]*0.92);x.strokeStyle=inkPat(x,inkC);x.lineWidth=inkW;x.stroke(P2(L[1]));x.globalAlpha=1}
    else if(t==='f'){flush();const isInk=L[2].toLowerCase()==='#2e2a25';if(isInk&&!o.ink)continue;x._ink=isInk;x.fillStyle=isInk?css(inkC,L[3]):css(tune(L[2],''),L[3]);x.fill(P2(L[1]));x._ink=false}
    else if(t==='d'){flush();const isInk=L[4].toLowerCase()==='#2e2a25';if(isInk&&!o.ink)continue;x._ink=isInk;x.fillStyle=isInk?css(inkC,L[5]):css(tune(L[4],''),L[5]);x.beginPath();x.arc(L[1],L[2],L[3],0,7);x.fill();x._ink=false}
  }
  flush();
}
// ================= una unità, com'è ora (ricostruita con le regole dell'app) =================
function drawUnitOld(x,u){
  const ink=[52/255,44/255,37/255];
  for(const L of u[4]){
    const t=L[0];
    if(t==='m'){x.fillStyle=PAPER;x.fill(P2(L[1]))}
    else if(t==='w'){
      const b=L[5],size=Math.max(b[2]-b[0],b[3]-b[1]),f=L[4]?L[4][0]:'';
      const a=Math.min(0.9,Math.min(0.6,L[3]*3.8)*(f==='n'?0.45:f==='b'?0.62:1)*(size>220?0.75:1));
      x.save();x.clip(P2(L[1]));pastel(x,b,hexRgb(L[2]),a,'old',0,null);x.restore();
    }
    else if(t==='s'){x.strokeStyle=css(ink,0.82*L[2]);x.lineWidth=1.1;x.stroke(P2(L[1]))}
    else if(t==='f'){x.fillStyle=css(L[2].toLowerCase()==='#2e2a25'?ink:hexRgb(L[2]),L[3]);x.fill(P2(L[1]))}
    else if(t==='d'){x.fillStyle=css(L[4].toLowerCase()==='#2e2a25'?ink:hexRgb(L[4]),L[5]);x.beginPath();x.arc(L[1],L[2],L[3],0,7);x.fill()}
  }
}

// ================= la zona dell'obiettivo =================
// Dove l'app scrive l'obiettivo (zona protetta 24–366 × 306–476 nei JSON) il
// fondo si schiarisce come una foschia di carta, sfumata ai bordi: sotto
// gli sfondi più carichi il grigio del suggerimento e il testo digitato
// sparivano. Una passata sotto le figure e una, più leggera, sopra.
const VEIL={under:0.6,over:0.4};
let VEILC=null;
function veil(x,a,side){
  if(!VEILC){VEILC=mk(W*S,H*S);const v=VEILC.getContext('2d');v.scale(S,S);
    // una fascia su tutta la larghezza, sfumata sopra e sotto, con l'orlo mosso
    const g=v.createLinearGradient(0,286,0,500);
    [[0,0],[0.1,0.35],[0.24,0.88],[0.36,1],[0.7,1],[0.84,0.85],[0.94,0.3],[1,0]].forEach(([t,k])=>g.addColorStop(t,`rgba(248,245,238,${k})`));
    v.fillStyle=g;const top=q=>286+5*Math.sin(q/53+1)+3*Math.sin(q/19),bot=q=>500+5*Math.sin(q/61+2)+3*Math.sin(q/23);
    v.beginPath();for(let q=-4;q<=W+4;q+=3)q<0?v.moveTo(q,top(q)):v.lineTo(q,top(q));for(let q=W+4;q>=-4;q-=3)v.lineTo(q,bot(q));v.closePath();v.fill();
}
  x.save();x.globalAlpha=a;x.drawImage(side?veilSide():VEILC,0,0,W,H);x.restore();
}
// la passata sopra le figure resta dentro la larghezza della scritta, coi
// lati sfumati: a tutta larghezza schiariva l'edera e le figure ai margini
let VEILS=null;
function veilSide(){
  if(!VEILS){VEILS=mk(W*S,H*S);const v=VEILS.getContext('2d');v.drawImage(VEILC,0,0);v.scale(S,S);
    const g=v.createLinearGradient(0,0,W,0);[[0,0],[44/W,0],[74/W,1],[316/W,1],[350/W,0],[1,0]].forEach(([t,k])=>g.addColorStop(t,`rgba(0,0,0,${k})`));
    v.globalCompositeOperation='destination-in';v.fillStyle=g;v.fillRect(0,0,W,H)}
  return VEILS;
}

// ================= un foglio intero a un dato giorno =================
// mid = le unità fino a ieri, ma con gli sfondi di oggi (serve all'animazione)
const FR=new Map();
function frame(P,D,mid){
  const o=OPT,key=[P.id,STYLE,D,mid?1:0,o.fields,o.fill,o.shade,o.ink,P.cfg.studio?DECO+(STUDIO_TELA?1:0):''].join('|');
  let c=FR.get(key);if(c){FR.delete(key);FR.set(key,c);return c}
  c=mk(W*S,H*S);const x=c.getContext('2d');x.setTransform(S,0,0,S,0,0);x.lineCap='round';x.lineJoin='round';
  paper(x);
  const uD=mid?D-1:D,est=u=>/-estes[ao]$/.test(u[0]);
  if(STYLE==='ora'){
    if(D>=1)P.ext.filter(est).forEach(u=>drawUnitOld(x,u));
    P.units.forEach((u,i)=>{if(P.day[i]<=uD&&u[0]!=='sera')drawUnitOld(x,u)});
    if(D>=1)P.ext.filter(u=>!est(u)).forEach(u=>drawUnitOld(x,u));
  }else{
    if(o.fields)for(const f of P.cfg.fields)if(f.day<=D)f.draw(x,P);
    if(o.fields&&P.cfg.fields.some(f=>f.day<=D))veil(x,VEIL.under);
    HOSTS=[];
    // alcune parti vanno sotto un'altra (le zampe sotto la pancia)
    const und=P.cfg.under||{},idx=P.units.map((u,i)=>i);
    for(const [a,b] of Object.entries(und)){const ia=idx.findIndex(i=>P.units[i][0]===a),ib=idx.findIndex(i=>P.units[i][0]===b);
      if(ia>ib&&ib>=0){const [v]=idx.splice(ia,1);idx.splice(ib,0,v)}}
    idx.forEach(i=>{if(P.day[i]>uD)return;const k=P.units[i][0];
      if(P.cfg.studio&&!studioShows(k))return;
      drawUnit(x,P.units[i],P.cfg,false,o);
      // nello studio l'app disegna il cielo dopo la finestra e il quadro in corso sulla tela
      if(P.cfg.studio&&k==='finestra'){const r=P.spots.cielo,p=new Path2D();p.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);x.save();x.clip(p);x.fillStyle=PAPER;x.fill(p);
        pastel(x,r,hexRgb('#a3c6dd'),0.45,'diag',0.6,[[r[1],0.5],[r[3],0.2]]);x.restore()}
      if(P.cfg.studio&&k==='tela'&&STUDIO_TELA){const r=P.spots.tela;x.drawImage(STUDIO_TELA,r[0],r[1],r[2]-r[0],(r[2]-r[0])*800/390)}});
    if(D>=1)P.ext.forEach(u=>drawUnit(x,u,P.cfg,true,o));
    if(o.fields&&P.cfg.fields.some(f=>f.day<=D))veil(x,VEIL.over,true);
  }
  FR.set(key,c);if(FR.size>4)FR.delete(FR.keys().next().value);
  return c;
}
const LOADED={};
function load(id){
  if(LOADED[id])return LOADED[id];
  return LOADED[id]=new Promise((ok,no)=>{
    const s=document.createElement('script');s.src=BASE+'dati/'+id+'.js';
    s.onload=()=>{
      const d=DATI[id],cfg=CFG[id];cfg.bgSet=new Set(cfg.bg);
      // il secondo passaggio dello stesso contorno non si disegna
      for(const u of d.units.concat(d.ext)){let last=null;for(const L of u[4]){
        if(L[0]==='m')last=null;
        else if(L[0]==='s'){const m=/M\s*(-?[\d.]+)[ ,](-?[\d.]+)/.exec(L[1]),sp=m?[+m[1],+m[2]]:[0,0];if(last!==null&&L[3]>20&&Math.abs(last[0]-L[3])<Math.max(1.5,L[3]*0.03)&&Math.hypot(sp[0]-last[1][0],sp[1]-last[1][1])<5){L.skip=true;last=null}else last=[L[3],sp]}}}
      for(const f of cfg.fields){f.day=31;d.units.forEach((u,i)=>{if(f.kinds.includes(u[0]))f.day=Math.min(f.day,d.day[i])});if(f.day>30)f.day=1}
      ok({id,cfg,units:d.units,ext:d.ext,day:d.day,labels:d.labels,sun:d.sun,spots:d.spots});
    };
    s.onerror=no;document.head.append(s);
  });
}
function dayStrokes(P,D){
  const out=[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  P.units.forEach((u,i)=>{
    if(P.day[i]!==D||P.cfg.bgSet.has(u[0]))return;
    for(const L of u[4]){
      if(L[0]==='s'&&!L.skip)out.push({p:P2(L[1]),len:L[3]||24,o:L[2],w:inkWidth(u),c:inkColor(u)});
      const b=L[0]==='m'?L[2]:L[0]==='w'?L[5]:null;
      if(b){x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3])}
    }
  });
  let acc=0;for(const s of out){s.at=acc;acc+=s.len}
  return {list:out,total:acc,box:x1>x0?[x0-6,y0-6,x1+6,y1+6]:[0,0,W,H]};
}
function trace(st,upTo,pencil){
  X.setTransform(S,0,0,S,0,0);X.lineCap='round';X.lineJoin='round';
  for(const s of st.list){
    if(s.at>=upTo)break;
    const f=Math.min(1,(upTo-s.at)/s.len);
    X.setLineDash(f<1?[s.len*f,s.len*3+50]:[]);
    if(pencil){
      X.lineWidth=0.9;X.strokeStyle='rgba(128,122,114,0.5)';X.stroke(s.p);
      X.save();X.translate(0.33,0.33);X.strokeStyle='rgba(128,122,114,0.32)';X.stroke(s.p);X.restore();
    }else{X.globalAlpha=Math.min(1,s.o*0.92);X.strokeStyle=inkPat(X,s.c);X.lineWidth=s.w;X.stroke(s.p);X.globalAlpha=1}
  }
  X.setLineDash([]);
}
// svela un foglio sopra quello che c'è, con un fronte in diagonale dentro box
function wipe(c,box,f){
  if(f<=0)return;
  X.setTransform(S,0,0,S,0,0);X.save();
  const [a,b,cc,d]=box,w=cc-a,h=d-b,r=f*(w+h*0.7)*1.02;
  X.beginPath();X.rect(a,b,w,h);X.clip();
  X.beginPath();X.moveTo(a-2,b-2);X.lineTo(a+r,b-2);X.lineTo(a+r-h*0.7-2,d+2);X.lineTo(a-2,d+2);X.closePath();X.clip();
  X.drawImage(c,0,0,W,H);X.restore();
}
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
function playDay(D,speed,fixed){
  return new Promise(done=>{
    const my=++RUN,P=CUR;if(D<1){done(true);return}
    const prev=frame(P,D-1),mid=frame(P,D,true),full=frame(P,D);
    const newField=STYLE==='nuovo'&&OPT.fields&&P.cfg.fields.some(f=>f.day===D);
    const st=dayStrokes(P,D);
    const k=1/speed,tF=newField?1100*k:0,tP=Math.max(500,Math.min(2600,st.total*1.1))*k,tI=tP*0.8,tC=1100*k,hold=250*k;
    const t0=performance.now();
    (function tick(now){
      if(my!==RUN){done(false);return}
      const t=fixed!=null?fixed:now-t0;
      show(newField?prev:mid);
      if(newField)wipe(mid,[0,0,W,H],ease(t/tF));
      const a=t-tF,b=a-tP-hold,c=b-tI-hold;
      if(c>0){trace(st,st.total,false);wipe(full,st.box,ease(c/tC))}
      else if(b>0){trace(st,st.total,true);trace(st,st.total*Math.min(1,b/tI),false)}
      else if(a>0)trace(st,st.total*Math.min(1,a/tP),true);
      if(c>=tC){show(full);done(true);return}
      if(fixed!=null){done(true);return}
      requestAnimationFrame(tick);
    })(t0);
  });
}
let READY=false;
window.Pastello={
  W,H,S,
  init(){if(!READY){buildTex();READY=true}},
  load,
  attach(canvas){canvas.width=W*S;canvas.height=H*S;X=canvas.getContext('2d')},
  use(P){CUR=P},
  draw(P,D){CUR=P;show(frame(P,D))},
  play(D,speed){return playDay(D,speed||1)},
  stop(){RUN++}
};
})();
