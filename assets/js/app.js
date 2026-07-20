(()=>{"use strict";
const Q=window.TEST_QUESTIONS,R=window.TEST_RESULTS,A=[["Совсем не про меня",0],["Скорее не про меня",1],["Скорее про меня",2],["Очень похоже на меня",3]];
const s={screen:"home",q:0,answers:Array(Q.length).fill(null),result:null,scores:{},tab:"about",timer:null};
const screens={};document.querySelectorAll("[data-screen]").forEach(x=>screens[x.dataset.screen]=x);
const el=id=>document.getElementById(id);
document.addEventListener("click",e=>{const a=e.target.closest("[data-answer]");if(a)return answer(+a.dataset.answer);const n=e.target.closest("[data-action]");if(!n)return;const m={start:start,back:prev,restart:restart,details:()=>{renderDetails();show("details")},result:()=>show("result")};m[n.dataset.action]?.()});
document.querySelectorAll("[data-tab]").forEach(t=>t.onclick=()=>setTab(t.dataset.tab));
function show(name){Object.values(screens).forEach(x=>{x.hidden=x!==screens[name];x.classList.toggle("is-active",x===screens[name])});s.screen=name;scrollTo(0,0)}
function start(){s.q=0;renderQ();show("test")}
function renderQ(){const q=Q[s.q],n=s.q+1,p=Math.round(n/Q.length*100);el("question-number").textContent=String(n).padStart(2,"0");el("question-text").textContent=q.text;el("progress-text").textContent=`Вопрос ${n} из ${Q.length}`;el("progress-percent").textContent=p+"%";el("progress-bar").style.width=p+"%";el("answers").innerHTML=A.map((x,i)=>`<button class="answer${s.answers[s.q]===x[1]?" is-selected":""}" data-answer="${x[1]}"><b>${i+1}</b><span>${x[0]}</span><i></i></button>`).join("")}
function answer(v){s.answers[s.q]=v;if(s.q===Q.length-1)return analyse();s.q++;renderQ()}
function prev(){if(s.q===0)return show("home");s.q--;renderQ()}
function restart(){s.q=0;s.answers=Array(Q.length).fill(null);s.result=null;s.scores={};show("home")}
function analyse(){calc();show("analysis");let p=0;clearInterval(s.timer);s.timer=setInterval(()=>{p=Math.min(100,p+2);el("analysis-percent").textContent=p+"%";el("analysis-bar").style.width=p+"%";const labels=["Сопоставляем ответы","Считаем стратегии","Определяем ведущий механизм","Формируем интерпретацию"];el("analysis-label").textContent=labels[Math.min(3,Math.floor(p/25))];document.querySelectorAll("[data-step]").forEach((x,i)=>{x.classList.toggle("is-active",i===Math.min(3,Math.floor(p/25)));x.classList.toggle("is-complete",i<Math.floor(p/25))});if(p===100){clearInterval(s.timer);setTimeout(()=>{renderResult();show("result")},350)}},55)}
function calc(){const scores={rescuer:0,controller:0,achiever:0,avoidant:0,dependent:0};Q.forEach((q,i)=>scores[q.strategy]+=s.answers[i]??0);s.scores=scores;s.result=Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0]}
function renderResult(){const r=R[s.result],score=s.scores[s.result],percent=Math.round(score/12*100);el("result-title").textContent=r.title;el("result-tagline").textContent=r.tagline;el("result-summary").textContent=r.summary;el("result-driver").textContent=r.driver;el("result-repeat").textContent=r.repeat;el("result-strength").textContent=r.strength;el("result-risk").textContent=r.risk;el("result-image").src=r.image;el("result-image").alt=r.title;el("result-score").textContent=percent+"%"}
function renderDetails(){const r=R[s.result];el("details-title").textContent=r.title;el("details-intro").textContent=r.intro;setTab("about")}
function setTab(name){s.tab=name;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("is-active",x.dataset.tab===name));el("details-content").innerHTML=R[s.result].tabs[name]}
})();