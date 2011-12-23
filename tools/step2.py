import json
import sys, getpass

from fusiontables.authorization.clientlogin import ClientLogin
from fusiontables.sql.sqlbuilder import SQL
import fusiontables.ftclient as ftclient

import cgpolyencode

from shapely.geometry import Point, MultiPoint

from gtfs import Schedule
from gtfs.entity import Stop, Route

schedule = Schedule('google_transit.db', echo=False)
config = json.load(open("config.json"))
paths = json.load(open("paths.json"))

password = getpass.getpass("Enter your password: ")

token = ClientLogin().authorize(config['user'], password)
ft_client = ftclient.ClientLoginFTClient(token)

for table_id in config['tables'].values():
    ft_client.query("DELETE FROM %d" % (table_id))

encoder = cgpolyencode.GPolyEncoder()

paths_out = {}
queries = []

for path in paths:
    id = path['id']
    points = path['points']
    paths_out[id] = encoder.encode(points)['points']
    queries.append(SQL().insert(config['tables']['paths'], {'id': str(path['id']),
     'length': 0,
     'geometry': "<LineString><coordinates>" +
     " ".join(["%s,%s" % (point[0], point[1]) for point in points]) + 
     "</coordinates></LineString>",
     'type': "normal"}));

ft_client.query(";".join(queries))
json.dump(paths_out, open('edges_encoded.js', 'w'), indent=2)

stations = json.load(open("stations.json"))

stations_out = []
points = []
queries = []
station_x = []
station_y = []

for station in stations:
    stop = Stop.query.get(station)
    stations_out.append({'id': stop.stop_id,
                         'name': stop.stop_name,
                         'x': stop.stop_lon,
                         'y': stop.stop_lat
                         })
    station_x.append(stop.stop_lon)
    station_y.append(stop.stop_lat)
    points.append(Point(stop.stop_lon, stop.stop_lat))
    queries.append(SQL().insert(config['tables']['stations'], {'id': str(stop.stop_id),
                                           'name': str(stop.stop_name),
                                           'geometry': str("%s,%s" % (stop.stop_lat, stop.stop_lon))}))

ft_client.query(";".join(queries))
json.dump(stations_out, open("stations-out.json", "w"), indent=2)

outer = MultiPoint([Point(min(station_x), min(station_y)), Point(min(station_x), max(station_y)),
                    Point(max(station_x), max(station_y)), Point(max(station_x), min(station_y))]).convex_hull

convex_hull = MultiPoint(points).convex_hull.buffer(.05)

#outer = convex_hull.envelope

ft_client.query(SQL().insert(config['tables']['mask'], {'id': 1,
     'geometry': "<Polygon><outerBoundaryIs><LinearRing><coordinates>" +
     " ".join(["%s,%s" % (point[0], point[1]) for point in convex_hull.envelope.buffer(.05).exterior.coords]) +
     "</coordinates></LinearRing></outerBoundaryIs>" + 
     "<innerBoundaryIs><LinearRing><coordinates>" +
     " ".join(["%s,%s" % (point[0], point[1]) for point in convex_hull.exterior.coords]) +
     "</coordinates></LinearRing></innerBoundaryIs>" +
     "</Polygon>"}))

