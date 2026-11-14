import { element, profileUrl } from './data.js';
import { getArtists, showDataSource } from './api.js';
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs').trim();
const root = document.documentElement;
const scheme = matchMedia('(prefers-color-scheme: light)');
let preference = 'auto';
try { preference = localStorage.getItem('wiki-theme') || 'auto'; } catch {}
const theme = element('button', 'button', '');
theme.type = 'button';
function applyTheme() {
    root.dataset.theme = preference === 'auto' ? (scheme.matches ? 'light' : 'dark') : preference;
    theme.textContent = 'Vzhled: ' + ({ auto: 'systém', dark: 'tmavý', light: 'světlý' }[preference] || 'systém');
    theme.setAttribute('aria-label', theme.textContent + '. Přepnout vzhled');
}
applyTheme();
scheme.addEventListener('change', applyTheme);
theme.addEventListener('click', () => { preference = ({ auto: 'dark', dark: 'light', light: 'auto' })[preference] || 'auto'; try { localStorage.setItem('wiki-theme', preference); } catch {} applyTheme(); });
const nav = document.querySelector('.main-nav');
for (const [url, label] of [['compare.html','Porovnání'],['network.html','Spolupráce']]) {
    if (nav && !nav.querySelector('a[href="'+url+'"]')) { const link = element('a','',label); link.href=url; nav.append(link); }
}
const tools = element('div','site-tools');
const open = element('button','button','Hledat · Ctrl+K'); open.type='button'; open.setAttribute('aria-haspopup','dialog');
tools.append(open,theme); document.querySelector('.site-header')?.append(tools);
const footer = document.querySelector('.footer');
const legal = element('nav','legal-links'); legal.setAttribute('aria-label','Informace a právní informace');
for (const [url,label] of [['about.html','O projektu'],['privacy.html','Soukromí'],['sources.html','Zdroje a licence'],['takedown.html','Autorská práva']]) { const link=element('a','',label); link.href=url; legal.append(link); }
footer?.append(legal);
const dialog = element('dialog','command-palette glass'); dialog.setAttribute('aria-labelledby','command-title');
const heading=element('h2','','Rychlé hledání'); heading.id='command-title';
const close=element('button','button','Zavřít'); close.type='button'; close.addEventListener('click',()=>dialog.close());
const label=element('label','','Interpret nebo album'); label.htmlFor='command-input';
const input=element('input'); input.id='command-input'; input.type='search'; input.autocomplete='off'; input.setAttribute('role','combobox'); input.setAttribute('aria-autocomplete','list'); input.setAttribute('aria-controls','command-results'); input.setAttribute('aria-expanded','true');
const list=element('ul','command-results'); list.id='command-results'; list.setAttribute('role','listbox'); list.setAttribute('aria-label','Výsledky hledání');
const status=element('p','muted'); status.setAttribute('role','status');
dialog.append(heading,close,label,input,status,list); document.body.append(dialog);
let records=[], matches=[], active=-1, loaded=false;
function activate(index) { active=index; [...list.children].forEach((node,i)=>node.setAttribute('aria-selected',String(i===active))); if(active>=0){input.setAttribute('aria-activedescendant','command-'+active); list.children[active]?.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant'); }
function search() { const query=normalize(input.value); matches=records.filter(item=>normalize(item.label).includes(query)).slice(0,40); list.replaceChildren(); matches.forEach((item,i)=>{ const li=element('li','',item.label); li.id='command-'+i; li.setAttribute('role','option'); li.setAttribute('aria-selected','false'); li.addEventListener('click',()=>location.assign(item.url)); list.append(li); }); status.textContent=matches.length ? matches.length+' výsledků. Použij šipky a Enter.' : 'Žádné výsledky.'; activate(-1); }
async function showSearch() { if(!dialog.open)dialog.showModal(); input.focus(); if(!loaded){ status.textContent='Načítání…'; try { const result=await getArtists(); showDataSource(result.source); records=result.data.flatMap(artist=>[{label:artist.name,url:profileUrl(artist.slug)},...artist.albums.map(album=>({label:album.title+' — '+artist.name,url:profileUrl(artist.slug)+'#diskografie'}))]); loaded=true; search(); } catch { status.textContent='Hledání se nepodařilo načíst. Zavři okno a zkus to znovu.'; }} else search(); }
open.addEventListener('click',showSearch);
input.addEventListener('input',search);
input.addEventListener('keydown',event=>{ if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault(); if(matches.length)activate((active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);} if(event.key==='Enter'&&active>=0){event.preventDefault();location.assign(matches[active].url);} });
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();showSearch();}});
