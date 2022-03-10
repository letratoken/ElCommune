class Inspector{
	constructor(node_class,config){
		this.node_class=node_class;
		this.config=config;
	}
	start(){
		
	}
	verify(packet,callback){
		callback(true);
	}
	connected(){
		
	}

}

module.exports = Inspector;