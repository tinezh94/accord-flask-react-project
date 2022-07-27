import os
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room, send
from app.models import Channel, db


if os.environ.get('FLASK_ENV') == 'production':
  origins = [
    'https://accord-flask-react.herokuapp.com/'
  ]
else:
  origins = '*'

socketio = SocketIO(cors_allowed_origins=origins, logger=True, engineio_logger=True)


@socketio.event
def connect():
  sock = request.sid
  print('-------------CONNECTED--------------')
  print('-------------CURRENTLY IN ', sock, '--------------')

@socketio.event
def disconnect():
  print('-------------DISCONNECTED--------------')


@socketio.on('chat')
def handle_chat(data):
  print('-------------DATA--------------\n',
        'data:', data,
        '\n-------------DATA-------------')
  emit('chat', data, to=data['channel'])

# @socketio.on('chat')
# def handle_chat(data):
#   print(data)
#   username = data['username']
#   msg = data['msg']
#   channel = data['channel']
#   # emit('chat', data, broadcast=True)
#   send(username, msg, channel, to=data['channel'])


@socketio.on('join')
def on_join(data):
  print(f'-------------JOINED DATA {data["channel"]}--------------')
  username = data['username']
  channel = data['channel']
  join_room(channel)
  send(username + ' has entered the channel.', to=channel)

@socketio.on('leave')
def on_leave(data):
  print(f'-------------LEFT DATA {data["channel"]}--------------')
  username = data['username']
  channel = data['channel']
  leave_room(channel)
  send(username + ' has left the channel.', to=channel)