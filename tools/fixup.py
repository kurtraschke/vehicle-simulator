from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import and_, or_, not_, exists, distinct

from models import metadata, TrainEvent


engine = create_engine("sqlite:///" + "trains-new.db", echo=True)
Session = sessionmaker(bind=engine)
session = Session()
metadata.bind = engine

trainevents = TrainEvent.__table__

#Some 2 and 3 trains contain a spurious stop at the 42nd St shuttle platform,
#which should actually be the mainline platform (and no revenue trains use
#the connection between the mainline platform and the shuttle).

session.execute(trainevents.update().where(and_(trainevents.c.stopID==902, trainevents.c.routeID.in_((2,3)))).values(stopID=127))

#42nd St. Shuttle trains are not identified in the data,
#but they reliably have a route ID of 'NA' (and are the
#only trains to use that route ID).

session.execute(trainevents.update().where(trainevents.c.routeID=='NA').values(routeID='GS'))

#6 Express trains are not identified in the data.  This heuristic identifies them
#on the assumption that they will be on the middle (express) track at the three
#stations served by the express, but it could be made more specific
#(by checking that the time and direction of service are appropriate for the 6X, for example).

te = TrainEvent.__table__.alias('te1')
te2 = TrainEvent.__table__.alias('te2')

q = session.query(te.c.trainID).filter(
    not_(exists().where(
        and_(te2.c.trackID != '0M',
             te2.c.stopID.in_(('608', '613', '619')),
             te2.c.trainID==te.c.trainID
             )
        )
         )
).filter(te.c.routeID=='6').as_scalar()

session.execute(trainevents.update().where(trainevents.c.trainID.in_(q)).values(routeID='6X'))

session.commit()
