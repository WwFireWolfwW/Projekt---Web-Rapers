import { getClient } from './api.js';
import { authError, currentUser } from './auth.js';
const form=document.querySelector('#auth-form'),status=document.querySelector('#auth-status'),signout=document.querySelector('#signout');
async function refresh(){try{const user=await currentUser();form.hidden=!!user;signout.hidden=!user;status.textContent=user?'Jsi přihlášen/a.':'Přihlas se nebo si vytvoř účet.';}catch{status.textContent='Přihlašovací služba není dostupná. Zkus stránku obnovit.';}}
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const action=event.submitter.value;const email=form.elements.email.value.trim(),password=form.elements.password.value;const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);status.textContent='Odesílání…';try{const client=await getClient();const {data,error}=action==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:new URL('login.html',location.href).href}}):await client.auth.signInWithPassword({email,password});if(error)throw error;form.reset();await refresh();if(action==='signup'&&!data.session)status.textContent='Pokud lze registraci dokončit, obdržíš e-mail. Potvrď v něm svůj účet a potom se přihlas.';}catch(error){status.textContent=authError(error);}finally{buttons.forEach(b=>b.disabled=false);form.elements.password.value='';}});
signout.addEventListener('click',async()=>{signout.disabled=true;try{const {error}=await(await getClient()).auth.signOut();if(error)throw error;await refresh();}catch(error){status.textContent=authError(error);}finally{signout.disabled=false;}});
refresh();

import { isAdmin } from "./auth.js";
import { element } from "./data.js";
try { if(await isAdmin()){const link=element("a","button","Administrace");link.href="admin.html";document.querySelector("#obsah").append(link);} } catch {}
