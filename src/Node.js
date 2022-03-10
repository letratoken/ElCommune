const {htransfer} = require("./Transfer.js");
const Utils = require("./Utils.js");
const ht = htransfer;

class Node{
	constructor(id,ip,port,type,connectionsTotal,name,maxConnections){
		this.id=id; this.ip=ip; this.port=port; this.type=type;
		this.connectionsTotal=connectionsTotal; this.name=name;
		this.ttl=0; this.maxConnections = maxConnections;
	}
	static getUrl(node){
		return "http://"+node.ip+":"+node.port;
	}
	//static elements
	static keepNodes=false;
	static nodeList = {};
	static connections = [];
	static currentNode = null;
	static inspectors = {}; //list of verifiers and inspectors by type
	static dataQue = {};
	//static functions
	static get(id){
		if(Node.nodeList[id])return Node.nodeList[id];
		return null;
	}
	static toString(node){
		var ret = "id - name(type) -> ip:port [connectionsTotal]";
		var keys = Object.keys(node);
		for(var i=0;i<keys.length;i++){
			if(keys[i]=='id'){
				var l = node.id.length;
				var id = node.id.substring(0,3)+"..."+node.id.substring(l-3,l);
				ret = ret.replace("id",id);
			}
			else ret = ret.replace(keys[i],node[keys[i]]);
		}
		return ret;
	}
	//[HTTP] get a node informations ping ms, connections total,....
	static getInfo(node,callback){
	}
	
	
	//generate unique id for a new node
	static generateUID(){
		return Utils.sha256(Math.random()+'-'+Date.now());
	}
	//[SOCKET] check the other node has the data
	static hasData(node,packet,callback){
		var url = Node.getUrl(node)+"/api/node/hasData";
		var data = {hash:packet.hash};
		ht(url,"POST",data,callback);
	}
	//[SOCKET] send the data to the other node
	static request(node,path,data,callback){
		var url = Node.getUrl(node)+path;
		ht(url,"POST",data,callback);
	}
	static requestAll(path,data,callback){
		for(var i=0;i<Node.nodeList.length;i++)
			Node.request(Node.nodeList[i],path,data,callback);
	}
	static send(node,packet,callback){
		var url = Node.getUrl(node)+"/api/node/data";
		var data = {packet:JSON.stringify(packet),sender:Node.currentNode.id};
		ht(url,"POST",data,callback);
	}
	//[] data available
	static dataAvailable(hash){
		if(Node.dataQue[hash]) return true;
		else return false;
	}
	//[] store data
	static propagate(packet,sender_id){
		if(Node.inspectors[packet.type]){
			if(typeof(Node.dataQue[packet.hash])=="undefined"){
				Node.inspectors[packet.type].verify(packet,function(verified,msgs){
					if(verified){
						Node.dataQue[packet.hash] = packet;
						//console.log(packet);
						var node=null;
						for(var i=0;i<Node.connections.length;i++){
							node = Node.get(Node.connections[i]);
							if(node.id!=sender_id){
								Node.uniqueSend(node,packet);
							}
						}
						console.log(`[[The new packet ${packet.hash} accepted!]]\n`);
					}else{
						if(msgs)console.log(msgs);
						console.log('invalid packet data. (The inspector rejected it)\n');
					}
				});
			}else console.log(`packet hash exists ${packet.hash}`);
		}else console.log(`inspector is not available for type ${packet.type}`);
	}
	//[SOCKET] send if the other node hasn't the data packet
	static uniqueSend(node,packet,callback){
		Node.hasData(node,packet,function(result){
			if(result<=0){
				Node.send(node,packet,callback);
			}
		});
	};
	//request to connect
	static requestConnect(node){
		var url = Node.getUrl(node)+"/api/node/confirmConnection";
		console.log(url);
		var data = {node:JSON.stringify(Node.currentNode)};
		ht(url,"POST",data,function(result){
			var target_node = JSON.parse(result);
			if(result){
				// var updated=false;
				// for(var i=0;i<Node.nodeList.length;i++){
				// 	if(Node.nodeList[i].id==target_node.id){
				// 		Node.nodeList[i]=target_node; //update existing node
				// 		updated=true;
				// 	}
				// }
				// if(!updated) Node.nodeList.push(target_node);
				Node.nodeList[target_node.id]=target_node;
				if(Node.connections.indexOf(target_node.id)<0)
					Node.connections.push(target_node.id);
				console.log("Connection to "+Node.getUrl(node)+" was successful.");
			}else console.log("Connection to "+Node.getUrl(node)+" was faild.");
		});
	}
	//confirm connection
	static confirmConnection(node,http_response){
		console.log(Node.currentNode);
		if(Node.connections.length<Node.currentNode.maxConnections){
			if(Node.get(node.id)){
				console.log('node available in list');
			}else{
				console.log('new node has been added');
				Node.nodeList[node.id]=node;
			}
			if(Node.connections.indexOf(node.id)<0)Node.connections.push(node.id);

			if(http_response){
				http_response.write(JSON.stringify(Node.currentNode));
				http_response.end();
				return;
			}
		}
		http_response.write('null');
		http_response.end();
	}
	//request disconnect
	static requestDisconnect(){

	}
	//
	static getNodes(){ return Object.values(Node.nodeList); }
	//update node list
	static updateNodeList(){
		console.log("updating node list.... @"+parseInt(Date.now()/1000));
		for(var i=0;i<Node.connections.length;i++){
			var node = Node.get(Node.connections[i]);
			if(node){
				var url= Node.getUrl(node)+"/api/node/list";
				ht(url,"GET",null,function(res){
					var ls = JSON.parse(res);
					if(ls){
						for(var j=0;j<ls.length;j++){
							Node.nodeList[ls[j].id]=ls[j];
						}
					}
				});
			}
		}
	}

}

module.exports = Node;