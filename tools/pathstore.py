class PathStore(object):
    paths = {}
    session = None

    def __init__(self, schedule):
        self.schedule = schedule

    def pathbetween(self, origin, destination):
        #print origin, destination
        if (origin, destination) in self.paths.keys():
            return self.paths[(origin, destination)]['id']
        elif (destination, origin) in self.paths.keys():
            return '-' + self.paths[(destination, origin)]['id']
        
        points = self.schedule.session.query("shape_pt_lon", "shape_pt_lat").from_statement("""
        select s.shape_pt_lat as shape_pt_lat, s.shape_pt_lon as shape_pt_lon
        from shapes s, (select sp1.shape_id as shape_id,
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
        limit 1) sp
        where s.shape_pt_sequence >= sp.origin_seq
        and s.shape_pt_sequence <= sp.dest_seq
        and s.shape_id = sp.shape_id
        order by s.shape_pt_sequence asc""").params(origin_stop_id=origin,
                                                    dest_stop_id=destination).all()

        pathid = len(self.paths) + 1
        self.paths[(origin, destination)] = {'points': points, 'id': str(pathid)}
        return self.paths[(origin, destination)]['id']
