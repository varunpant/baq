

var stations_query ="https://api.openaq.org/v1/locations?country=IN"

var addmap = function(){

	var map = new L.Map('map');
	var osmUrl='http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 19, attribution: osmAttrib});		

	// start the map in New delhi
	map.setView(new L.LatLng(28.5272181,77.068899),9);
	map.addLayer(osm);

}


var plotStations = function(){
	
	fetch(stations_query)
	.then((resp) => resp.json())
	.then(function(data) {
	  console.log(data)
	
	}).catch(function(err){console.error(err)})
	
}


onload = function(argument) {
	
	addmap();
	plotStations();
}

