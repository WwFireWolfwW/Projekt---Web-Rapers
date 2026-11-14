import { getClient } from './api.js';
import { element } from './data.js';
export function authError(error) {
 const messages={invalid_credentials:'Nesprávný e-mail nebo heslo.',email_not_confirmed:'Nejdřív potvrď e-mail odkazem v doručené zprávě.',user_already_exists:'Účet s tímto e-mailem již existuje.',weak_password:'Zvol silnější heslo.',over_email_send_rate_limit:'Bylo odesláno příliš mnoho zpráv. Zkus to později.',over_request_rate_limit:'Příliš mnoho požadavků. Zkus to později.',signup_disabled:'Registrace je nyní vypnutá.'};
 return messages[error?.code] || 'Požadavek se nezdařil. Zkontroluj připojení a zkus to znovu.';
}
export async function currentUser(){const client=await getClient();const {data,error}=await client.auth.getUser();if(error&&error.name!=='AuthSessionMissingError')throw error;return data.user;}
export async function requireUser(){const user=await currentUser();if(!user)throw new Error('Pro tuto akci se přihlas.');return user;}
export async function isAdmin(){const user=await currentUser();if(!user)return false;const {data,error}=await(await getClient()).from('profiles').select('role').eq('id',user.id).single();if(error)throw error;return data.role==='admin';}
export async function authHeader(){const target=document.querySelector('.site-tools');if(!target)return;const link=element('a','button','Přihlášení');link.href='login.html';target.append(link);try{const client=await getClient();const update=session=>{link.textContent=session?.user?'Můj účet':'Přihlášení';document.dispatchEvent(new CustomEvent('wiki-auth',{detail:session?.user||null}));};const {data,error}=await client.auth.getSession();if(error)throw error;update(data.session);client.auth.onAuthStateChange((_event,session)=>update(session));}catch{link.textContent='Přihlášení (nedostupné)';}}
