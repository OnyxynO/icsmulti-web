var ICSMulti=(function(D){"use strict";function v(e){return e.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r/g,"").replace(/\n/g,"\\n")}function k(e){const r=new TextEncoder().encode(e);if(r.length<=75)return e+`\r
`;const a=[];let t=0;for(;t<r.length;){let o=Math.min(t+(t===0?75:74),r.length);for(;o>t&&o<r.length&&(r[o]&192)===128;)o--;const u=new TextDecoder().decode(r.slice(t,o));a.push(t===0?u:" "+u),t=o}return a.join(`\r
`)+`\r
`}function l(e,i){return k(`${e}:${i}`)}function T(e){const i=e.getUTCFullYear().toString().padStart(4,"0"),r=(e.getUTCMonth()+1).toString().padStart(2,"0"),a=e.getUTCDate().toString().padStart(2,"0");return`${i}${r}${a}`}function $(e,i){const r=new Intl.DateTimeFormat("fr-FR",{timeZone:i,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}).formatToParts(e),a=c=>{var p;return((p=r.find(b=>b.type===c))==null?void 0:p.value)??"00"},t=a("year"),n=a("month"),o=a("day"),u=a("hour").replace(/^24$/,"00").padStart(2,"0"),d=a("minute"),s=a("second");return`${t}${n}${o}T${u}${d}${s}`}function I(e){const i=e.getUTCFullYear().toString().padStart(4,"0"),r=(e.getUTCMonth()+1).toString().padStart(2,"0"),a=e.getUTCDate().toString().padStart(2,"0"),t=e.getUTCHours().toString().padStart(2,"0"),n=e.getUTCMinutes().toString().padStart(2,"0"),o=e.getUTCSeconds().toString().padStart(2,"0");return`${i}${r}${a}T${t}${n}${o}Z`}function A(e){let i="";return i+=`BEGIN:VALARM\r
`,i+=l("TRIGGER",`-PT${e}M`),i+=l("ACTION","DISPLAY"),i+=l("DESCRIPTION","Rappel"),i+=`END:VALARM\r
`,i}function N(e,i,r,a){let t="";t+=`BEGIN:VEVENT\r
`;const n=`${crypto.randomUUID()}@icsmulti`;if(t+=l("UID",n),t+=l("DTSTAMP",I(a)),e.touteLaJournee){const o=new Date(e.dateFin);o.setUTCDate(o.getUTCDate()+1),t+=l("DTSTART;VALUE=DATE",T(e.dateDebut)),t+=l("DTEND;VALUE=DATE",T(o))}else t+=l(`DTSTART;TZID=${r}`,$(e.dateDebut,r)),t+=l(`DTEND;TZID=${r}`,$(e.dateFin,r));return t+=l("SUMMARY",v(i.titre)),i.notes.length>0&&(t+=l("DESCRIPTION",v(i.notes))),e.lieu.length>0&&(t+=l("LOCATION",v(e.lieu))),e.rappelMinutes!==void 0&&(t+=A(e.rappelMinutes)),t+=`END:VEVENT\r
`,t}function U(e,i){const r="Europe/Paris";try{new Intl.DateTimeFormat("fr-FR",{timeZone:r})}catch{throw new Error(`Fuseau horaire invalide : "${r}". Utiliser un identifiant IANA comme "Europe/Paris".`)}const a=new Date;let t="";t+=`BEGIN:VCALENDAR\r
`,t+=l("VERSION","2.0"),t+=l("PRODID","-//ICSMulti//ICSMulti Web//FR"),t+=l("CALSCALE","GREGORIAN"),t+=l("METHOD","PUBLISH");for(const n of e.occurrences)t+=N(n,e,r,a);return t+=`END:VCALENDAR\r
`,t}const M=`
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
`,q={titreForme:"Créer un événement .ics",labelTitre:"Titre *",placeholderTitre:"Nom de l'événement",labelDebut:"Début",labelFin:"Fin",labelJournee:"Journée entière",labelLieu:"Lieu",placeholderLieu:"Adresse ou lieu (optionnel)",labelRappel:"Rappel",rappelAucun:"Aucun rappel",rappelOptions:[{valeur:5,texte:"5 minutes avant"},{valeur:10,texte:"10 minutes avant"},{valeur:15,texte:"15 minutes avant"},{valeur:30,texte:"30 minutes avant"},{valeur:60,texte:"1 heure avant"},{valeur:1440,texte:"1 jour avant"}],bouton:"Télécharger .ics",erreurTitre:"Le titre est obligatoire.",erreurDateDebut:"La date de début est requise.",erreurDateFin:"La date de fin est requise.",erreurDatesOrdre:"La date de fin doit être après le début."},O={titreForme:"Create an .ics event",labelTitre:"Title *",placeholderTitre:"Event name",labelDebut:"Start",labelFin:"End",labelJournee:"All day",labelLieu:"Location",placeholderLieu:"Address or location (optional)",labelRappel:"Reminder",rappelAucun:"No reminder",rappelOptions:[{valeur:5,texte:"5 minutes before"},{valeur:10,texte:"10 minutes before"},{valeur:15,texte:"15 minutes before"},{valeur:30,texte:"30 minutes before"},{valeur:60,texte:"1 hour before"},{valeur:1440,texte:"1 day before"}],bouton:"Download .ics",erreurTitre:"Title is required.",erreurDateDebut:"Start date is required.",erreurDateFin:"End date is required.",erreurDatesOrdre:"End date must be after start."};function j(e){return e==="fr"||e==="en"?e:(navigator.language??"fr").toLowerCase().startsWith("fr")?"fr":"en"}function V(e){return e==="light"||e==="dark"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function z(){if(document.getElementById("icsmulti-styles"))return;const e=document.createElement("style");e.id="icsmulti-styles",e.textContent=M,document.head.appendChild(e)}function f(e){return`icsmulti-${Math.random().toString(36).slice(2,7)}-${e}`}function P(e,i){const r=new Blob([e],{type:"text/calendar;charset=utf-8"}),a=URL.createObjectURL(r),t=document.createElement("a");t.href=a,t.download=i,document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(a)}function J(e,i,r){e.classList.remove("icsmulti-dark","icsmulti-light"),e.classList.add(r==="dark"?"icsmulti-dark":"icsmulti-light");const a=f("titre"),t=f("debut"),n=f("fin"),o=f("journee"),u=f("lieu"),d=f("rappel"),s=i.rappelOptions.map(m=>`<option value="${m.valeur}">${m.texte}</option>`).join(`
`),c=['<div class="icsmulti-widget">',`  <h2 class="icsmulti-titre-form">${i.titreForme}</h2>`,'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${a}">${i.labelTitre}</label>`,`    <input id="${a}" class="icsmulti-input" type="text" placeholder="${i.placeholderTitre}" autocomplete="off" data-champ="titre" />`,'    <span class="icsmulti-msg-erreur" data-erreur="titre" aria-live="polite"></span>',"  </div>",'  <div class="icsmulti-checkbox-groupe">',`    <input id="${o}" class="icsmulti-checkbox" type="checkbox" data-champ="journee" />`,`    <label class="icsmulti-checkbox-label" for="${o}">${i.labelJournee}</label>`,"  </div>",'  <div class="icsmulti-ligne">','    <div class="icsmulti-groupe">',`      <label class="icsmulti-label" for="${t}">${i.labelDebut}</label>`,`      <input id="${t}" class="icsmulti-input" type="datetime-local" data-champ="debut" />`,'      <span class="icsmulti-msg-erreur" data-erreur="debut" aria-live="polite"></span>',"    </div>",'    <div class="icsmulti-groupe">',`      <label class="icsmulti-label" for="${n}">${i.labelFin}</label>`,`      <input id="${n}" class="icsmulti-input" type="datetime-local" data-champ="fin" />`,'      <span class="icsmulti-msg-erreur" data-erreur="fin" aria-live="polite"></span>',"    </div>","  </div>",'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${u}">${i.labelLieu}</label>`,`    <input id="${u}" class="icsmulti-input" type="text" placeholder="${i.placeholderLieu}" data-champ="lieu" />`,"  </div>",'  <div class="icsmulti-groupe">',`    <label class="icsmulti-label" for="${d}">${i.labelRappel}</label>`,`    <select id="${d}" class="icsmulti-select" data-champ="rappel">`,`      <option value="">${i.rappelAucun}</option>`,s,"    </select>","  </div>",`  <button class="icsmulti-bouton" type="button" data-action="telecharger">${i.bouton}</button>`,'  <p class="icsmulti-attribution">','    Propulsé par <a href="https://icsmulti-web.vercel.app" target="_blank" rel="noopener">ICSMulti</a>',"  </p>","</div>"].join(`
`);e.innerHTML=c;const p=e.querySelector('[data-champ="journee"]'),b=e.querySelector('[data-champ="debut"]'),x=e.querySelector('[data-champ="fin"]');p==null||p.addEventListener("change",()=>{const m=p.checked;b&&(b.type=m?"date":"datetime-local"),x&&(x.type=m?"date":"datetime-local")});const h=e.querySelector('[data-action="telecharger"]');h==null||h.addEventListener("click",()=>{G(e,i)})}function g(e,i,r){const a=e.querySelector(`[data-erreur="${i}"]`),t=e.querySelector(`[data-champ="${i}"]`);a&&(a.textContent=r),t==null||t.classList.add("icsmulti-erreur")}function B(e){e.querySelectorAll(".icsmulti-msg-erreur").forEach(i=>{i.textContent=""}),e.querySelectorAll(".icsmulti-erreur").forEach(i=>{i.classList.remove("icsmulti-erreur")})}function G(e,i){var L,y,C,E,w,F;B(e);const r=((L=e.querySelector('[data-champ="titre"]'))==null?void 0:L.value.trim())??"",a=((y=e.querySelector('[data-champ="debut"]'))==null?void 0:y.value)??"",t=((C=e.querySelector('[data-champ="fin"]'))==null?void 0:C.value)??"",n=((E=e.querySelector('[data-champ="journee"]'))==null?void 0:E.checked)??!1,o=((w=e.querySelector('[data-champ="lieu"]'))==null?void 0:w.value.trim())??"",u=((F=e.querySelector('[data-champ="rappel"]'))==null?void 0:F.value)??"";let d=!0;if(r||(g(e,"titre",i.erreurTitre),d=!1),a||(g(e,"debut",i.erreurDateDebut),d=!1),t||(g(e,"fin",i.erreurDateFin),d=!1),a&&t&&!n){const S=new Date(a);new Date(t)<=S&&(g(e,"fin",i.erreurDatesOrdre),d=!1)}if(!d)return;let s,c;if(n){const[S,R,Z]=a.split("-").map(Number);if(s=new Date(S,R-1,Z),t){const[Y,_,W]=t.split("-").map(Number);c=new Date(Y,_-1,W)}else c=new Date(s),c.setDate(c.getDate()+1);c.getTime()<=s.getTime()&&(c=new Date(s),c.setDate(c.getDate()+1))}else s=new Date(a),c=new Date(t);if(isNaN(s.getTime())||isNaN(c.getTime())){g(e,"debut",i.erreurDateDebut);return}const b={id:typeof crypto<"u"&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,dateDebut:s,dateFin:c,lieu:o,touteLaJournee:n,...u?{rappelMinutes:parseInt(u,10)}:{}},h=U({titre:r,notes:"",occurrences:[b]}),m=`${r.replace(/[^a-z0-9]/gi,"_").toLowerCase()}.ics`;P(h,m)}function H(e={}){const i=e.container??"#icsmulti-widget",r=document.querySelector(i);if(!r){console.warn(`[ICSMulti] Conteneur introuvable : "${i}". Assurez-vous que l'élément existe dans le DOM.`);return}const a=j(e.lang),t=V(e.theme),n=a==="fr"?q:O;z(),J(r,n,t)}return D.init=H,Object.defineProperty(D,Symbol.toStringTag,{value:"Module"}),D})({});
