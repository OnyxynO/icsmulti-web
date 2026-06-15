var ICSMulti=(function(x){"use strict";function $(e){return e.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r/g,"").replace(/\n/g,"\\n")}function C(e){const n=new TextEncoder().encode(e);if(n.length<=75)return e+`\r
`;const i=[];let r=0;for(;r<n.length;){let a=Math.min(r+(r===0?75:74),n.length);for(;a>r&&a<n.length&&(n[a]&192)===128;)a--;const c=new TextDecoder().decode(n.slice(r,a));i.push(r===0?c:` ${c}`),r=a}return i.join(`\r
`)+`\r
`}function o(e,t){return C(`${e}:${t}`)}function E(e){const t=e.getUTCFullYear().toString().padStart(4,"0"),n=(e.getUTCMonth()+1).toString().padStart(2,"0"),i=e.getUTCDate().toString().padStart(2,"0");return`${t}${n}${i}`}function F(e,t){const n=new Intl.DateTimeFormat("fr-FR",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).formatToParts(e),i=s=>n.find(p=>p.type===s)?.value??"00",r=i("year"),l=i("month"),a=i("day"),c=i("hour").replace(/^24$/,"00").padStart(2,"0"),d=i("minute"),u=i("second");return`${r}${l}${a}T${c}${d}${u}`}function R(e){const t=e.getUTCFullYear().toString().padStart(4,"0"),n=(e.getUTCMonth()+1).toString().padStart(2,"0"),i=e.getUTCDate().toString().padStart(2,"0"),r=e.getUTCHours().toString().padStart(2,"0"),l=e.getUTCMinutes().toString().padStart(2,"0"),a=e.getUTCSeconds().toString().padStart(2,"0");return`${t}${n}${i}T${r}${l}${a}Z`}function b(e,t){const i=new Intl.DateTimeFormat("en-GB",{timeZone:t,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).formatToParts(e),r=a=>i.find(c=>c.type===a)?.value??"00",l=Date.UTC(+r("year"),+r("month")-1,+r("day"),+r("hour").replace(/^24$/,"00"),+r("minute"),+r("second"));return Math.round((l-e.getTime())/6e4)}function h(e){const t=e>=0?"+":"-",n=Math.abs(e);return`${t}${Math.floor(n/60).toString().padStart(2,"0")}${(n%60).toString().padStart(2,"0")}`}function y(e,t,n){let i=t,r=n;const l=b(new Date(i),e);for(;r-i>6e4;){const a=Math.floor((i+r)/2);b(new Date(a),e)===l?i=a:r=a}return new Date(r)}function w(e,t){const n=t[0],i=b(new Date(Date.UTC(n,0,15)),e),r=b(new Date(Date.UTC(n,6,15)),e),l=i!==r;let a=`BEGIN:VTIMEZONE\r
`;if(a+=o("TZID",e),!l)a+=`BEGIN:STANDARD\r
`,a+=o("DTSTART","19700101T000000"),a+=o("TZOFFSETFROM",h(i)),a+=o("TZOFFSETTO",h(i)),a+=`END:STANDARD\r
`;else{const c=Math.min(i,r),d=Math.max(i,r),u=[],s=[];for(const p of t)for(let f=0;f<12;f++){const g=Date.UTC(p,f,1),v=Date.UTC(p,f+1,1)-1;if(b(new Date(g),e)===b(new Date(v),e))continue;const m=y(e,g,v),T=F(m,e);b(new Date(m.getTime()+6e4),e)===c?u.push(T):s.push(T)}a+=`BEGIN:STANDARD\r
`,a+=o("DTSTART",u[0]??"19701025T030000"),u.length>1&&(a+=o("RDATE",u.slice(1).join(","))),a+=o("TZOFFSETFROM",h(d)),a+=o("TZOFFSETTO",h(c)),a+=`END:STANDARD\r
`,a+=`BEGIN:DAYLIGHT\r
`,a+=o("DTSTART",s[0]??"19700329T020000"),s.length>1&&(a+=o("RDATE",s.slice(1).join(","))),a+=o("TZOFFSETFROM",h(c)),a+=o("TZOFFSETTO",h(d)),a+=`END:DAYLIGHT\r
`}return a+=`END:VTIMEZONE\r
`,a}function A(e){let t="";return t+=`BEGIN:VALARM\r
`,t+=o("TRIGGER",`-PT${e}M`),t+=o("ACTION","DISPLAY"),t+=o("DESCRIPTION","Rappel"),t+=`END:VALARM\r
`,t}function I(e,t,n){let i="";i+=`BEGIN:VEVENT\r
`;const r=`${crypto.randomUUID()}@icsmulti`;if(i+=o("UID",r),i+=o("DTSTAMP",R(n)),e.touteLaJournee){const l=new Date(e.dateFin);l.setUTCDate(l.getUTCDate()+1),i+=o("DTSTART;VALUE=DATE",E(e.dateDebut)),i+=o("DTEND;VALUE=DATE",E(l))}else i+=o(`DTSTART;TZID=${t}`,F(e.dateDebut,t)),i+=o(`DTEND;TZID=${t}`,F(e.dateFin,t));return i+=o("SUMMARY",$(e.titre)),e.notes.length>0&&(i+=o("DESCRIPTION",$(e.notes))),e.lieu.length>0&&(i+=o("LOCATION",$(e.lieu))),e.rappelMinutes!==void 0&&(i+=A(e.rappelMinutes)),i+=`END:VEVENT\r
`,i}function N(e,t){const n="Europe/Paris";try{new Intl.DateTimeFormat("fr-FR",{timeZone:n})}catch{throw new Error(`Fuseau horaire invalide : "${n}". Utiliser un identifiant IANA comme "Europe/Paris".`)}const i=new Date;let r="";r+=`BEGIN:VCALENDAR\r
`,r+=o("VERSION","2.0"),r+=o("PRODID","-//ICSMulti//ICSMulti Web//FR"),r+=o("CALSCALE","GREGORIAN"),r+=o("METHOD","PUBLISH");const l=e.occurrences.filter(a=>!a.touteLaJournee);if(l.length>0){const a=[...new Set(l.flatMap(c=>[c.dateDebut.getUTCFullYear(),c.dateFin.getUTCFullYear()]))].sort((c,d)=>c-d);r+=w(n,a)}for(const a of e.occurrences)r+=I(a,n,i);return r+=`END:VCALENDAR\r
`,r}const k=`
.icsmulti-widget {
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  max-width: 100%;
  font-family: inherit;
  font-size: 14px;
  color: #111827;
}

.icsmulti-widget *,
.icsmulti-widget *::before,
.icsmulti-widget *::after {
  box-sizing: border-box;
}

.icsmulti-titre-form {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #111827;
}

.icsmulti-groupe {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.icsmulti-ligne {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.icsmulti-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.icsmulti-input,
.icsmulti-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

.icsmulti-input:focus,
.icsmulti-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.icsmulti-input.icsmulti-erreur {
  border-color: #ef4444;
}

.icsmulti-checkbox-groupe {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.icsmulti-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.icsmulti-checkbox-label {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.icsmulti-msg-erreur {
  font-size: 12px;
  color: #ef4444;
  margin-top: 2px;
}

.icsmulti-bouton {
  width: 100%;
  padding: 10px 16px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s ease;
}

.icsmulti-bouton:hover {
  background: #4f46e5;
}

.icsmulti-bouton:active {
  background: #4338ca;
}

.icsmulti-attribution {
  margin-top: 12px;
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}

.icsmulti-attribution a {
  color: #6366f1;
  text-decoration: none;
}

/* Thème sombre */
.icsmulti-dark .icsmulti-widget {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-titre-form {
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-label,
.icsmulti-dark .icsmulti-checkbox-label {
  color: #d1d5db;
}

.icsmulti-dark .icsmulti-input,
.icsmulti-dark .icsmulti-select {
  background: #111827;
  border-color: #4b5563;
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-input:focus,
.icsmulti-dark .icsmulti-select:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
}

.icsmulti-dark .icsmulti-attribution {
  color: #6b7280;
}
`,M={titreForme:"Créer un événement .ics",labelTitre:"Titre *",placeholderTitre:"Nom de l'événement",labelDebut:"Début",labelFin:"Fin",labelJournee:"Journée entière",labelLieu:"Lieu",placeholderLieu:"Adresse ou lieu (optionnel)",labelRappel:"Rappel",rappelAucun:"Aucun rappel",rappelOptions:[{valeur:5,texte:"5 minutes avant"},{valeur:10,texte:"10 minutes avant"},{valeur:15,texte:"15 minutes avant"},{valeur:30,texte:"30 minutes avant"},{valeur:60,texte:"1 heure avant"},{valeur:1440,texte:"1 jour avant"}],bouton:"Télécharger .ics",erreurTitre:"Le titre est obligatoire.",erreurDateDebut:"La date de début est requise.",erreurDateFin:"La date de fin est requise.",erreurDatesOrdre:"La date de fin doit être après le début."},O={titreForme:"Create an .ics event",labelTitre:"Title *",placeholderTitre:"Event name",labelDebut:"Start",labelFin:"End",labelJournee:"All day",labelLieu:"Location",placeholderLieu:"Address or location (optional)",labelRappel:"Reminder",rappelAucun:"No reminder",rappelOptions:[{valeur:5,texte:"5 minutes before"},{valeur:10,texte:"10 minutes before"},{valeur:15,texte:"15 minutes before"},{valeur:30,texte:"30 minutes before"},{valeur:60,texte:"1 hour before"},{valeur:1440,texte:"1 day before"}],bouton:"Download .ics",erreurTitre:"Title is required.",erreurDateDebut:"Start date is required.",erreurDateFin:"End date is required.",erreurDatesOrdre:"End date must be after start."};function U(e){return e==="fr"||e==="en"?e:(navigator.language??"fr").toLowerCase().startsWith("fr")?"fr":"en"}function q(e){return e==="light"||e==="dark"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function j(){if(document.getElementById("icsmulti-styles"))return;const e=document.createElement("style");e.id="icsmulti-styles",e.textContent=k,document.head.appendChild(e)}function D(e){return`icsmulti-${Math.random().toString(36).slice(2,7)}-${e}`}function V(e,t){const n=new Blob([e],{type:"text/calendar;charset=utf-8"}),i=URL.createObjectURL(n),r=document.createElement("a");r.href=i,r.download=t,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(i)}function Z(e,t,n){e.classList.remove("icsmulti-dark","icsmulti-light"),e.classList.add(n==="dark"?"icsmulti-dark":"icsmulti-light");const i=D("titre"),r=D("debut"),l=D("fin"),a=D("journee"),c=D("lieu"),d=D("rappel"),u=t.rappelOptions.map(m=>`<option value="${m.valeur}">${m.texte}</option>`).join(`
`),s=['<div class="icsmulti-widget">',`  <h2 class="icsmulti-titre-form">${t.titreForme}</h2>`,'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${i}">${t.labelTitre}</label>`,`    <input id="${i}" class="icsmulti-input" type="text" placeholder="${t.placeholderTitre}" autocomplete="off" data-champ="titre" />`,'    <span class="icsmulti-msg-erreur" data-erreur="titre" aria-live="polite"></span>',"  </div>",'  <div class="icsmulti-checkbox-groupe">',`    <input id="${a}" class="icsmulti-checkbox" type="checkbox" data-champ="journee" />`,`    <label class="icsmulti-checkbox-label" for="${a}">${t.labelJournee}</label>`,"  </div>",'  <div class="icsmulti-ligne">','    <div class="icsmulti-groupe">',`      <label class="icsmulti-label" for="${r}">${t.labelDebut}</label>`,`      <input id="${r}" class="icsmulti-input" type="datetime-local" data-champ="debut" />`,'      <span class="icsmulti-msg-erreur" data-erreur="debut" aria-live="polite"></span>',"    </div>",'    <div class="icsmulti-groupe">',`      <label class="icsmulti-label" for="${l}">${t.labelFin}</label>`,`      <input id="${l}" class="icsmulti-input" type="datetime-local" data-champ="fin" />`,'      <span class="icsmulti-msg-erreur" data-erreur="fin" aria-live="polite"></span>',"    </div>","  </div>",'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${c}">${t.labelLieu}</label>`,`    <input id="${c}" class="icsmulti-input" type="text" placeholder="${t.placeholderLieu}" data-champ="lieu" />`,"  </div>",'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${d}">${t.labelRappel}</label>`,`    <select id="${d}" class="icsmulti-select" data-champ="rappel">`,`      <option value="">${t.rappelAucun}</option>`,u,"    </select>","  </div>",`  <button class="icsmulti-bouton" type="button" data-action="telecharger">${t.bouton}</button>`,'  <p class="icsmulti-attribution">','    Propulsé par <a href="https://icsmulti-web.vercel.app" target="_blank" rel="noopener">ICSMulti</a>',"  </p>","</div>"].join(`
`);e.innerHTML=s;const p=e.querySelector('[data-champ="journee"]'),f=e.querySelector('[data-champ="debut"]'),g=e.querySelector('[data-champ="fin"]');p?.addEventListener("change",()=>{const m=p.checked;f&&(f.type=m?"date":"datetime-local"),g&&(g.type=m?"date":"datetime-local")}),e.querySelector('[data-action="telecharger"]')?.addEventListener("click",()=>{G(e,t)})}function S(e,t,n){const i=e.querySelector(`[data-erreur="${t}"]`),r=e.querySelector(`[data-champ="${t}"]`);i&&(i.textContent=n),r?.classList.add("icsmulti-erreur")}function z(e){e.querySelectorAll(".icsmulti-msg-erreur").forEach(t=>{t.textContent=""}),e.querySelectorAll(".icsmulti-erreur").forEach(t=>{t.classList.remove("icsmulti-erreur")})}function G(e,t){z(e);const n=e.querySelector('[data-champ="titre"]')?.value.trim()??"",i=e.querySelector('[data-champ="debut"]')?.value??"",r=e.querySelector('[data-champ="fin"]')?.value??"",l=e.querySelector('[data-champ="journee"]')?.checked??!1,a=e.querySelector('[data-champ="lieu"]')?.value.trim()??"",c=e.querySelector('[data-champ="rappel"]')?.value??"";let d=!0;if(n||(S(e,"titre",t.erreurTitre),d=!1),i||(S(e,"debut",t.erreurDateDebut),d=!1),r||(S(e,"fin",t.erreurDateFin),d=!1),i&&r&&!l){const T=new Date(i);new Date(r)<=T&&(S(e,"fin",t.erreurDatesOrdre),d=!1)}if(!d)return;let u,s;if(l){const[T,L,B]=i.split("-").map(Number);if(u=new Date(T,L-1,B),r){const[P,H,Y]=r.split("-").map(Number);s=new Date(P,H-1,Y)}else s=new Date(u),s.setDate(s.getDate()+1);s.getTime()<=u.getTime()&&(s=new Date(u),s.setDate(s.getDate()+1))}else u=new Date(i),s=new Date(r);if(Number.isNaN(u.getTime())||Number.isNaN(s.getTime())){S(e,"debut",t.erreurDateDebut);return}const g={occurrences:[{id:typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,titre:n,notes:"",dateDebut:u,dateFin:s,lieu:a,touteLaJournee:l,...c?{rappelMinutes:parseInt(c,10)}:{}}]},v=N(g),m=`${n.replace(/[^a-z0-9]/gi,"_").toLowerCase()}.ics`;V(v,m)}function J(e={}){const t=e.container??"#icsmulti-widget",n=document.querySelector(t);if(!n){console.warn(`[ICSMulti] Conteneur introuvable : "${t}". Assurez-vous que l'élément existe dans le DOM.`);return}const i=U(e.lang),r=q(e.theme),l=i==="fr"?M:O;j(),Z(n,l,r)}return x.init=J,Object.defineProperty(x,Symbol.toStringTag,{value:"Module"}),x})({});
