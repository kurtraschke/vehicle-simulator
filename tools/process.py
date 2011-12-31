import json
import sys, getpass

from fusiontables.authorization.clientlogin import ClientLogin
from fusiontables.sql.sqlbuilder import SQL
import fusiontables.ftclient as ftclient

import cgpolyencode

from shapely.geometry import Point, MultiPoint

from gtfs import Schedule
from gtfs.entity import Stop, Route

def processAndUpload(schedule, config, paths, stations, ft_client):
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

    stations_out = []
    points = []
    queries = []

    for station in stations:
        stop = Stop.query.get(station)
        stations_out.append({'id': stop.stop_id,
                             'name': stop.stop_name,
                             'x': stop.stop_lon,
                             'y': stop.stop_lat
                             })
        points.append(Point(stop.stop_lon, stop.stop_lat))
        queries.append(SQL().insert(config['tables']['stations'], {'id': str(stop.stop_id),
                                               'name': str(stop.stop_name),
                                               'geometry': str("%s,%s" % (stop.stop_lat, stop.stop_lon))}))

    ft_client.query(";".join(queries))

    convex_hull = MultiPoint(points).convex_hull
    centroid = convex_hull.centroid
    mask_inner = convex_hull.buffer(.05)
    mask_outer = mask_inner.envelope.buffer(.05)

    ft_client.query(SQL().insert(config['tables']['mask'], {'id': 1,
         'geometry': "<Polygon><outerBoundaryIs><LinearRing><coordinates>" +
         " ".join(["%s,%s" % (point[0], point[1]) for point in mask_outer.exterior.coords]) +
         "</coordinates></LinearRing></outerBoundaryIs>" + 
         "<innerBoundaryIs><LinearRing><coordinates>" +
         " ".join(["%s,%s" % (point[0], point[1]) for point in mask_inner.exterior.coords]) +
         "</coordinates></LinearRing></innerBoundaryIs>" +
     "</Polygon>"}))

    return (paths_out, stations_out, centroid)

if __name__=="__main__":
    schedule = Schedule('google_transit.db', echo=False)
    config = json.load(open("config.json"))
    paths = json.load(open("paths.json"))
    stations = json.load(open("stations.json"))

    password = getpass.getpass("Enter your password: ")
    
    token = ClientLogin().authorize(config['user'], password)
    ft_client = ftclient.ClientLoginFTClient(token)

    (paths_out, stations_out, centroid) = processAndUpload(schedule, config, paths, stations, ft_client)

    json.dump(paths_out, open('edges_encoded.js', 'w'), indent=2)
    json.dump(stations_out, open("stations-out.json", "w"), indent=2)
