
const express=require('express');
const cors=require('cors');
const {randomUUID}=require('crypto');
const app=express();
app.use(cors());
app.use(express.json());

// Health
app.get('/healthz',(req,res)=>res.json({ok:true,service:'mcp-sse-adapter',uptime:process.uptime()}));

// SSE pool for server -> client push
const clients=new Set();
function sseSend(res,event,data){
  res.write(`event: ${event}
`);
  res.write(`data: ${JSON.stringify(data)}

`);
}

// SSE stream (GET)
app.get('/sse',(req,res)=>{
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
  res.flushHeaders?.();
  clients.add(res);
  sseSend(res,'open',{id:randomUUID(),ts:Date.now()});
  let i=0;
  const iv=setInterval(()=>sseSend(res,'ping',{i:i++,ts:Date.now()}),15000);
  req.on('close',()=>{clearInterval(iv);clients.delete(res);});
});

// JSON-RPC 2.0 over HTTP (helper)
function jsonrpcHandler(req,res){
  const {id=null,method,params={}}=req.body||{};
  const err=(code,message)=>res.json({jsonrpc:'2.0',id,error:{code,message}});
  if(!method) return err(-32600,'Invalid Request');
  if(method==='initialize'){
    return res.json({jsonrpc:'2.0',id,result:{
      protocolVersion:'2024-11-05',
      serverInfo:{name:'mcp-sse-adapter',version:'0.2.0'},
      capabilities:{tools:{}}
    }});
  }
  if(method==='tools/list'){
    return res.json({jsonrpc:'2.0',id,history:false,result:{
      tools:[{name:'ping',description:'Return pong',inputSchema:{type:'object',properties:{}}}]
    }});
  }
  if(method==='tools/call'){
    if(params?.name==='ping'){
      for(const c of clients) sseSend(c,'note',{tool:'ping',ts:Date.now()});
      return res.json({jsonrpc:'2.0',id,result:{content:[{type:'text',text:'pong'}],isError:false}});
    }
    return err(-32601,'Unknown tool');
  }
  return err(-32601,'Method not found');
}

// JSON-RPC on /rpc (explicit)
app.post('/rpc', jsonrpcHandler);
// JSON-RPC alias on /sse (some clients POST to SSE URL)
app.post('/sse', jsonrpcHandler);

const port=process.env.PORT||8787;
app.listen(port,()=>console.log(`[mcp-sse-adapter] listening on ${port}`));
