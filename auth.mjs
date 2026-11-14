import { createHash, timingSafeEqual } from 'node:crypto';
import app from './app.mjs';
const digest=s=>createHash('sha256').update(s).digest();
export async function handleRequest(request, env) {
  const path=new URL(request.url).pathname;
  const admin=path==='/admin'||path.startsWith('/admin/')||path.startsWith('/api/admin/');
  const headers=new Headers(request.headers);
  // Identity headers are trusted only on Sites. Never accept visitor-supplied identity here.
  for(const name of [...headers.keys()]) if(name.startsWith('oai-'))headers.delete(name);
  headers.delete('authorization');
  const runtime={...env, ADMIN_USER_ID:'portable-admin'};
  if(admin){
    let valid=false;
    const auth=request.headers.get('authorization')||'';
    if(env.ADMIN_PASSWORD && auth.startsWith('Basic ')){
      try {
        const decoded=Buffer.from(auth.slice(6),'base64').toString('utf8');
        const index=decoded.indexOf(':');
        valid=index>=0 && timingSafeEqual(digest(decoded.slice(0,index)),digest(env.ADMIN_USERNAME||'admin')) && timingSafeEqual(digest(decoded.slice(index+1)),digest(env.ADMIN_PASSWORD));
      } catch {}
    }
    if(!valid)return new Response('تسجيل دخول المدير مطلوب',{status:401,headers:{'WWW-Authenticate':'Basic realm="Koora Arena Admin", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    headers.set('oai-authenticated-user-id','portable-admin');
  }
  const clean=new Request(request,{headers});
  const response=await app.fetch(clean,runtime);
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','no-referrer');
  if(admin){response.headers.set('Cache-Control','no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');}
  return response;
}
