// Trireka Presisi: interaksi halaman utama
// Koordinat kursor di gambar hero, dalam mm (skala 1:2, 1 unit SVG ≈ 0,556 mm)
(function(){
  var svg=document.getElementById('part'),out=document.getElementById('coord');
  if(!svg||!out)return;
  svg.addEventListener('pointermove',function(e){
    var r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)/r.width*520,vy=(e.clientY-r.top)/r.height*380;
    var k=120/216,x=(vx-165)*k,y=(190-vy)*k;
    out.textContent='X '+x.toFixed(1)+' · Y '+y.toFixed(1);
  });
  svg.addEventListener('pointerleave',function(){out.textContent='X — · Y —'});
})();

// Filter portofolio
document.querySelectorAll('.chip').forEach(function(c){
  c.addEventListener('click',function(){
    var f=c.dataset.f;
    document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});
    document.querySelectorAll('#works .work').forEach(function(w){w.hidden=!(f==='semua'||w.dataset.cat===f)});
  });
});

// Salin kontak
document.querySelectorAll('.copy[data-copy]').forEach(function(b){
  b.addEventListener('click',function(){
    var el=document.getElementById(b.dataset.copy),t=el.textContent;
    var done=function(){b.textContent='Tersalin';setTimeout(function(){b.textContent='Salin'},1500)};
    var sel=function(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r)};
    try{navigator.clipboard.writeText(t).then(done,sel)}catch(e){sel()}
  });
});

// Unggah file
(function(){
  var drop=document.getElementById('drop'),inp=document.getElementById('file'),list=document.getElementById('fileList');
  if(!drop||!inp)return;
  function show(files){list.textContent=Array.prototype.map.call(files,function(f){return f.name+' ('+Math.max(1,Math.round(f.size/1024))+' KB)'}).join(' · ')}
  drop.addEventListener('click',function(){inp.click()});
  drop.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click()}});
  inp.addEventListener('change',function(){show(inp.files)});
  drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('over')});
  drop.addEventListener('dragleave',function(){drop.classList.remove('over')});
  drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('over');try{inp.files=e.dataTransfer.files}catch(x){}show(inp.files)});
})();


