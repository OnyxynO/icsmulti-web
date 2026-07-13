var ICSMulti=(function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t=`\r
`;function n(e){return e.replace(/\\/g,`\\\\`).replace(/;/g,`\\;`).replace(/,/g,`\\,`).replace(/\r/g,``).replace(/\n/g,`\\n`)}function r(e){let n=new TextEncoder().encode(e);if(n.length<=75)return e+t;let r=[],i=0;for(;i<n.length;){let e=Math.min(i+(i===0?75:74),n.length);for(;e>i&&e<n.length&&(n[e]&192)==128;)e--;let t=new TextDecoder().decode(n.slice(i,e));r.push(i===0?t:` ${t}`),i=e}return r.join(t)+t}function i(e,t){return r(`${e}:${t}`)}function a(e){return`${e.getUTCFullYear().toString().padStart(4,`0`)}${(e.getUTCMonth()+1).toString().padStart(2,`0`)}${e.getUTCDate().toString().padStart(2,`0`)}`}function o(e,t){let n=new Intl.DateTimeFormat(`fr-FR`,{timeZone:t,year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}).formatToParts(e),r=e=>n.find(t=>t.type===e)?.value??`00`;return`${r(`year`)}${r(`month`)}${r(`day`)}T${r(`hour`).replace(/^24$/,`00`).padStart(2,`0`)}${r(`minute`)}${r(`second`)}`}function s(e){return`${e.getUTCFullYear().toString().padStart(4,`0`)}${(e.getUTCMonth()+1).toString().padStart(2,`0`)}${e.getUTCDate().toString().padStart(2,`0`)}T${e.getUTCHours().toString().padStart(2,`0`)}${e.getUTCMinutes().toString().padStart(2,`0`)}${e.getUTCSeconds().toString().padStart(2,`0`)}Z`}function c(e,t){let n=new Intl.DateTimeFormat(`en-GB`,{timeZone:t,year:`numeric`,month:`2-digit`,day:`2-digit`,hour:`2-digit`,minute:`2-digit`,second:`2-digit`,hour12:!1}).formatToParts(e),r=e=>n.find(t=>t.type===e)?.value??`00`,i=Date.UTC(+r(`year`),r(`month`)-1,+r(`day`),+r(`hour`).replace(/^24$/,`00`),+r(`minute`),+r(`second`));return Math.round((i-e.getTime())/6e4)}function l(e){let t=e>=0?`+`:`-`,n=Math.abs(e);return`${t}${Math.floor(n/60).toString().padStart(2,`0`)}${(n%60).toString().padStart(2,`0`)}`}function u(e,t,n){let r=t,i=n,a=c(new Date(r),e);for(;i-r>6e4;){let t=Math.floor((r+i)/2);c(new Date(t),e)===a?r=t:i=t}return new Date(i)}function d(e,n){let r=n[0],a=c(new Date(Date.UTC(r,0,15)),e),s=c(new Date(Date.UTC(r,6,15)),e),d=a!==s,f=`BEGIN:VTIMEZONE${t}`;if(f+=i(`TZID`,e),!d)f+=`BEGIN:STANDARD${t}`,f+=i(`DTSTART`,`19700101T000000`),f+=i(`TZOFFSETFROM`,l(a)),f+=i(`TZOFFSETTO`,l(a)),f+=`END:STANDARD${t}`;else{let r=Math.min(a,s),d=Math.max(a,s),p=[],m=[];for(let t of n)for(let n=0;n<12;n++){let i=Date.UTC(t,n,1),a=Date.UTC(t,n+1,1)-1;if(c(new Date(i),e)===c(new Date(a),e))continue;let s=u(e,i,a),l=o(s,e);c(new Date(s.getTime()+6e4),e)===r?p.push(l):m.push(l)}f+=`BEGIN:STANDARD${t}`,f+=i(`DTSTART`,p[0]??`19701025T030000`),p.length>1&&(f+=i(`RDATE`,p.slice(1).join(`,`))),f+=i(`TZOFFSETFROM`,l(d)),f+=i(`TZOFFSETTO`,l(r)),f+=`END:STANDARD${t}`,f+=`BEGIN:DAYLIGHT${t}`,f+=i(`DTSTART`,m[0]??`19700329T020000`),m.length>1&&(f+=i(`RDATE`,m.slice(1).join(`,`))),f+=i(`TZOFFSETFROM`,l(r)),f+=i(`TZOFFSETTO`,l(d)),f+=`END:DAYLIGHT${t}`}return f+=`END:VTIMEZONE${t}`,f}function f(e){let n=``;return n+=`BEGIN:VALARM${t}`,n+=i(`TRIGGER`,`-PT${e}M`),n+=i(`ACTION`,`DISPLAY`),n+=i(`DESCRIPTION`,`Rappel`),n+=`END:VALARM${t}`,n}function p(e,r,c){let l=``;l+=`BEGIN:VEVENT${t}`;let u=`${crypto.randomUUID()}@icsmulti`;if(l+=i(`UID`,u),l+=i(`DTSTAMP`,s(c)),e.touteLaJournee){let t=new Date(e.dateFin);t.setUTCDate(t.getUTCDate()+1),l+=i(`DTSTART;VALUE=DATE`,a(e.dateDebut)),l+=i(`DTEND;VALUE=DATE`,a(t))}else l+=i(`DTSTART;TZID=${r}`,o(e.dateDebut,r)),l+=i(`DTEND;TZID=${r}`,o(e.dateFin,r));return l+=i(`SUMMARY`,n(e.titre)),e.notes.length>0&&(l+=i(`DESCRIPTION`,n(e.notes))),e.lieu.length>0&&(l+=i(`LOCATION`,n(e.lieu))),e.rappelMinutes!==void 0&&(l+=f(e.rappelMinutes)),l+=`END:VEVENT${t}`,l}function m(e,n){let r=n?.fuseau??`Europe/Paris`;try{new Intl.DateTimeFormat(`fr-FR`,{timeZone:r})}catch{throw Error(`Fuseau horaire invalide : "${r}". Utiliser un identifiant IANA comme "Europe/Paris".`)}let a=new Date,o=``;o+=`BEGIN:VCALENDAR${t}`,o+=i(`VERSION`,`2.0`),o+=i(`PRODID`,`-//ICSMulti//ICSMulti Web//FR`),o+=i(`CALSCALE`,`GREGORIAN`),o+=i(`METHOD`,`PUBLISH`);let s=e.occurrences.filter(e=>!e.touteLaJournee);if(s.length>0){let e=[...new Set(s.flatMap(e=>[e.dateDebut.getUTCFullYear(),e.dateFin.getUTCFullYear()]))].sort((e,t)=>e-t);o+=d(r,e)}for(let t of e.occurrences)o+=p(t,r,a);return o+=`END:VCALENDAR${t}`,o}var h=`
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
`,g={titreForme:`Créer un événement .ics`,labelTitre:`Titre *`,placeholderTitre:`Nom de l'événement`,labelDebut:`Début`,labelFin:`Fin`,labelJournee:`Journée entière`,labelLieu:`Lieu`,placeholderLieu:`Adresse ou lieu (optionnel)`,labelRappel:`Rappel`,rappelAucun:`Aucun rappel`,rappelOptions:[{valeur:5,texte:`5 minutes avant`},{valeur:10,texte:`10 minutes avant`},{valeur:15,texte:`15 minutes avant`},{valeur:30,texte:`30 minutes avant`},{valeur:60,texte:`1 heure avant`},{valeur:1440,texte:`1 jour avant`}],bouton:`Télécharger .ics`,erreurTitre:`Le titre est obligatoire.`,erreurDateDebut:`La date de début est requise.`,erreurDateFin:`La date de fin est requise.`,erreurDatesOrdre:`La date de fin doit être après le début.`},_={titreForme:`Create an .ics event`,labelTitre:`Title *`,placeholderTitre:`Event name`,labelDebut:`Start`,labelFin:`End`,labelJournee:`All day`,labelLieu:`Location`,placeholderLieu:`Address or location (optional)`,labelRappel:`Reminder`,rappelAucun:`No reminder`,rappelOptions:[{valeur:5,texte:`5 minutes before`},{valeur:10,texte:`10 minutes before`},{valeur:15,texte:`15 minutes before`},{valeur:30,texte:`30 minutes before`},{valeur:60,texte:`1 hour before`},{valeur:1440,texte:`1 day before`}],bouton:`Download .ics`,erreurTitre:`Title is required.`,erreurDateDebut:`Start date is required.`,erreurDateFin:`End date is required.`,erreurDatesOrdre:`End date must be after start.`};function v(e){return e===`fr`||e===`en`?e:(navigator.language??`fr`).toLowerCase().startsWith(`fr`)?`fr`:`en`}function y(e){return e===`light`||e===`dark`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`}function b(){if(document.getElementById(`icsmulti-styles`))return;let e=document.createElement(`style`);e.id=`icsmulti-styles`,e.textContent=h,document.head.appendChild(e)}function x(e){return`icsmulti-${Math.random().toString(36).slice(2,7)}-${e}`}function S(e,t){let n=new Blob([e],{type:`text/calendar;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}function C(e,t,n){e.classList.remove(`icsmulti-dark`,`icsmulti-light`),e.classList.add(n===`dark`?`icsmulti-dark`:`icsmulti-light`);let r=x(`titre`),i=x(`debut`),a=x(`fin`),o=x(`journee`),s=x(`lieu`),c=x(`rappel`),l=t.rappelOptions.map(e=>`<option value="${e.valeur}">${e.texte}</option>`).join(`
`);e.innerHTML=[`<div class="icsmulti-widget">`,`  <h2 class="icsmulti-titre-form">${t.titreForme}</h2>`,`  <div class="icsmulti-groupe">`,`    <label class="icsmulti-label" for="${r}">${t.labelTitre}</label>`,`    <input id="${r}" class="icsmulti-input" type="text" placeholder="${t.placeholderTitre}" autocomplete="off" data-champ="titre" />`,`    <span class="icsmulti-msg-erreur" data-erreur="titre" aria-live="polite"></span>`,`  </div>`,`  <div class="icsmulti-checkbox-groupe">`,`    <input id="${o}" class="icsmulti-checkbox" type="checkbox" data-champ="journee" />`,`    <label class="icsmulti-checkbox-label" for="${o}">${t.labelJournee}</label>`,`  </div>`,`  <div class="icsmulti-ligne">`,`    <div class="icsmulti-groupe">`,`      <label class="icsmulti-label" for="${i}">${t.labelDebut}</label>`,`      <input id="${i}" class="icsmulti-input" type="datetime-local" data-champ="debut" />`,`      <span class="icsmulti-msg-erreur" data-erreur="debut" aria-live="polite"></span>`,`    </div>`,`    <div class="icsmulti-groupe">`,`      <label class="icsmulti-label" for="${a}">${t.labelFin}</label>`,`      <input id="${a}" class="icsmulti-input" type="datetime-local" data-champ="fin" />`,`      <span class="icsmulti-msg-erreur" data-erreur="fin" aria-live="polite"></span>`,`    </div>`,`  </div>`,`  <div class="icsmulti-groupe">`,`    <label class="icsmulti-label" for="${s}">${t.labelLieu}</label>`,`    <input id="${s}" class="icsmulti-input" type="text" placeholder="${t.placeholderLieu}" data-champ="lieu" />`,`  </div>`,`  <div class="icsmulti-groupe">`,`    <label class="icsmulti-label" for="${c}">${t.labelRappel}</label>`,`    <select id="${c}" class="icsmulti-select" data-champ="rappel">`,`      <option value="">${t.rappelAucun}</option>`,l,`    </select>`,`  </div>`,`  <button class="icsmulti-bouton" type="button" data-action="telecharger">${t.bouton}</button>`,`  <p class="icsmulti-attribution">`,`    Propulsé par <a href="https://icsmulti-web.vercel.app" target="_blank" rel="noopener">ICSMulti</a>`,`  </p>`,`</div>`].join(`
`);let u=e.querySelector(`[data-champ="journee"]`),d=e.querySelector(`[data-champ="debut"]`),f=e.querySelector(`[data-champ="fin"]`);u?.addEventListener(`change`,()=>{let e=u.checked;d&&(d.type=e?`date`:`datetime-local`),f&&(f.type=e?`date`:`datetime-local`)}),e.querySelector(`[data-action="telecharger"]`)?.addEventListener(`click`,()=>{E(e,t)})}function w(e,t,n){let r=e.querySelector(`[data-erreur="${t}"]`),i=e.querySelector(`[data-champ="${t}"]`);r&&(r.textContent=n),i?.classList.add(`icsmulti-erreur`)}function T(e){e.querySelectorAll(`.icsmulti-msg-erreur`).forEach(e=>{e.textContent=``}),e.querySelectorAll(`.icsmulti-erreur`).forEach(e=>{e.classList.remove(`icsmulti-erreur`)})}function E(e,t){T(e);let n=e.querySelector(`[data-champ="titre"]`)?.value.trim()??``,r=e.querySelector(`[data-champ="debut"]`)?.value??``,i=e.querySelector(`[data-champ="fin"]`)?.value??``,a=e.querySelector(`[data-champ="journee"]`)?.checked??!1,o=e.querySelector(`[data-champ="lieu"]`)?.value.trim()??``,s=e.querySelector(`[data-champ="rappel"]`)?.value??``,c=!0;if(n||(w(e,`titre`,t.erreurTitre),c=!1),r||(w(e,`debut`,t.erreurDateDebut),c=!1),i||(w(e,`fin`,t.erreurDateFin),c=!1),r&&i&&!a){let n=new Date(r);new Date(i)<=n&&(w(e,`fin`,t.erreurDatesOrdre),c=!1)}if(!c)return;let l,u;if(a){let[e,t,n]=r.split(`-`).map(Number);if(l=new Date(e,t-1,n),i){let[e,t,n]=i.split(`-`).map(Number);u=new Date(e,t-1,n)}else u=new Date(l),u.setDate(u.getDate()+1);u.getTime()<=l.getTime()&&(u=new Date(l),u.setDate(u.getDate()+1))}else l=new Date(r),u=new Date(i);if(Number.isNaN(l.getTime())||Number.isNaN(u.getTime())){w(e,`debut`,t.erreurDateDebut);return}S(m({occurrences:[{id:typeof crypto<`u`&&typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,titre:n,notes:``,dateDebut:l,dateFin:u,lieu:o,touteLaJournee:a,...s?{rappelMinutes:parseInt(s,10)}:{}}]}),`${n.replace(/[^a-z0-9]/gi,`_`).toLowerCase()}.ics`)}function D(e={}){let t=e.container??`#icsmulti-widget`,n=document.querySelector(t);if(!n){console.warn(`[ICSMulti] Conteneur introuvable : "${t}". Assurez-vous que l'élément existe dans le DOM.`);return}let r=v(e.lang),i=y(e.theme),a=r===`fr`?g:_;b(),C(n,a,i)}return e.init=D,e})({});