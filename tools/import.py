from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from datetime import date, datetime
from csv import DictReader, DictWriter


from models import metadata, TrainEvent

engine = create_engine("sqlite:///" + "trains-new.db")
Session = sessionmaker(bind=engine)
session = Session()
metadata.bind = engine
metadata.create_all()


dr = DictReader(open("A Division Historical Data May 2011/ATS-Data_2011-05-31.csv"))

serviceDate = date(2011, 05, 31)

for row in dr:
    service_date = row['service_date']
    train_id = row['train_id']
    direction_id = row['direction_id']
    timestamp = row['timestamp']
    event_type = row['event_type']
    route_id = row['route_id']
    stop_id = row['stop_id']
    track_id = row['track_id']

    tr = TrainEvent()
    tr.serviceDate = serviceDate
    tr.trainID = train_id
    tr.routeID = route_id
    tr.stopID = stop_id
    tr.trackID = track_id
    tr.timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")

    if direction_id == '1':
        tr.directionID = 'SOUTH'
    else:
        tr.directionID = 'NORTH'

    if event_type == '1':
        tr.eventType = 'ARRIVAL'
    else:
        tr.eventType = 'DEPARTURE'

    session.add(tr)

session.commit()
