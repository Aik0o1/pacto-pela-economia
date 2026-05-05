import couchdb
from urllib.parse import quote
import json
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import datetime

# Database connection setup
password = 'sti@JUCEPI_2020'
encoded_password = quote(password)
couch = couchdb.Server(f'http://admin:{encoded_password}@10.40.25.11:5984/')
db_name = 'test2'

if db_name in couch:
    db = couch[db_name]
else:
    print(f"O banco de dados '{db_name}' não existe.")
    exit()

def retorna_data_mais_recente():

    data_mais_atual = datetime.date(2024, 1,1)

    for doc in db:
        # print(doc)
        documento = db[doc]["data"]
        mes_ano = documento.split('/')
        mes = int(mes_ano[0])
        ano = int(mes_ano[1])
        # print("\n", documento)
        new = datetime.date(ano, mes, 1)
        # print(new)
        if new > data_mais_atual:
            data_mais_atual = new

    ano, mes, dia = str(data_mais_atual).split('-')
    
    return (f'{mes}/{ano}')

print(retorna_data_mais_recente())