// Tiga animasi: FEM, motion, assembly: mesh sederhana, proyeksi ortografis, painter's algorithm
(function(){
  var cv=document.getElementById('cyl3d'),pl=document.getElementById('cylPlot');
  if(!cv||!pl||!cv.getContext)return;
  var ctx=cv.getContext('2d'),pctx=pl.getContext('2d');
  var btn=document.getElementById('simToggle'),rS=document.getElementById('rStroke'),rV=document.getElementById('rVel'),rT=document.getElementById('rTime');
  var T=4,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing=!reduced,visible=true,t=reduced?T/2:0,last=null,hist=[];
  var col={};
  function hex(v){v=v.trim();if(v[0]!=='#')return[128,128,128];if(v.length===4)v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];return[1,3,5].map(function(i){return parseInt(v.substr(i,2),16)})}
  function readColors(){var s=getComputedStyle(document.documentElement);['sheet','paper','ink','accent','line','dim','ink-2'].forEach(function(k){col[k]=hex(s.getPropertyValue('--'+k))})}
  function mixA(a,b,k){return a.map(function(v,i){return v+(b[i]-v)*k})}
  function rgb(c){return'rgb('+c.map(Math.round).join(',')+')'}
  function rgba(c,a){return'rgba('+c.map(Math.round).join(',')+','+a+')'}
  function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function norm(v){var l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
  function cyl(axis,c,r,len,tone,seg){
    seg=seg||28;var faces=[],a=[],b=[];
    for(var i=0;i<seg;i++){var th=i/seg*Math.PI*2,u=Math.cos(th)*r,v=Math.sin(th)*r;
      if(axis==='x'){a.push([c[0],c[1]+u,c[2]+v]);b.push([c[0]+len,c[1]+u,c[2]+v])}
      else{a.push([c[0]+u,c[1]+v,c[2]]);b.push([c[0]+u,c[1]+v,c[2]+len])}}
    for(i=0;i<seg;i++){var j=(i+1)%seg,th2=(i+.5)/seg*Math.PI*2,n=axis==='x'?[0,Math.cos(th2),Math.sin(th2)]:[Math.cos(th2),Math.sin(th2),0];
      faces.push({p:[a[i],a[j],b[j],b[i]],n:n,tone:tone,side:1})}
    var ax=axis==='x'?[1,0,0]:[0,0,1];
    faces.push({p:a.slice().reverse(),n:ax.map(function(v){return-v}),tone:tone});
    faces.push({p:b,n:ax,tone:tone});
    return faces;
  }
  // poligon dengan normal dihitung, diarahkan keluar dari titik pusat benda
  function face(pts,center,extra){var n=norm(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])));
    var fc=[0,0,0];pts.forEach(function(p){fc[0]+=p[0]/pts.length;fc[1]+=p[1]/pts.length;fc[2]+=p[2]/pts.length});
    var o=sub(fc,center);if(n[0]*o[0]+n[1]*o[1]+n[2]*o[2]<0)n=n.map(function(v){return-v});
    var f={p:pts,n:n};for(var k in extra)f[k]=extra[k];return f}
  var yaw=-0.55,pitch=0.42;
  function rot(p){var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    var x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,y=p[1];
    return[x,y*cp-z*sp,y*sp+z*cp]}
  var L=norm([-.35,.55,.76]);
  function size(c){var r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);return d}
  var d1=1,d2=1;function resize(){d1=size(cv);d2=size(pl)}
  function axisLine(cx,cy,s,a,b){ctx.save();ctx.setLineDash([14*d1,4*d1,3*d1,4*d1]);ctx.strokeStyle=rgba(col.dim,.8);ctx.lineWidth=d1;
    var p1=rot(a),p2=rot(b);ctx.beginPath();ctx.moveTo(cx+p1[0]*s,cy-p1[1]*s);ctx.lineTo(cx+p2[0]*s,cy-p2[1]*s);ctx.stroke();ctx.restore()}
  function paint(faces,cx,cy,s,style){
    var list=[];
    faces.forEach(function(f){var n=rot(f.n);if(n[2]<=0)return;
      var pts=f.p.map(rot),z=0;pts.forEach(function(p){z+=p[2]});
      list.push({f:f,pts:pts,z:z/pts.length,lam:Math.max(0,n[0]*L[0]+n[1]*L[1]+n[2]*L[2])})});
    list.sort(function(a,b){return a.z-b.z});
    ctx.lineJoin='round';
    list.forEach(function(it){ctx.beginPath();it.pts.forEach(function(p,i){var X=cx+p[0]*s,Y=cy-p[1]*s;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.closePath();style(it)});
  }
  function drawPlot(ymax,unit){
    var W=pl.width,H=pl.height,pad=8*d2,top=10*d2,bot=18*d2;
    pctx.clearRect(0,0,W,H);
    pctx.font=(10*d2)+'px '+getComputedStyle(document.documentElement).getPropertyValue('--f-mono');pctx.fillStyle=rgba(col['ink-2'],1);
    pctx.strokeStyle=rgba(col.line,1);pctx.lineWidth=d2;
    var x0=44*d2,x1=W-pad,y=function(v){return top+(1-v/ymax)*(H-top-bot)};
    [0,ymax/2,ymax].forEach(function(v){pctx.beginPath();pctx.moveTo(x0,y(v));pctx.lineTo(x1,y(v));pctx.stroke();pctx.textAlign='right';pctx.fillText(String(+v.toFixed(2)).replace('.',','),x0-6*d2,y(v)+3*d2)});
    pctx.textAlign='left';pctx.fillText(unit,x0+4*d2,H-4*d2);pctx.textAlign='right';pctx.fillText('6 s terakhir',x1,H-4*d2);
    if(hist.length<2)return;
    var tn=hist[hist.length-1][0],span=6,xs=function(tt){return x1-(tn-tt)/span*(x1-x0)};
    pctx.beginPath();hist.forEach(function(h,i){var X=xs(h[0]),Y=y(h[1]);i?pctx.lineTo(X,Y):pctx.moveTo(X,Y)});
    pctx.strokeStyle=rgba(col.accent,1);pctx.lineWidth=1.6*d2;pctx.stroke();
    var lp=hist[hist.length-1];pctx.beginPath();pctx.arc(xs(lp[0]),y(lp[1]),3*d2,0,7);pctx.fillStyle=rgba(col.accent,1);pctx.fill();
  }
  var SC={};
  SC.fem=(function(){
  // Balok kantilever 30×40×300 mm, baja (E 200 GPa), beban ujung 0–1500 N. Defleksi diperbesar 150×.
  var YAW0=-0.5,PLOTMAX=0.5,PLOTUNIT='mm';
  var LEN=300,Bw=30,Hh=40,E=200000,I=Bw*Hh*Hh*Hh/12,FMAX=1500,EXAG=150,N=24;
  function load(tt){return FMAX*(1-Math.cos(2*Math.PI*tt/T))/2}
  function tip(F){return F*LEN*LEN*LEN/(3*E*I)}
  function plotVal(tt){return tip(load(tt))}
  var CM=[[43,108,255],[34,195,230],[60,207,106],[245,210,46],[232,69,44]];
  function cmap(v){v=Math.max(0,Math.min(1,v))*(CM.length-1);var i=Math.min(CM.length-2,Math.floor(v));return mixA(CM[i],CM[i+1],v-i)}
  function drawScene(W,H){
    var s=Math.min(W/420,H/260),cx=W/2+0*s,cy=H/2-10*s,F=load(t),d=tip(F)*EXAG,frac=F/FMAX;
    function yo(x){var r=x/LEN;return -d*r*r*(3-r)/2}
    var x0=-LEN/2,faces=[];
    for(var i=0;i<N;i++){
      var a=i/N*LEN,b=(i+1)/N*LEN,ya=yo(a),yb=yo(b),X0=x0+a,X1=x0+b,h=Hh/2,w=Bw/2;
      var c=[(X0+X1)/2,(ya+yb)/2,0],st=(1-(a+b)/2/LEN)*frac;
      var p={A:[X0,ya+h,w],B:[X1,yb+h,w],C:[X1,yb-h,w],D:[X0,ya-h,w],A2:[X0,ya+h,-w],B2:[X1,yb+h,-w],C2:[X1,yb-h,-w],D2:[X0,ya-h,-w]};
      [[p.A,p.B,p.C,p.D],[p.A2,p.B2,p.C2,p.D2],[p.A,p.B,p.B2,p.A2],[p.D,p.C,p.C2,p.D2]].forEach(function(q){faces.push(face(q,c,{st:st}))});
      if(i===N-1)faces.push(face([p.B,p.C,p.C2,p.B2],c,{st:st}));
      if(i===0)faces.push(face([p.A,p.D,p.D2,p.A2],c,{st:st}));
    }
    // tumpuan jepit
    var sw=[x0-14,0,0],S={a:[x0-14,60,40],b:[x0,60,40],c:[x0,-60,40],d:[x0-14,-60,40],a2:[x0-14,60,-40],b2:[x0,60,-40],c2:[x0,-60,-40],d2:[x0-14,-60,-40]};
    [[S.a,S.b,S.c,S.d],[S.a2,S.b2,S.c2,S.d2],[S.a,S.b,S.b2,S.a2],[S.d,S.c,S.c2,S.d2],[S.a,S.d,S.d2,S.a2],[S.b,S.c,S.c2,S.b2]].forEach(function(q){faces.push(face(q,sw,{wall:1}))});
    axisLine(cx,cy,s,[x0-30,0,0],[x0+LEN+40,0,0]);
    paint(faces,cx,cy,s,function(it){
      if(it.f.wall){ctx.fillStyle=rgb(mixA(col.sheet,col.ink,.15+.45*(1-it.lam)));ctx.fill();ctx.strokeStyle=rgba(col.ink,.5);ctx.lineWidth=d1;ctx.stroke();return}
      var base=cmap(it.f.st);ctx.fillStyle=rgb(mixA(base,[0,0,0],.35*(1-it.lam)));ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.6*d1;ctx.stroke();
    });
    // panah beban di ujung
    var tp=rot([x0+LEN,yo(LEN)+Hh/2,0]),X=cx+tp[0]*s,Y=cy-tp[1]*s,len=(26+40*frac)*s;
    ctx.strokeStyle=rgba(col.accent,1);ctx.fillStyle=rgba(col.accent,1);ctx.lineWidth=2*d1;
    ctx.beginPath();ctx.moveTo(X,Y-len-4*d1);ctx.lineTo(X,Y-4*d1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(X,Y-1*d1);ctx.lineTo(X-5*d1,Y-11*d1);ctx.lineTo(X+5*d1,Y-11*d1);ctx.closePath();ctx.fill();
    ctx.font=(11*d1)+'px '+getComputedStyle(document.documentElement).getPropertyValue('--f-mono');ctx.textAlign='left';
    ctx.fillText('F = '+Math.round(F)+' N',X+8*d1,Y-len+6*d1);
    // legenda tegangan
    var lx=14*d1,ly=H-22*d1,lw=Math.min(160*d1,W*.4);
    for(var k=0;k<lw;k++){ctx.fillStyle=rgb(cmap(k/lw));ctx.fillRect(lx+k,ly,1,7*d1)}
    ctx.fillStyle=rgba(col['ink-2'],1);ctx.font=(10*d1)+'px '+getComputedStyle(document.documentElement).getPropertyValue('--f-mono');
    ctx.textAlign='left';ctx.fillText('0',lx,ly+18*d1);ctx.textAlign='right';ctx.fillText('56 MPa',lx+lw,ly+18*d1);
    ctx.textAlign='right';ctx.fillText('defleksi ×'+EXAG,W-14*d1,H-10*d1);
  }
  function readout(tt){var F=load(tt);
    rS.textContent=Math.round(F)+' N';
    rV.textContent=tip(F).toFixed(2).replace('.',',')+' mm';
    rT.textContent=(F*LEN*(Hh/2)/I).toFixed(1).replace('.',',')+' MPa';
  }

    return {YAW0:YAW0,PLOTMAX:PLOTMAX,PLOTUNIT:PLOTUNIT,plotVal:plotVal,drawScene:drawScene,readout:readout};
  })();
  SC.motion=(function(){
  // Silinder pneumatik Ø63 × 100: batang piston maju-mundur
  var YAW0=-0.55,PLOTMAX=100,PLOTUNIT='mm',STROKE=100;
  function ext(tt){return STROKE*(1-Math.cos(2*Math.PI*tt/T))/2}
  function vel(tt){return STROKE*Math.PI/T*Math.sin(2*Math.PI*tt/T)}
  function plotVal(tt){return ext(tt)}
  function scene(e){
    var f=[];
    f=f.concat(cyl('z',[-150,0,-9],13,18,0));
    f=f.concat(cyl('x',[-140,0,0],36,14,0));
    f=f.concat(cyl('x',[-126,0,0],31,166,0,36));
    f=f.concat(cyl('x',[40,0,0],36,14,0));
    f=f.concat(cyl('x',[54,0,0],10,20+e,1));
    f=f.concat(cyl('x',[74+e,0,0],15,22,1));
    f=f.concat(cyl('z',[104+e,0,-9],11,18,1));
    return f;
  }
  function drawScene(W,H){
    var s=Math.min(W/400,H/250),cx=W/2-20*s,cy=H/2+8*s,e=ext(t);
    axisLine(cx,cy,s,[-185,0,0],[235,0,0]);
    paint(scene(e),cx,cy,s,function(it){
      ctx.fillStyle=it.f.tone?rgb(mixA(col.sheet,col.accent,.35+.55*(1-it.lam))):rgb(mixA(col.sheet,col.ink,.12+.6*(1-it.lam)));ctx.fill();
      ctx.strokeStyle=it.f.side?rgba(it.f.tone?col.accent:col.ink,.18):rgba(col.ink,.55);ctx.lineWidth=(it.f.side?.6:1)*d1;ctx.stroke();
    });
    var a=rot([54,48,0]),b=rot([54+e,48,0]);
    if(e>4){ctx.strokeStyle=rgba(col.accent,1);ctx.lineWidth=d1;ctx.beginPath();ctx.moveTo(cx+a[0]*s,cy-a[1]*s);ctx.lineTo(cx+b[0]*s,cy-b[1]*s);ctx.stroke();
      [a,b].forEach(function(q){ctx.beginPath();ctx.arc(cx+q[0]*s,cy-q[1]*s,2.2*d1,0,7);ctx.fillStyle=rgba(col.accent,1);ctx.fill()});
      ctx.font=(11*d1)+'px '+getComputedStyle(document.documentElement).getPropertyValue('--f-mono');ctx.textAlign='center';
      ctx.fillText(e.toFixed(0),cx+(a[0]+b[0])/2*s,cy-(a[1]+b[1])/2*s-7*d1)}
  }
  function readout(tt){
    rS.textContent=ext(tt).toFixed(1).replace('.',',')+' mm';
    rV.textContent=Math.round(vel(tt))+' mm/s';
    rT.textContent=(tt%T).toFixed(2).replace('.',',')+' s';
  }

    return {YAW0:YAW0,PLOTMAX:PLOTMAX,PLOTUNIT:PLOTUNIT,plotVal:plotVal,drawScene:drawScene,readout:readout};
  })();
  SC.asm=(function(){
  // Exploded view: poros bergerak ke kiri, baut ke kanan, flens tetap
  var YAW0=-0.75,PLOTMAX=60,PLOTUNIT='mm';
  function off(tt){return 60*(1-Math.cos(2*Math.PI*tt/T))/2}
  function plotVal(tt){return off(tt)}
  function scene(e){
    var f=[];
    f=f.concat(cyl('x',[-170-e,0,0],12,260,1,20));      // poros
    f=f.concat(cyl('x',[-20,0,0],60,14,0,40));          // pelat flens
    f=f.concat(cyl('x',[-6,0,0],30,34,0,32));           // hub
    var R=45/Math.SQRT2;
    [[R,R],[R,-R],[-R,R],[-R,-R]].forEach(function(q){
      f=f.concat(cyl('x',[-34+1.6*e,q[0],q[1]],5,40,2,12));   // batang baut
      f=f.concat(cyl('x',[6+1.6*e,q[0],q[1]],9,7,2,6));       // kepala baut (hex)
    });
    return f;
  }
  function drawScene(W,H){
    var s=Math.min(W/430,H/270),cx=W/2+10*s,cy=H/2+4*s,e=off(t);
    axisLine(cx,cy,s,[-240,0,0],[220,0,0]);
    paint(scene(e),cx,cy,s,function(it){
      ctx.fillStyle=rgb(mixA(col.sheet,col.paper,it.lam*.6));ctx.fill();
      var c=it.f.tone===1?col.dim:it.f.tone===2?col.accent:col.ink;
      ctx.strokeStyle=rgba(c,it.f.side?.28:.95);ctx.lineWidth=(it.f.side?.7:1.2)*d1;ctx.stroke();
    });
  }
  function readout(tt){var e=off(tt);
    rS.textContent=e.toFixed(1).replace('.',',')+' mm';
    rV.textContent='10 komponen';
    rT.textContent=(e>30?'Terurai':'Terakit');
  }

    return {YAW0:YAW0,PLOTMAX:PLOTMAX,PLOTUNIT:PLOTUNIT,plotVal:plotVal,drawScene:drawScene,readout:readout};
  })();
  var cur=SC.fem,YAW0=cur.YAW0;
  function plotVal(tt){return cur.plotVal(tt)}
  function drawScene(W,H){cur.drawScene(W,H)}
  function readout(tt){cur.readout(tt)}

  function render(){
    var W=cv.width,H=cv.height;ctx.clearRect(0,0,W,H);
    drawScene(W,H);
    hist.push([t,plotVal(t)]);while(hist.length&&t-hist[0][0]>6.2)hist.shift();
    drawPlot(cur.PLOTMAX,cur.PLOTUNIT);
    readout(t);
  }
  function frame(now){
    if(last!==null&&playing&&visible){t+=Math.min(.05,(now-last)/1000);yaw=cur.YAW0+Math.sin(t*.35)*.25;render()}
    last=now;requestAnimationFrame(frame);
  }
  var txtPause=btn.dataset.pause||'Jeda',txtPlay=btn.dataset.play||'Putar';
  btn.textContent=playing?txtPause:txtPlay;btn.setAttribute('aria-pressed',String(!playing));
  btn.addEventListener('click',function(){playing=!playing;btn.textContent=playing?txtPause:txtPlay;btn.setAttribute('aria-pressed',String(!playing))});
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting}).observe(cv);
  var mq=matchMedia('(prefers-color-scheme: dark)');
  function recolor(){readColors();render()}
  (mq.addEventListener?mq.addEventListener('change',recolor):mq.addListener(recolor));
  new MutationObserver(recolor).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('resize',function(){resize();render()});
  // Teks tiap tab (judul, label, keterangan) datang dari panel admin lewat atribut data-* pada tombol tab
  var META={};
  [].forEach.call(document.querySelectorAll('.sim-tabs [role=tab]'),function(b){
    META[b.dataset.sim]={id:b.dataset.id||'',lab:[b.dataset.l1||'',b.dataset.l2||'',b.dataset.l3||''],cap:b.dataset.cap||''};
  });
  var tabs=[].slice.call(document.querySelectorAll('.sim-tabs [role=tab]'));
  function select(key,focus){
    cur=SC[key];var m=META[key];
    tabs.forEach(function(b){var on=b.dataset.sim===key;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
    document.getElementById('simId').textContent=m.id;document.getElementById('simCap').textContent=m.cap;
    ['l1','l2','l3'].forEach(function(id,i){document.getElementById(id).textContent=m.lab[i]});
    yaw=cur.YAW0;hist=[];for(var k=-6;k<=0;k+=.05){hist.push([t+k,plotVal(t+k)])}
    render();
  }
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){select(b.dataset.sim)});
    b.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();select(tabs[(i+d+tabs.length)%tabs.length].dataset.sim,true)}});
  });
  readColors();resize();
  select(tabs.length?tabs[0].dataset.sim:'fem');
  requestAnimationFrame(frame);
})();


