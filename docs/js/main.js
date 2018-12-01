
//https://docs.openaq.org/#api-Locations
//https://github.com/Sumbera/gLayers.Leaflet
var stations_query = "https://api.openaq.org/v1/locations?country=IN"
var measurements_query = "https://api.openaq.org/v1/measurements?location="
var AQSTATIONS = [];
var map = null;
var categories = ["Good (0-50)", "Regular (51-100)",
                     "Bad (101-150)", "Very Bad (151-200)",
					 "Ext. Bad (>200)"];

 
var CITIES = {};

var plasma_st_colors = ["#0D0887", "#7E03A8",
					 "#CB4778", "#F89441", "#F0F921"];

var plasma = ["#0D0887", "#2D0594", "#44039E",
					 "#5A01A5", "#6F00A8", "#8305A7", "#9612A1", "#A72197",
					 "#B7308B", "#C53F7E", "#D14E72", "#DD5E66", "#E76E5B",
					 "#EF7E4F", "#F69044", "#FBA238", "#FEB62D", "#FDCB26",
					 "#F8E225", "#F0F921"];
var color_scale = null;
var pip = function (point, vs) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	var x = point[0], y = point[1];

	var inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		var xi = vs[i][0], yi = vs[i][1];
		var xj = vs[j][0], yj = vs[j][1];

		var intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
};

var drawLegend = function(){
	for (i = 0; i < categories.length; i++) {
		var layer = categories[i];
		var color = plasma_st_colors[i];
		var item = document.createElement('div');
		var key = document.createElement('span');
		key.className = 'legend-key';
		key.style.backgroundColor = color;
	  
		var value = document.createElement('span');
		value.innerHTML = layer;
		item.appendChild(key);
		item.appendChild(value);
		legend.appendChild(item);
	  }
}


var addmap = function () {

	map = new L.Map('map', { zoomControl: false });
	var osmUrl = 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png';
	var osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, { minZoom: 1, maxZoom: 19, attribution: osmAttrib });

	L.control.zoom({
		position: 'bottomleft'
	}).addTo(map);

	// start the map in New delhi
	map.setView(new L.LatLng(28.5272181, 77.068899), 9);
	map.addLayer(osm);

}


var getStations = function () {
	if (typeof (Storage) !== "undefined") {
		var stations = localStorage.getItem("AQSTATIONS");
		if (stations) {
			console.log("Loaded From Cache")
			AQSTATIONS = JSON.parse(stations);
			console.log(AQSTATIONS)
			plotStations()
		}
		else {
			fetchStations(plotStations);
		}

	} else {
		console.log("No web-storage.");
		fetchStations(plotStations);
	}
}

var fetchStations = function (callback) {
	fetch(stations_query)
		.then((resp) => resp.json())
		.then(function (data) {
			console.log("Data fetched from openAQ.")
			if (typeof (Storage) !== "undefined") {
				console.log("Writing to Cache.")
				localStorage.setItem("AQSTATIONS", JSON.stringify(data));
			}
			AQSTATIONS = data;
			if(callback){callback()}
			
		}).catch(function (err) { console.error(err) })
}

var plotStations = function () {

	for (var i = 0; i < AQSTATIONS.results.length; i++) {
		var station = AQSTATIONS.results[i];
		if (!station.coordinates) { continue }
		var coord = [station.coordinates.latitude, station.coordinates.longitude]
		var c = L.circle(coord,400).addTo(map); 
		
		var rectangle = new L.Rectangle(c.getBounds(), {
			color: "black",
			fillColor: color_scale(2),
			fillOpacity: 0.25,
			lineCap: "square",
			lineJoin: "miter"
		});
		map.removeLayer(c)
		rectangle.bindPopup(String( new Date(station.lastUpdated).toLocaleDateString('en-US') + ' </br><b>' +
								   station.location + '</b> (' +
								   station.city +')'), {
									   offset: L.point(0, -2),
									   autoPan: false
								   })
		rectangle.addTo(map);
		rectangle.on('mouseover', function(e) {
			this.openPopup();
		});
		rectangle.on('mouseout', function(e) {
			this.closePopup();
		});
	}

	getCitiesFromStations(AQSTATIONS)
}

function getCitiesFromStations(stations){
	cities = {}
	for (var i = 0; i < AQSTATIONS.results.length; i++) {
		var station = AQSTATIONS.results[i];
		coordinates = station.coordinates;
		city = station.city;
		var loc   = station.location;
		firstUpdated = station.firstUpdated;
		lastUpdated = station.lastUpdated;

		if (coordinates){
			if(city in cities){
				coord = cities[city];
				coord.locations.push(loc)
				cities[city]={
					"minX":Math.min(coordinates.longitude,coord.minX),
					"minY":Math.min(coordinates.latitude,coord.minY),
					"maxX":Math.max(coordinates.longitude,coord.maxX),
					"maxY":Math.max(coordinates.latitude,coord.maxY),
					"locations":coord.locations,
				}
			}
			else{
				cities[city] = {
					"minX":coordinates.longitude,
					"minY":coordinates.latitude,
					"maxX":coordinates.longitude,
					"maxY":coordinates.latitude,
					"locations":[loc]
				}
				
			}
		}

		
	}
	for(city in cities){
		var _city = cities[city];
		var c = [];
		if(_city.minY!=_city.maxY){
			var corner1 = L.latLng(_city.minY, _city.minX);
			var corner2 = L.latLng(_city.maxY, _city.maxX);
			var bounds = L.latLngBounds(corner1, corner2).pad(0.5);
			// var bbox = new L.Rectangle(bounds, {
			// 	color: "black",
			// 	fillColor: color_scale(150),
			// 	fillOpacity: 0.25,
			// 	lineCap: "square",
			// 	lineJoin: "miter"
			// });
			// bbox.addTo(map);
			var ctr = bounds.getCenter();
			c = [ctr.lat,ctr.lng];
		}else{
			c = [_city.minY,_city.minX];
		}
		 if (_city.locations.length>=2){
			var d = document.createElement( 'option' );
			d.value = c;
			d.text = city;
			if(city=="Delhi"){d.selected=true;}
			document.getElementById("ddlCities").appendChild(d);
		 }
		 
	}//end for loop
	 
	CITIES = cities;
}

function citySelected(o){
	var idx = o.selectedOptions[0].text;
	var city = CITIES[idx]; 
	var urls = city.locations.map(x => measurements_query + encodeURIComponent(x)) 
	console.log(urls)
	
	Promise.all(urls.map(
		function(url) {
			return fetch(url).then(function(response) {
			  return response.ok ? response.json() : Promise.reject(response.status);
			})})
	).then(([items]) => {
		   console.log(items)
		   
	  });

	map.flyTo(o.value.split(","),12);
}



onload = function (argument) {

	 color_scale = d3.scale.quantize()
	.domain([0,200])
	.range(plasma);

	addmap();
	drawLegend()
	getStations();

}

