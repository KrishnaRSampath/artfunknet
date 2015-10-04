var max_chunk = .1;
var chunk_exponent = .9;
var starting_xp  = 100;
var xp_exponent = 1.3;
var max_level = 50;

getXPChunk = function(current_level) {
	var effective_level = current_level - 1;
	var chunk_percentage = max_chunk * (Math.pow(chunk_exponent, effective_level));
	return Math.floor(chunk_percentage * getXPGoal(current_level));
}

getXPGoal = function(current_level) {
	var effective_level = current_level - 1;
	return Math.floor(starting_xp * (Math.pow(xp_exponent, effective_level)));
}