from datetime import date, datetime
from itertools import izip_longest

import json

from sqlalchemy import create_engine, distinct, not_, and_
from sqlalchemy.orm import sessionmaker

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


blacklist = ['03 1225  148/NLT', '04 2327+ NLT/WDL', 'E4 1541  MOT/WDL']
trains = [t for (t,) in session.query(TrainEvent.trainID)
                               #.filter(not_(TrainEvent.trainID.in_(blacklist)))
                               .filter(TrainEvent.timestamp >= datetime(2011, 05, 31, 8, 0, 0))
                               .filter(TrainEvent.timestamp <= datetime(2011, 05, 31, 8, 30, 0))
                               .group_by(TrainEvent.trainID).all()]

trains_out = []

allstations = set()

tid = 1

for train in trains:
    #print train
    """badStops = ['204', '501', '201'] # 
    stations = session.query(distinct(TrainEvent.stopID)) \
                      .filter(TrainEvent.trainID==train) \
                      #.filter(not_(TrainEvent.stopID.in_(['902']))) \
                      .order_by(TrainEvent.timestamp.asc()) \
                      .all()"""

    stations = []
    arrivals = []
    departures = []

    events = session.query(TrainEvent) \
                    .filter(TrainEvent.trainID==train) \
                    .order_by(TrainEvent.timestamp.asc()) \
                    .all()

    if len(events) < 2:
        continue


    firstEvent = events[0]
    rest = events[1:]


    if events[1].eventType == 'DEPARTURE':
        firstEvent = events[1]
        rest = events[2:]

    #process first event
    stations.append(firstEvent.stopID)
    departures.append(firstEvent.timestamp)

    expectedType = 'ARRIVAL'
    trainDirection = firstEvent.directionID

    for event in rest:
        if event.eventType == expectedType:
            if event.eventType == 'ARRIVAL':
                stations.append(event.stopID)
                arrivals.append(event.timestamp)
                expectedType = 'DEPARTURE'
            elif event.eventType == 'DEPARTURE':
                departures.append(event.timestamp)
                expectedType = 'ARRIVAL'
        else:
            if event.directionID != trainDirection:
                continue
            else:
                print train
                continue



    """stations = [s for (s,) in stations]

    if stations[0] in ('204', '501', '201'):
        stations = stations[1:]"""

    arrivals = [int((a - datetime(*serviceDate.timetuple()[:-3])).total_seconds()) for a in arrivals]

    departures = [int((d - datetime(*serviceDate.timetuple()[:-3])).total_seconds()) for d in departures]

    #assert (len(stations) - 1) == len(arrivals) == len(departures), (train, len(stations), len(arrivals), len(departures), stations, arrivals, departures, firstStop, lastStop)

    edges = [""]
    laststation = stations[0]
    for station in stations[1:]:
        try:
            edges.append(pathbetween(laststation, station))
        except Exception, e:
            print laststation, station
            print train
            raise
        laststation = station

    allstations |= set(stations)

    trains_out.append({'id': str(tid),
                       'name': train,
                       'type': firstEvent.routeID,
                       'sts': stations,
                       'deps': departures,
                       'arrs': arrivals,
                       'edges': edges})
    tid += 1

json.dump(trains_out, open("trains.json", "w"), indent=2)
json.dump(list(allstations), open("stations.json", "w"), indent=2)
json.dump(paths.values(), open("paths.json", "w"), indent=2)
