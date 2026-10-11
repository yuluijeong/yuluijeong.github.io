import {renderDocument} from './render.js';
import {baseline,template} from './sheets-baseline.js';
import {endpoint} from './sheets-config.js';

export function validateData(data) {
  const arrays=['education','research','publications','activities','honors','patents','entrepreneurship','writing','training','skills','projects','news','source-ids'];
  for(const key of arrays)if(!Array.isArray(data?.[key]))throw new Error('Invalid dataset');
  if(!data.profile||!data.authors||!Array.isArray(data.profile.interests)||!Array.isArray(data.profile.links))throw new Error('Invalid profile');
  for(const key of arrays.filter(k=>!['news','source-ids'].includes(k))){
    const ids=new Set();for(const row of data[key]){if(!row.id||ids.has(row.id)||!Array.isArray(row.sourceIds)||!Array.isArray(row.links))throw new Error('Invalid record');ids.add(row.id);}
  }
  for(const p of data.publications)if(!['accepted','review'].includes(p.category)||(p.authors&&(!Array.isArray(p.authors)||!p.authorSource)))throw new Error('Invalid publication');
  function walk(value){if(Array.isArray(value)){value.forEach(walk);return;}if(!value||typeof value!=='object')return;for(const [key,v] of Object.entries(value)){if(['url','profile','authorSource'].includes(key)&&typeof v==='string'&&v&&!/^https:\/\//.test(v)&&!(key==='url'&&/^mailto:[^\s<>"']+$/.test(v)))throw new Error('Invalid URL');if(key==='email'&&!/^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(v))throw new Error('Invalid email');if(key==='target'&&!/^(publications|cv|research|talks|honors|media|contact)\/(#[A-Za-z0-9_-]+)?$/.test(v))throw new Error('Invalid target');walk(v);}}
  walk(data);return data;
}
function readSheet(url){
  return new Promise((resolve,reject)=>{
    const callback='portfolioSheetCallback_'+Math.random().toString(36).slice(2);
    const tag=document.createElement('script');let timer;
    function cleanup(){clearTimeout(timer);tag.remove();delete window[callback];}
    window[callback]=payload=>{cleanup();if(payload?.ok&&payload.schemaVersion===1)resolve(payload.data);else reject(new Error('Unavailable sheet'));};
    tag.onerror=()=>{cleanup();reject(new Error('Unavailable sheet'));};
    timer=setTimeout(()=>{cleanup();reject(new Error('Sheet timeout'));},12000);
    const target=new URL(url);target.searchParams.set('callback',callback);tag.src=target.href;document.head.append(tag);
  });
}
async function refresh(){
  if(!endpoint)return;
  try{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))throw new Error('Invalid endpoint');
    const data=validateData(await readSheet(endpoint));
    const parts=location.pathname.split('/').filter(Boolean),lang=parts[0]==='ko'?'ko':'en';
    if(lang==='ko')parts.shift();const page=parts[0]||'home';
    const next=new DOMParser().parseFromString(renderDocument(data,template,lang,page),'text/html');
    const main=next.querySelector('main'),footer=next.querySelector('footer');
    if(!main||!footer)throw new Error('Invalid render');
    const currentSearch=document.querySelector('#publication-search')?.value||'';
    document.querySelector('main').innerHTML=main.innerHTML;
    document.querySelector('footer').innerHTML=footer.innerHTML;
    document.title=next.title;
    const search=document.querySelector('#publication-search');if(search)search.value=currentSearch;
    window.dispatchEvent(new Event('portfolio:updated'));
    document.documentElement.dataset.contentSource='google-sheet';
    if(location.hash){const anchor=document.getElementById(decodeURIComponent(location.hash.slice(1)));anchor?.scrollIntoView();}
  }catch(error){document.documentElement.dataset.contentSource='static-fallback';}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
