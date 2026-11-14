import { ratingPanel } from "./community.js";
import { element, externalLink, picture, profileUrl } from './data.js';
import { getArtists, showDataSource } from './api.js';
export function spotifyPlayer(url, title) {
    let target;
    try { target = new URL(url); } catch { return null; }
    const match = target.pathname.match(/^\/(?:intl-[a-z]+\/)?(album|track|artist|playlist)\/([a-zA-Z0-9]+)\/?$/);
    if (target.protocol !== 'https:' || target.hostname !== 'open.spotify.com' || !match) return null;
    const slot = element('div','spotify-slot');
    const consent = element('p','attribution','Přehrávač se připojí ke Spotify až po kliknutí. Spotify obdrží tvoji IP adresu a může používat cookies.');
    const button = element('button','button','Načíst Spotify: '+title); button.type='button';
    button.addEventListener('click',()=>{
        const frame=element('iframe'); frame.src='https://open.spotify.com/embed/'+match[1]+'/'+match[2]; frame.title='Spotify — '+title; frame.loading='lazy'; frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; frame.allowFullscreen=true; frame.referrerPolicy='strict-origin-when-cross-origin'; slot.replaceChildren(frame); frame.focus();
    }); slot.append(consent,button); return slot;
}
export function discography(artist) {
    const section=element('section','profile-albums glass'); section.id='diskografie';
    section.append(element('h2','','Diskografie v čase'));
    const label=element('label','extra-filters','Typ vydání');
    const filter=element('select'); filter.setAttribute('aria-label','Typ vydání');
    for(const [value,text] of [['all','Vše'],['album','Album'],['ep','EP'],['mixtape','Mixtape'],['live','Živá nahrávka'],['todo','Typ neuveden (TODO)']]){const option=element('option','',text);option.value=value;filter.append(option);}
    label.append(filter); section.append(label);
    const status=element('p','muted'); status.setAttribute('role','status');
    const list=element('ol','discography');
    const sorted=[...artist.albums].sort((a,b)=>(Number(a.year)||Infinity)-(Number(b.year)||Infinity));
    function render(){ list.replaceChildren(); const albums=sorted.filter(album=>filter.value==='all'||String(album.type).toLowerCase()===filter.value);
        for(const album of albums){const item=element('li'); const row=element('div','discography-row'); const cover=externalLink(album.spotifyUrl,'album-card')||element('div','album-card'); cover.append(picture(album.cover,'Obal: '+album.title)); const copy=element('div'); copy.append(element('p','eyebrow',Number(album.year)?String(album.year):'Rok: TODO'),element('h3','',album.title),element('p','muted','Typ: '+(album.type||'TODO'))); const player=spotifyPlayer(album.spotifyUrl,album.title); if(player)copy.append(player); if(album.id)copy.append(ratingPanel(album)); row.append(cover,copy);item.append(row);list.append(item); }
        status.textContent=albums.length ? albums.length+' vydání. Neznámé roky jsou na konci.' : 'Žádná vydání tohoto typu.';
    } filter.addEventListener('change',render); render(); section.append(status,list); return section;
}
export async function relatedArtists(artist, main) {
    const section=element('section','info-panel glass similar-artists'); section.append(element('h2','','Podobní interpreti'));
    const status=element('p','','Načítání podobných interpretů…'); status.setAttribute('role','status'); section.append(status); main.append(section);
    try { const result=await getArtists(); if(result.source==='offline')showDataSource('offline'); const others=result.data.filter(item=>item.slug!==artist.slug); const similar=others.map(item=>({artist:item,shared:[...item.genres.filter(value=>artist.genres.includes(value)),...item.crews.filter(value=>artist.crews.includes(value))]})).filter(item=>item.shared.length).sort((a,b)=>b.shared.length-a.shared.length);
        status.textContent=similar.length ? 'Podle společných žánrů a skupin.' : 'TODO — zatím nejsou doložené společné žánry nebo skupiny.';
        const list=element('ul'); for(const item of similar.slice(0,6)){const li=element('li');const link=element('a','button',item.artist.name+' · '+item.shared.join(', '));link.href=profileUrl(item.artist.slug);li.append(link);list.append(li);} section.append(list);
        const random=element('button','button','Náhodný interpret');random.type='button';random.disabled=!others.length;random.addEventListener('click',()=>location.assign(profileUrl(others[Math.floor(Math.random()*others.length)].slug)));section.append(random);
    } catch { status.textContent='Podobné interprety se nepodařilo načíst.'; }
}
