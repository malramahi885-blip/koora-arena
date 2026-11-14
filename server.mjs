import http from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { handleRequest } from './auth.mjs';
const port=Number(process.env.PORT||3000);
const server=http.createServer(async(req,res)=>{
 const controller=new AbortController();res.on('close',()=>controller.abort());
 try{
  const request=new Request(new URL(req.url,'https://app.invalid'),{method:req.method,headers:req.headers,signal:controller.signal});
  const response=await handleRequest(request,process.env);
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)await pipeline(Readable.fromWeb(response.body),res);else res.end();
 }catch{
  if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
  if(!res.destroyed)res.end('تعذر إكمال الطلب');
 }
});
server.listen(port,'0.0.0.0',()=>console.log('Koora Arena server ready'));
