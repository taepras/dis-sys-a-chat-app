module.exports = {
	indexOfRid: function(ridJoined, rid){
		for(var i = 0 ; i < ridJoined.length ; i++)
			if(rid === ridJoined[i].rid)
				return i;
		return -1;
	}
};
