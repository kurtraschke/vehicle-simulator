import json
import sys, getpass

from fusiontables.authorization.clientlogin import ClientLogin
from fusiontables.sql.sqlbuilder import SQL
import fusiontables.ftclient as ftclient


def createTables(user, ft_client):
    config = {'user': user, 'tables': {}}


    
    table = {'stations':{'id':'STRING', 'name':'STRING', 'geometry':'LOCATION'}}
    config['tables']['stations'] = int(ft_client.query(SQL().createTable(table)).split("\n")[1])
    
    table = {'paths':{'id':'STRING', 'length':'NUMBER', 'geometry':'LOCATION', 'type': 'STRING'}}
    config['tables']['paths'] = int(ft_client.query(SQL().createTable(table)).split("\n")[1])
    
    table = {'mask':{'id':'STRING', 'geometry':'LOCATION'}}
    config['tables']['mask'] = int(ft_client.query(SQL().createTable(table)).split("\n")[1])
    return config

if __name__=="__main__":
    user = sys.argv[1]
    password = getpass.getpass("Enter your password: ")
    token = ClientLogin().authorize(config['user'], password)
    ft_client = ftclient.ClientLoginFTClient(token)

    config = createTables(user, ft_client)
    json.dump(config, open('config.json', 'w'))
