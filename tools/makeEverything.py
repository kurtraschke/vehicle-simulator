import json
import sys
import getpass

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from fusiontables.authorization.clientlogin import ClientLogin
import fusiontables.ftclient as ftclient

from gtfs import Schedule

from models import metadata
from createtables import createTables
from generate import generateTrains
from process import processAndUpload

schedule = Schedule('google_transit.db', echo=False)
schedule.session.bind = schedule.engine

engine = create_engine("sqlite:///" + "trains-new.db")
Session = sessionmaker(bind=engine)
session = Session()
metadata.bind = engine


user = sys.argv[1]
password = getpass.getpass("Enter your password: ")
token = ClientLogin().authorize(user, password)
ft_client = ftclient.ClientLoginFTClient(token)

config = createTables(user, ft_client)
(trains_out, stations, paths) = generateTrains(session, schedule)
(paths_out, stations_out, centroid) = processAndUpload(schedule, config, paths.values(), stations, ft_client)

indent = 2

with open("out/trains.json", "w") as trains_file:
    json.dump(trains_out, trains_file, indent=indent)

with open("out/stations.json", "w") as stations_file:
    json.dump(stations_out, stations_file, indent=indent)

with open("out/edges.json", "w") as edges_file:
    json.dump(paths_out, edges_file, indent=indent)

centroid_coords = list(centroid.coords)[0]

sim_config = {'ft_id_mask': config['tables']['mask'],
              'ft_id_lines': config['tables']['paths'],
              'ft_id_stations': config['tables']['stations'],
              'center_start': (centroid_coords[1], centroid_coords[0])}

with open("out/config.json", "w") as config_file:
    json.dump(sim_config, config_file, indent=indent)
