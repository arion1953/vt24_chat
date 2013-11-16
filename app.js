var port = process.env.PORT || 3000;
var express = require('express');
var twitter = require('ntwitter');
var app = express();
var path = require('path');
var twit = new twitter({
  consumer_key: 'pTgD0yoWOmUbCqSuNe6ekQ',
  consumer_secret: 'VTqHMkpN9G8vuwuBz6BYwxpsmzYt7JKS2l20BZpOo',
  access_token_key: '85274998-oSmsYWn7Swzhd47DVBBpCRFbDR2IZmv441V5OiPk5',
  access_token_secret: 'jds0PQ16zEOENlzf5UvbNKvCoJuPYwAKgJsy7RPghjtNu'
});
app.use(express.static(path.join(__dirname, 'public')));
// dos arrays, uno para los nicknames solo y el otro bidimensional
// con lahora de conexion
var nicknames = [];
// array para guardar los 20 ultimos mensajes que se mostraran al iniciar sesion
var mensajes = [];
// function to search in array if user is connected
function connFunction(loginnick) {
  if (nicknames.length > 0) {
    for (var i = 0; i < nicknames.length; i++) {
      if (nicknames[i][0] == loginnick) {
        return [i];
      };
    }
  };
  return -1;
};
// function to save the last 20 messages in array mensajes
function insMsgArray(insnick, insdata, instime) {
  // limitamos mensajes guardados a 20
  if (mensajes.length == 20 ) {
    mensajes.splice(0, 1);
  };
  var arraymsg = new Array();
      arraymsg[0] = insnick;
      arraymsg[1] = insdata;
      arraymsg[2] = instime;
  mensajes.push(arraymsg);
}
// Staring server
var server = require('http').createServer(app);
server.listen(port);
console.log('Express Server  - Listening on port ' + port);
var io = require('socket.io').listen(server,  { log: false });
console.log('Socket IO - Listening on server ' + port);
// enviamos index.html al cliente
app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});
// recibimos una connexion del cliente
// la establecemos y le enviamos una comunicacion
io.sockets.on('connection', function (socket) {
  socket.emit('comunicacion', { idcom: 1 });
  socket.emit('usuarios', { nickdata: nicknames, sound: 'no' });
  // enviamos mensajes actuales a la nueva conexion
  for (var i = 0; i < mensajes.length; i++) {
    socket.emit('newmessage', { nick: mensajes[i][0], text: mensajes[i][1], time: mensajes[i][2] });
  };
  // recibimos el nick con el que se ha identificado el cliente
  socket.on('nickname', function (data) {
    // array bidimensional para guardar hora de conexion
    // test uf user is already connected
  	var row = connFunction(data);
    if ( row == -1 ) {
      var d = new Date();
      var arraynick = new Array();
      arraynick[0] = data;
      arraynick[1] = d.getTime();
      nicknames.push(arraynick);

      socket.nickname = data;
  		socket.emit('comunicacion', { idcom: 2 });
      console.log(nicknames);
  		console.log('ACTIVITY : Cliente entra al chat        =====> (' + data + ')');
  		console.log('ACTIVITY : Total conexiones activas     =====> (' + io.sockets.clients().length + ')')
  		console.log('ACTIVITY : Total clientes identificados =====> (' + nicknames.length + ')');	
  	}
    else {
     socket.emit('comunicacion', { idcom: 4 });
    }
    socket.emit('usuarios', { nickdata: nicknames, sound: 'no' });
    socket.broadcast.emit('usuarios', { nickdata: nicknames, sound: 'yes' });
  });
// recibimos peticion de deconexion
  socket.on('disconnect', function () {
    if (!socket.nickname) return;
    row = connFunction(socket.nickname);
    if (row >= 0) {
      nicknames.splice(row, 1);
      console.log(nicknames);
      console.log('ACTIVITY : Cliente sale del chat        =====> (' + socket.nickname + ')');
      console.log('ACTIVITY : Total conexiones activas     =====> (' + io.sockets.clients().length + ')')
      console.log('ACTIVITY : Total clientes identificados =====> (' + nicknames.length + ')'); 
    }
    socket.emit('usuarios', { nickdata: nicknames, sound: 'no' });
    socket.broadcast.emit('usuarios', { nickdata: nicknames, sound: 'yes' });
  });
// recibimos un mensaje(chat) y lo reenviamos
  socket.on('newmessage', function (data) {
    // formateamos hora del servidor para enviarla en un string
    var d = new Date();
    var timemsg = d.getTime();
    socket.broadcast.emit('newmessage', { nick: socket.nickname, text: data, time: timemsg });
    socket.emit('newmessage', { nick: socket.nickname, text: data, time: timemsg });
    insMsgArray(socket.nickname, data, timemsg);
  });
});
// twit.stream('statuses/filter', {track: ['madrid', 'Liga Marca']}, function(stream) {
//   stream.on('data', function (data) {
//     if (data.text) {
//       var text = data.text.toLowerCase();
//       // buscamos  y tratamos mensajes Madrid
//       if(text.indexOf('madrid') != -1) {
//         console.log(data.text);
//       }
//     }
//   });
// });