const crypto = require('crypto');
const sha256Hash = crypto.createHash('sha256');

class Utils{
	static sha256(str,base64){
		return crypto.createHash('sha256').update(str).digest(base64?'base64':'hex');
	}
}

module.exports = Utils;