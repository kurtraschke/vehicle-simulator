cp trains.json ../api/vehicles/trains.json
cp stations-out.json ../api/stations.json
echo "var simcity_topology_edges = " > ../static/js/edges_encoded-nyct.js
cat edges_encoded.js >> ../static/js/edges_encoded-nyct.js
