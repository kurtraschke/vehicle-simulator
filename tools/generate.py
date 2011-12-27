from datetime import date, datetime
from itertools import izip_longest
from collections import OrderedDict

import json

from sqlalchemy import create_engine, distinct, not_, and_
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.exc import NoResultFound

from gtfs import Schedule
from gtfs.entity import Stop, Route

from models import metadata, TrainEvent

schedule = Schedule('google_transit.db', echo=False)

engine = create_engine("sqlite:///" + "trains-new.db")
Session = sessionmaker(bind=engine)
session = Session()
metadata.bind = engine

schedule.session.bind = schedule.engine

serviceDate = date(2011, 05, 31)


def grouper(n, iterable):
    args = [iter(iterable)] * n
    return [l for l in izip_longest(fillvalue=None, *args)]

paths = {}
pathid = 1

def pathbetween(origin, destination):
    #print origin, destination
    if (origin, destination) in paths.keys():
        return paths[(origin, destination)]['id']
    elif (destination, origin) in paths.keys():
        return '-' + paths[(destination, origin)]['id']

    #FIXME: there are almost always multiple shapes; which one is right?
    result = schedule.session.query("shape_id", "origin_seq", "dest_seq").from_statement("""
    select sp1.shape_id as shape_id,
    sp1.shape_pt_sequence as origin_seq,
    sp2.shape_pt_sequence as dest_seq
    from stops st1, stops st2, shapes sp1, shapes sp2
    where
        sp1.shape_id = sp2.shape_id
    and st1.stop_id = :origin_stop_id
    and st2.stop_id = :dest_stop_id
    and st1.stop_lat = sp1.shape_pt_lat and st1.stop_lon = sp1.shape_pt_lon
    and st2.stop_lat = sp2.shape_pt_lat and st2.stop_lon = sp2.shape_pt_lon
    and sp2.shape_pt_sequence > sp1.shape_pt_sequence
    """).params(origin_stop_id=origin, dest_stop_id=destination).first()

    (shape_id, origin_seq, dest_seq) = result

    points = schedule.session.query("shape_pt_lon", "shape_pt_lat").from_statement("""
    select shape_pt_lat, shape_pt_lon
    from shapes
    where shape_pt_sequence >= :origin_seq
    and shape_pt_sequence <= :dest_seq
    and shape_id = :shape_id
    order by shape_pt_sequence asc
    """).params(origin_seq=origin_seq, dest_seq=dest_seq, shape_id=shape_id).all()

    pathid = len(paths) + 1
    paths[(origin, destination)] = {'points': points, 'id': str(pathid)}
    return paths[(origin, destination)]['id']

trains = [t for (t,) in session.query(TrainEvent.trainID)
                               .filter(TrainEvent.timestamp >= datetime(2011, 05, 31, 8, 0, 0))
                               .filter(TrainEvent.timestamp <= datetime(2011, 05, 31, 8, 30, 0))
                               .group_by(TrainEvent.trainID).all()]

trains_out = []

allstations = set()

tid = 1

for train in trains:
    #print train
    stations = session.query(distinct(TrainEvent.stopID)) \
                      .filter(TrainEvent.trainID==train) \
                      .order_by(TrainEvent.timestamp.asc()) \
                      .all()

    def getArrivalTime(trainID, stopID):
        try:
            (t, ) = session.query(TrainEvent.timestamp) \
                   .filter(TrainEvent.trainID==trainID) \
                   .filter(TrainEvent.stopID==stopID) \
                   .filter(TrainEvent.eventType=='ARRIVAL') \
                   .one()
            return t
        except NoResultFound:
            return None

    def getDepartureTime(trainID, stopID):
        try:
            (t, ) = session.query(TrainEvent.timestamp) \
                    .filter(TrainEvent.trainID==trainID) \
                    .filter(TrainEvent.stopID==stopID) \
                    .filter(TrainEvent.eventType=='DEPARTURE') \
                    .one()
            return t
        except NoResultFound:
            return None

    def getRouteID(trainID):
        (r, ) = session.query(TrainEvent.routeID) \
                .filter(TrainEvent.trainID==trainID) \
                .first()
        return r

    stationtimes = OrderedDict()

    for station in stations:
        (station,) = station
        arrival = getArrivalTime(train, station)
        departure = getDepartureTime(train, station)
        stationtimes[station] = {'arrival': arrival, 'departure': departure}
        
    #Stops other than the first and last must have both an arrival and departure time.
    for station in stationtimes.keys()[1:-1]:
        if stationtimes[station]['arrival'] is None or stationtimes[station]['departure'] is None:
            print "Removing station %s from train %s" %  (station, train)
            del stationtimes[station]

    stations = []
    arrivals = []
    departures = []
    
    if len(stationtimes.keys()) < 2:
        print "Train %s has fewer than 2 stops, ignoring" % train
        continue

    firststop = stationtimes.keys()[0]
    rest = stationtimes.keys()[1:-1]
    laststop = stationtimes.keys()[-1]

    #process first stop

    if stationtimes[firststop]['departure'] is None:
        print "Train %s did not have a departure time for first stop %s" % (train, firststop)
        firststop = rest[0]
        rest = rest[1:]

    stations.append(firststop)
    departures.append(stationtimes[firststop]['departure'])

    for stopID in rest:
        stations.append(stopID)
        arrivals.append(stationtimes[stopID]['arrival'])
        departures.append(stationtimes[stopID]['departure'])

    #process last stop
    stations.append(laststop)
    arrivals.append(stationtimes[laststop]['arrival'])


    arrivals = [int((a - datetime(*serviceDate.timetuple()[:-3])).total_seconds()) for a in arrivals]

    departures = [int((d - datetime(*serviceDate.timetuple()[:-3])).total_seconds()) for d in departures]

    edges = [""]
    laststation = stations[0]
    for station in stations[1:]:
        try:
            edges.append(pathbetween(laststation, station))
        except Exception, e:
            print "Could not find a path between %s and %s for train %s" (laststation, station, train)
            raise
        laststation = station

    allstations |= set(stations)

    trains_out.append({'id': str(tid),
                       'name': train,
                       'type': getRouteID(train),
                       'sts': stations,
                       'deps': departures,
                       'arrs': arrivals,
                       'edges': edges})
    tid += 1

json.dump(trains_out, open("trains.json", "w"), indent=2)
json.dump(list(allstations), open("stations.json", "w"), indent=2)
json.dump(paths.values(), open("paths.json", "w"), indent=2)
