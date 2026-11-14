import { element, profileUrl } from './data.js';
import { getArtists, getCollaborations, showDataSource } from './api.js';
const status=document.querySelector('#network-status');
try {
    const results=await Promise.all([getArtists(),getCollaborations()]); const artists=results[0].data, rows=results[1].data;
    showDataSource(results.some(item=>item.source==='offline')?'offline':'supabase');
    const table=element('table');table.append(element('caption','','Doložené spolupráce'));const head=element('thead');const headings=element('tr');for(const title of ['Interpret','Spolupracující interpret','Skladba','Rok']){const th=element('th','',title);th.scope='col';headings.append(th);}head.append(headings);table.append(head);const body=element('tbody');
    for(const row of rows){const tr=element('tr');for(const artist of [row.artistA,row.artistB]){const td=element('td');if(artist){const link=element('a','',artist.name);link.href=profileUrl(artist.slug);td.append(link);}else td.textContent='TODO';tr.append(td);}tr.append(element('td','',row.track_title||'TODO — doloženo společné vydání'),element('td','',String(row.year||'TODO')));body.append(tr);}table.append(body);document.querySelector('#collaborations-table').append(table);
    status.textContent=rows.length?rows.length+' doložené spolupráce.':'Zatím nejsou doložené spolupráce. Zobrazují se pouze interpreti.';
    try {
        const d3=await import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm');
        const nodes=artists.map(item=>({id:item.slug,name:item.name,country:item.country})); const groups=new Map();for(const row of rows){const a=row.artistA?.slug,b=row.artistB?.slug;if(!nodes.some(n=>n.id===a)||!nodes.some(n=>n.id===b))continue;const key=[a,b].sort().join('|');if(groups.has(key))groups.get(key).count++;else groups.set(key,{source:a,target:b,count:1});}const links=[...groups.values()];
        const svg=d3.select('#network').append('svg').attr('viewBox','0 0 960 620').attr('class','network-graph').attr('role','group').attr('aria-label','Graf spoluprací; stejná data jsou v tabulce níže.');
        const edges=svg.append('g').selectAll('line').data(links).join('line').attr('class','network-edge').attr('stroke-width',d=>1+Math.sqrt(d.count)*2);
        const circles=svg.append('g').selectAll('a').data(nodes).join('a').attr('class','network-node').attr('href',d=>profileUrl(d.id)).attr('aria-label',d=>d.name+' — profil').attr('tabindex',0);
        circles.append('circle').attr('r',22).attr('class',d=>d.country==='sk'?'node-sk':'node-cz');circles.append('title').text(d=>d.name);circles.append('text').attr('text-anchor','middle').attr('y',40).text(d=>d.name);
        const simulation=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(160)).force('charge',d3.forceManyBody().strength(-450)).force('center',d3.forceCenter(480,300)).force('collide',d3.forceCollide(65));
        function draw(){nodes.forEach(d=>{d.x=Math.max(85,Math.min(875,d.x));d.y=Math.max(40,Math.min(550,d.y));});edges.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);circles.attr('transform',d=>'translate('+d.x+','+d.y+')');}
        const reduced=matchMedia('(prefers-reduced-motion: reduce)');function settle(){simulation.stop();for(let i=0;i<200;i++)simulation.tick();draw();}if(reduced.matches)settle();else simulation.on('tick',draw);reduced.addEventListener('change',event=>{if(event.matches)settle();});window.addEventListener('pagehide',()=>simulation.stop(),{once:true});
    } catch { status.textContent+=' Graf se nepodařilo načíst. Použij tabulku níže.'; }
} catch { status.textContent='Spolupráce se nepodařilo načíst. Obnov stránku a zkus to znovu.'; }
