from decimal import *
from datetime import datetime

from sqlalchemy import *
from sqlalchemy.orm import *
from sqlalchemy.ext.declarative import declarative_base

metadata = MetaData()
Base = declarative_base(metadata=metadata)

class TrainEvent(Base):
    __tablename__ = "trainevents"
    id = Column(Integer(), primary_key=True)
    serviceDate = Column(Date())
    trainID = Column(Text())
    directionID = Column(Enum("NORTH", "SOUTH"))
    timestamp = Column(DateTime())
    eventType = Column(Enum("ARRIVAL", "DEPARTURE"))
    routeID = Column(Text())
    stopID = Column(Text())
    trackID = Column(Text())
