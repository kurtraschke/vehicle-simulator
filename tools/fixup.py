from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import and_, or_, not_, exists, distinct

from models import metadata, TrainEvent


engine = create_engine("sqlite:///" + "trains-new.db", echo=True)
Session = sessionmaker(bind=engine)
session = Session()
metadata.bind = engine

trainevents = TrainEvent.__table__

session.execute(trainevents.update().where(and_(trainevents.c.stopID==902, trainevents.c.routeID.in_((2,3)))).values(stopID=127))
session.execute(trainevents.update().where(trainevents.c.routeID=='NA').values(routeID='GS'))

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
