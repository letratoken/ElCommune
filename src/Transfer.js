const querystring=require('querystring');
const HTTP=require('http');
const HTTPS=require('https');
const FS=require('fs');
const URL=require('url');

//HTTP(s) Transfer Data
function HTransfer(_url,request_type,data,callback,ref){
  //Log("Requesting: "+_url);
  //if(callback && ref) callback.refObject=ref;
  try{
    var url=URL.parse(_url);
    var protocol=url.protocol.toLowerCase()=="http:"?HTTP:HTTPS;
    if(data){
      data=querystring.stringify(data);
    }
    var options={
      host:url.hostname,
      port: url.port?url.port:(url.protocol.toLowerCase()=='http:'?'80':'443'),
      path: url.path,
      method: request_type
    };
    //console.log(options);
    if(request_type.toUpperCase()=="POST" && data){
      options.headers={
        'Content-Type':'application/x-www-form-urlencoded',
        'Content-Length':Buffer.byteLength(data)
      };
    }
    var req=protocol.request(options,function(res){
      res.setEncoding('utf8');
      var result="";
      res.on('data',function(chunk){
        result+=chunk;
      });
      res.on('end',function(){
        if(callback)callback(result,ref);
      });
      res.on('error',function(error){
        console.log(error);
        if(callback)callback(null,ref);
      });
    });
    req.on('error',function(error){
      console.log(error);
      if(callback)callback(null,ref);
    });
    if(request_type.toUpperCase()=="POST" && data){
      req.write(data);
    }
    req.end();
  }catch(ex){
    console.log('Connection error');
    if(callback)callback(null,ref);
  }
};

exports.htransfer = HTransfer;