// Kirim formulir RFQ ke server, lalu tawarkan lanjut lewat WhatsApp
(function(){
  var form=document.getElementById('rfqForm');
  if(!form||!window.fetch||!window.FormData)return;
  var msg=document.getElementById('formMsg'),btn=form.querySelector('button[type=submit]'),wa=document.getElementById('rfqWa');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.nama.value.trim()||!form.wa.value.trim()||!form.deskripsi.value.trim()){
      msg.dataset.state='err';msg.textContent='Nama, No. WhatsApp, dan deskripsi wajib diisi.';return;
    }
    var max=+form.dataset.maxMb||25,size=0;
    [].forEach.call(form.querySelector('#file').files||[],function(f){size+=f.size});
    if(size>max*1048576){msg.dataset.state='err';msg.textContent='Total lampiran melebihi '+max+' MB.';return}
    btn.disabled=true;msg.dataset.state='';msg.textContent='Mengirim…';
    fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}})
      .then(function(r){return r.json().catch(function(){return{ok:false,error:'Server tidak merespons dengan benar.'}})})
      .then(function(j){
        btn.disabled=false;
        if(!j.ok){msg.dataset.state='err';msg.textContent=j.error||'Gagal mengirim. Coba lagi atau hubungi via WhatsApp.';return}
        msg.dataset.state='ok';msg.textContent=j.message||'Terima kasih, permintaan Anda sudah kami terima.';
        if(wa&&j.wa){wa.href=j.wa;wa.hidden=false}
        form.reset();var fl=document.getElementById('fileList');if(fl)fl.textContent='';
      })
      .catch(function(){btn.disabled=false;msg.dataset.state='err';msg.textContent='Koneksi gagal. Coba lagi atau hubungi via WhatsApp.'});
  });
})();
