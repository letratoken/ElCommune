const Utils = require("./Utils.js");
class Packet{
	constructor(data,type,ip){
		this.data = data;						//original data
		this.type = type;						//data type
		this.ip	  = ip;							//data generator ip (for e.g. who created the data) to block attackes
		this.time = Date.now();					//first receiving node time
		this.hash = Utils.sha256(typeof(data)=="string"?data:JSON.stringify(data),true);	//sha256 (base64) hash
	}
};
module.exports=Packet;