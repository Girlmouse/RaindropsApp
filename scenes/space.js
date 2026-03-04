/**
 * scenes/space.js
 * Raindrops — Space Scene
 * Closely follows original space.html — own loop, own sizing, own input.
 */

SceneManager.register('space', {

  tracks: [{ id: 'space', src: 'audio/space.mp3', volume: 0.20 }],

  _cv: null, _c: null,
  _running: false, _raf: null,
  _fadeIn: 0,
  _stars: null,
  _craters: null, _moonRocks: null, _moonPebbles: null, _moonDust: null, _moonCracks: null,
  _shooters: [], _ripples: [],
  _nextShoot: 0,
  _tapHandler: null, _resizeHandler: null,

  _getSize() {
    const W = window.innerWidth, H = window.innerHeight || document.documentElement.clientHeight;
    const IS_MOB = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (IS_MOB) return { w: Math.floor(W), h: Math.floor(H) };
    const mw = Math.min(W * 0.98, 800), mh = H * 0.92;
    let w = mw, h = mw * (4 / 3);
    if (h > mh) { h = mh; w = h * (3 / 4); }
    return { w: Math.floor(w), h: Math.floor(h) };
  },

  _resize() {
    if (!this._cv) return;
    const { w, h } = this._getSize();
    this._cv.width  = w * 2; this._cv.height = h * 2;
    this._cv.style.width  = w + 'px'; this._cv.style.height = h + 'px';
    this._c.setTransform(2, 0, 0, 2, 0, 0);
    this._craters     = this._buildCraters(w, h);
    this._moonRocks   = this._buildRocks(w, h);
    this._moonPebbles = this._buildPebbles(w, h);
    this._moonDust    = this._buildDust(w, h);
    this._moonCracks  = this._buildCracks(w, h);
    this._stars = null;
  },

  _getPos(e) {
    const cv = this._cv, r = cv.getBoundingClientRect();
    const sx = (cv.width / 2) / r.width, sy = (cv.height / 2) / r.height;
    const px = e.touches ? e.touches[0].clientX : e.clientX;
    const py = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (px - r.left) * sx, y: (py - r.top) * sy };
  },

  _getHomeBtnRect(cw, ch) {
    this._c.save();
    this._c.font = "600 15px 'Helvetica Neue',sans-serif";
    const tw = this._c.measureText('⌂ home').width;
    this._c.restore();
    const pad = 10;
    return { x: cw - 14 - tw - pad, y: ch - 14 - 20, w: tw + pad * 2, h: 28 };
  },

  _buildStars(w, h) {
    const s = [];
    for (let i=0;i<130;i++) s.push({x:Math.random()*w,y:Math.random()*h*0.78,size:0.25+Math.random()*0.45,baseAlpha:0.06+Math.random()*0.16,twinkleSpeed:0.00008+Math.random()*0.00025,twinklePhase:Math.random()*Math.PI*2,warm:false});
    for (let i=0;i<50;i++)  s.push({x:Math.random()*w,y:Math.random()*h*0.78,size:0.55+Math.random()*0.9, baseAlpha:0.18+Math.random()*0.28,twinkleSpeed:0.00005+Math.random()*0.00015,twinklePhase:Math.random()*Math.PI*2,warm:Math.random()>0.88});
    for (let i=0;i<10;i++)  s.push({x:Math.random()*w,y:Math.random()*h*0.78,size:1.3+Math.random()*1.0, baseAlpha:0.5+Math.random()*0.3,  twinkleSpeed:0.00003+Math.random()*0.0001, twinklePhase:Math.random()*Math.PI*2,warm:Math.random()>0.65});
    return s;
  },

  _buildCraters(w, h) {
    const a=[];
    for(let i=0;i<5; i++) a.push({x:Math.random()*w,y:h*0.79+Math.random()*h*0.18,r:12+Math.random()*22,depth:0.55+Math.random()*0.3, large:true});
    for(let i=0;i<18;i++) a.push({x:Math.random()*w,y:h*0.78+Math.random()*h*0.2, r:2+Math.random()*9,  depth:0.4+Math.random()*0.35, large:false});
    return a;
  },

  _buildRocks(w, h) {
    const a=[];
    for(let i=0;i<14;i++) a.push({x:Math.random()*w,y:h*0.775+Math.random()*h*0.04,rw:3+Math.random()*10,rh:2+Math.random()*6,angle:(Math.random()-0.5)*0.4});
    return a;
  },

  _buildPebbles(w, h) {
    const a=[],sY=h*0.78;
    for(let i=0;i<220;i++){
      const d=Math.pow(Math.random(),1.8),sw=1.5+Math.random()*5,shade=90+Math.random()*60|0;
      a.push({x:Math.random()*w,y:sY+h*0.04+d*(h-sY)*0.55,sw,sh:sw*(0.12+Math.random()*0.18),angle:(Math.random()-0.5)*Math.PI,shade,alpha:(0.18+Math.random()*0.28)*(1-d*0.6)});
    }
    return a;
  },

  _buildDust(w, h) {
    const a=[],sY=h*0.78;
    for(let i=0;i<400;i++){
      const ny=sY+Math.random()*(h-sY),bright=Math.random()>0.55,sz=Math.random()<0.85?1:Math.random()<0.7?2:3;
      a.push({x:Math.random()*w,y:ny,sz,bright,alpha:(bright?0.06:0.07)*(1-((ny-sY)/(h-sY))*0.5)});
    }
    return a;
  },

  _buildCracks(w, h) {
    const sY=h*0.78;
    return [{sx:w*0.12,sy:sY+h*0.04,len:6,dir:0.3},{sx:w*0.35,sy:sY+h*0.06,len:8,dir:-0.5},
            {sx:w*0.55,sy:sY+h*0.03,len:5,dir:0.6},{sx:w*0.72,sy:sY+h*0.07,len:7,dir:-0.2},
            {sx:w*0.88,sy:sY+h*0.05,len:6,dir:0.4},{sx:w*0.24,sy:sY+h*0.12,len:5,dir:-0.7},
            {sx:w*0.63,sy:sY+h*0.14,len:4,dir:0.5}].map(ck=>{
      const pts=[[ck.sx,ck.sy]],branches=[];
      let cx=ck.sx,cy=ck.sy,angle=ck.dir;
      for(let seg=0;seg<ck.len;seg++){
        angle+=(Math.random()-0.5)*0.8;
        const sl=6+Math.random()*10; cx+=Math.cos(angle)*sl; cy+=Math.sin(angle)*sl*0.4; pts.push([cx,cy]);
        if(Math.random()<0.35&&seg>1){const ba=angle+(Math.random()>0.5?0.6:-0.6),bl=sl*(0.4+Math.random()*0.4);branches.push([[cx,cy],[cx+Math.cos(ba)*bl,cy+Math.sin(ba)*bl*0.4]]);}
      }
      return {pts,branches};
    });
  },

  _spawnShooter(w, h) {
    const sx=Math.random()*w*0.8,sy=Math.random()*h*0.4,angle=0.3+Math.random()*0.6,speed=0.5+Math.random()*0.7;
    this._shooters.push({x:sx,y:sy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,length:20+Math.random()*30,caught:false,fadeOut:1,trail:[]});
  },

  _drawMoon(cw, ch) {
    const c=this._c, sY=ch*0.78;
    c.save();
    c.beginPath();c.moveTo(0,ch);c.lineTo(0,sY+8);c.quadraticCurveTo(cw*0.25,sY-5,cw*0.5,sY);c.quadraticCurveTo(cw*0.75,sY+5,cw,sY-2);c.lineTo(cw,ch);c.closePath();
    c.fillStyle='rgba(12,12,16,1)';c.fill();
    const sg=c.createLinearGradient(0,sY-8,0,ch);
    sg.addColorStop(0,'rgba(105,108,122,1)');sg.addColorStop(0.06,'rgba(88,91,104,1)');sg.addColorStop(0.18,'rgba(70,73,84,1)');
    sg.addColorStop(0.35,'rgba(52,55,65,1)');sg.addColorStop(0.55,'rgba(36,38,46,1)');sg.addColorStop(0.75,'rgba(20,22,28,1)');sg.addColorStop(1,'rgba(8,9,12,1)');
    c.fillStyle=sg;c.beginPath();c.moveTo(0,ch);c.lineTo(0,sY+8);c.quadraticCurveTo(cw*0.25,sY-5,cw*0.5,sY);c.quadraticCurveTo(cw*0.75,sY+5,cw,sY-2);c.lineTo(cw,ch);c.closePath();c.fill();
    c.save();
    if(this._moonDust)this._moonDust.forEach(d=>{c.globalAlpha=d.alpha;c.fillStyle=d.bright?'rgba(200,205,215,1)':'rgba(8,8,12,1)';c.fillRect(d.x,d.y,d.sz,d.sz);});
    if(this._moonPebbles)this._moonPebbles.forEach(p=>{c.globalAlpha=p.alpha;c.fillStyle=`rgba(${p.shade},${p.shade+2},${p.shade+10},1)`;c.beginPath();c.ellipse(p.x,p.y,p.sw,p.sh,p.angle,0,Math.PI*2);c.fill();});
    c.globalAlpha=1;
    if(this._moonCracks)this._moonCracks.forEach(ck=>{
      c.save();c.strokeStyle='rgba(14,15,20,0.55)';c.lineWidth=0.6;
      c.beginPath();c.moveTo(ck.pts[0][0],ck.pts[0][1]);for(let i=1;i<ck.pts.length;i++)c.lineTo(ck.pts[i][0],ck.pts[i][1]);c.stroke();
      ck.branches.forEach(b=>{c.beginPath();c.moveTo(b[0][0],b[0][1]);c.lineTo(b[1][0],b[1][1]);c.stroke();});
      c.restore();
    });
    c.globalAlpha=1;c.restore();
    if(this._craters)this._craters.forEach(cr=>{
      const rx=cr.r,ry=cr.r*0.28;
      const bowl=c.createRadialGradient(cr.x,cr.y+ry*0.3,0,cr.x,cr.y,rx*1.1);
      bowl.addColorStop(0,`rgba(18,18,22,${cr.depth*0.9})`);bowl.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=bowl;c.beginPath();c.ellipse(cr.x,cr.y,rx*1.1,ry*1.2,0,0,Math.PI*2);c.fill();
      c.fillStyle=`rgba(14,14,18,${cr.depth*0.7})`;c.beginPath();c.ellipse(cr.x,cr.y+ry*0.1,rx*0.75,ry*0.7,0,0,Math.PI*2);c.fill();
      c.strokeStyle=`rgba(120,122,135,${cr.depth*0.8})`;c.lineWidth=cr.large?1.5:0.8;
      c.beginPath();c.ellipse(cr.x,cr.y-ry*0.1,rx,ry,0,Math.PI*1.05,Math.PI*1.95);c.stroke();
    });
    if(this._moonRocks)this._moonRocks.forEach(rk=>{
      c.save();c.translate(rk.x,rk.y);c.rotate(rk.angle);
      const rg=c.createLinearGradient(0,-rk.rh,0,rk.rh*0.5);rg.addColorStop(0,'rgba(105,107,118,0.9)');rg.addColorStop(1,'rgba(48,50,58,0.9)');
      c.fillStyle=rg;c.beginPath();c.ellipse(0,0,rk.rw,rk.rh,0,0,Math.PI*2);c.fill();c.restore();
    });
    const hg=c.createLinearGradient(0,sY-18,0,sY+12);hg.addColorStop(0,'rgba(80,85,110,0)');hg.addColorStop(0.5,'rgba(80,85,110,0.12)');hg.addColorStop(1,'rgba(80,85,110,0)');
    c.fillStyle=hg;c.fillRect(0,sY-18,cw,30);
    c.restore();
  },

  _drawEarth(cw, ch, now) {
    const c=this._c,ex=cw*0.22,ey=ch*0.3,er=22,rot=now*0.000012;
    const halo=c.createRadialGradient(ex,ey,er*0.9,ex,ey,er*4);
    halo.addColorStop(0,'rgba(70,150,240,0.20)');halo.addColorStop(0.3,'rgba(50,120,210,0.08)');halo.addColorStop(1,'rgba(40,100,180,0)');
    c.fillStyle=halo;c.beginPath();c.arc(ex,ey,er*4,0,Math.PI*2);c.fill();
    c.save();c.beginPath();c.arc(ex,ey,er,0,Math.PI*2);c.clip();
    const ocean=c.createRadialGradient(ex-er*0.25,ey-er*0.25,0,ex,ey,er);ocean.addColorStop(0,'rgb(55,135,215)');ocean.addColorStop(1,'rgb(12,50,115)');
    c.fillStyle=ocean;c.fillRect(ex-er,ey-er,er*2,er*2);
    c.fillStyle='rgb(48,118,62)';c.beginPath();c.ellipse(ex+er*0.18+Math.sin(rot)*1.5,ey+er*0.02,er*0.36,er*0.52,0.35+rot*0.08,0,Math.PI*2);c.fill();
    c.fillStyle='rgb(38,105,52)';c.beginPath();c.ellipse(ex+er*0.05+Math.sin(rot)*1.5,ey-er*0.18,er*0.20,er*0.28,0.8+rot*0.08,0,Math.PI*2);c.fill();
    c.fillStyle='rgb(55,125,68)';c.beginPath();c.ellipse(ex-er*0.28+Math.cos(rot)*1.5,ey+er*0.32,er*0.18,er*0.22,-0.25+rot*0.08,0,Math.PI*2);c.fill();
    c.fillStyle='rgb(242,248,255)';c.globalAlpha=0.88;c.beginPath();c.ellipse(ex-er*0.05+Math.sin(rot*1.8)*1.2,ey-er*0.58,er*0.52,er*0.12,0.08,0,Math.PI*2);c.fill();
    c.globalAlpha=0.65;c.beginPath();c.ellipse(ex+er*0.32+Math.cos(rot*1.8)*1.2,ey+er*0.22,er*0.32,er*0.09,-0.15,0,Math.PI*2);c.fill();
    const limb=c.createRadialGradient(ex,ey,er*0.65,ex,ey,er);limb.addColorStop(0,'rgba(0,0,0,0)');limb.addColorStop(1,'rgba(0,8,25,0.55)');
    c.globalAlpha=1;c.fillStyle=limb;c.fillRect(ex-er,ey-er,er*2,er*2);c.restore();
    c.save();c.globalAlpha=0.4;c.strokeStyle='rgba(170,220,255,1)';c.lineWidth=1.2;
    c.beginPath();c.arc(ex,ey,er,Math.PI*1.05,Math.PI*1.72);c.stroke();c.restore();
  },

  _chime() {
    const actx=AudioEngine._getContext&&AudioEngine._getContext();if(!actx)return;
    const f=180+Math.random()*120;
    const o=actx.createOscillator(),g=actx.createGain();
    o.type='sine';o.frequency.setValueAtTime(f*1.6,actx.currentTime);o.frequency.exponentialRampToValueAtTime(f,actx.currentTime+0.06);
    g.gain.setValueAtTime(0.0,actx.currentTime);g.gain.linearRampToValueAtTime(0.1,actx.currentTime+0.008);
    g.gain.exponentialRampToValueAtTime(0.012,actx.currentTime+0.12);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.4);
    o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+0.4);
    const o2=actx.createOscillator(),g2=actx.createGain();
    o2.type='sine';o2.frequency.value=f*0.5;
    g2.gain.setValueAtTime(0.08,actx.currentTime);g2.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.18);
    o2.connect(g2);g2.connect(actx.destination);o2.start();o2.stop(actx.currentTime+0.18);
  },

  _loop() {
    if(!this._running)return;
    const now=Date.now(),c=this._c;
    const{w:cw,h:ch}=this._getSize();
    if(this._fadeIn<1)this._fadeIn+=0.005;
    const bg=c.createLinearGradient(0,0,0,ch);
    bg.addColorStop(0,'#010109');bg.addColorStop(0.2,'#02030e');bg.addColorStop(0.45,'#040716');
    bg.addColorStop(0.68,'#090e24');bg.addColorStop(0.85,'#0f1530');bg.addColorStop(1,'#16213a');
    c.fillStyle=bg;c.fillRect(0,0,cw,ch);
    c.save();c.globalAlpha=this._fadeIn;
    if(!this._stars)this._stars=this._buildStars(cw,ch);
    this._stars.forEach(s=>{
      const tw=s.baseAlpha*(0.5+0.5*Math.sin(now*s.twinkleSpeed+s.twinklePhase));
      c.fillStyle=s.warm?`rgba(255,220,180,${tw})`:`rgba(220,225,255,${tw})`;
      c.beginPath();c.arc(s.x,s.y,s.size,0,Math.PI*2);c.fill();
    });
    this._drawEarth(cw,ch,now);
    this._drawMoon(cw,ch);
    if(now>=this._nextShoot){this._spawnShooter(cw,ch);this._nextShoot=now+4000+Math.random()*5000;}
    for(let i=this._shooters.length-1;i>=0;i--){
      const s=this._shooters[i];
      if(s.caught){
        s.fadeOut-=0.03;if(s.fadeOut<=0){this._shooters.splice(i,1);continue;}
        const cg=c.createRadialGradient(s.x,s.y,0,s.x,s.y,30*(1-s.fadeOut));
        cg.addColorStop(0,`rgba(220,210,255,${0.3*s.fadeOut})`);cg.addColorStop(1,'rgba(220,210,255,0)');
        c.fillStyle=cg;c.beginPath();c.arc(s.x,s.y,30*(1-s.fadeOut),0,Math.PI*2);c.fill();continue;
      }
      s.x+=s.vx;s.y+=s.vy;s.life-=0.002;
      s.trail.push({x:s.x,y:s.y,alpha:0.6});if(s.trail.length>20)s.trail.shift();
      if(s.life<=0||s.x>cw+50||s.y>ch*0.75){this._shooters.splice(i,1);continue;}
      for(let t=1;t<s.trail.length;t++){
        const tp=s.trail[t];tp.alpha*=0.88;
        c.strokeStyle=`rgba(220,215,255,${tp.alpha*s.life})`;c.lineWidth=1.5*(t/s.trail.length);c.lineCap='round';
        c.beginPath();c.moveTo(s.trail[t-1].x,s.trail[t-1].y);c.lineTo(tp.x,tp.y);c.stroke();
      }
      const hg=c.createRadialGradient(s.x,s.y,0,s.x,s.y,10);
      hg.addColorStop(0,`rgba(240,235,255,${0.5*s.life})`);hg.addColorStop(1,'rgba(200,200,240,0)');
      c.fillStyle=hg;c.beginPath();c.arc(s.x,s.y,10,0,Math.PI*2);c.fill();
      c.fillStyle=`rgba(255,255,255,${0.8*s.life})`;c.beginPath();c.arc(s.x,s.y,1.5,0,Math.PI*2);c.fill();
    }
    for(let i=this._ripples.length-1;i>=0;i--){
      const r=this._ripples[i];r.radius+=r.speed;r.opacity-=0.008;
      if(r.opacity<=0){this._ripples.splice(i,1);continue;}
      c.save();c.strokeStyle=r.color+r.opacity+')';c.lineWidth=1;
      c.beginPath();c.arc(r.x,r.y,r.radius,0,Math.PI*2);c.stroke();c.restore();
    }
    c.restore(); // end fadeIn globalAlpha

    // home button drawn at full opacity, outside fadeIn
    const hb=this._getHomeBtnRect(cw,ch);
    c.save();
    c.fillStyle='rgba(8,14,40,0.80)';c.beginPath();c.roundRect(hb.x,hb.y,hb.w,hb.h,8);c.fill();
    c.strokeStyle='rgba(140,160,220,0.3)';c.lineWidth=1;c.beginPath();c.roundRect(hb.x,hb.y,hb.w,hb.h,8);c.stroke();
    c.font="600 15px 'Helvetica Neue',sans-serif";c.fillStyle='rgba(200,218,255,0.95)';c.textAlign='right';
    c.fillText('⌂ home',cw-14,ch-14);
    c.restore();

    this._raf=requestAnimationFrame(()=>this._loop());
  },

  init(canvas) {
    this._cv=canvas; this._c=canvas.getContext('2d');
    this._running=true; this._fadeIn=0;
    this._shooters=[]; this._ripples=[]; this._nextShoot=Date.now()+2000;
    this._stars=null;
    this._resize();
    this._resizeHandler=()=>this._resize();
    window.addEventListener('resize',this._resizeHandler);
    const self=this;
    this._tapHandler=(e)=>{
      e.preventDefault();
      AudioEngine.unlock();
      if(!AudioEngine.isStarted())AudioEngine.playScene(self.tracks);
      const{w:cw,h:ch}=self._getSize();
      const{x,y}=self._getPos(e);
      const hb=self._getHomeBtnRect(cw,ch);
      if(x>=hb.x&&x<=hb.x+hb.w&&y>=hb.y&&y<=hb.y+hb.h){
        AudioEngine.fadeOut(1.5);
        setTimeout(()=>SceneManager.showScene(null),200);
        return;
      }
      let caught=false;
      for(let i=0;i<self._shooters.length;i++){
        const s=self._shooters[i];if(s.caught)continue;
        if(Math.hypot(x-s.x,y-s.y)<50){
          s.caught=true;caught=true;self._chime();
          self._ripples.push({x:s.x,y:s.y,radius:5,opacity:0.6,speed:0.8,color:'rgba(200,210,255,'});
          self._ripples.push({x:s.x,y:s.y,radius:3,opacity:0.3,speed:1.2,color:'rgba(255,230,200,'});
          break;
        }
      }
      if(!caught)self._ripples.push({x,y,radius:3,opacity:0.2,speed:0.6,color:'rgba(150,160,200,'});
    };
    canvas.addEventListener('click',this._tapHandler);
    canvas.addEventListener('touchstart',this._tapHandler,{passive:false});
    AudioEngine.playScene(this.tracks);
    this._raf=requestAnimationFrame(()=>this._loop());
  },

  stop() {
    this._running=false;
    if(this._raf){cancelAnimationFrame(this._raf);this._raf=null;}
    if(this._cv){this._cv.removeEventListener('click',this._tapHandler);this._cv.removeEventListener('touchstart',this._tapHandler);}
    if(this._resizeHandler)window.removeEventListener('resize',this._resizeHandler);
    AudioEngine.fadeOut(1.0);
  },

});
