var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var httport = process.env.PORT || 1337;

app.use(express.static(__dirname + '/public'));
//app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client'));

var users = new Object();
var online = '\n';
var registration = 'Здравствуйте! Введите ваш никнейм.';
 
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

 io.on('connection', function(socket)
{
  console.log('ID:', socket.id,'user connected');
  socket.emit('system message', registration);
    
  socket.on('disconnect', function()
  {
    console.log('ID:', socket.id,'user disconnected');
	io.emit('system message', '<<' + users[socket.id] + '>>' + ' - ' + 'покидает нас.');
	delete users[socket.id];
  });
  
  socket.on('registration', function(nick)
  {
		users[socket.id] = nick;
		socket.emit('system message', users[socket.id] + '! Вы зарегистрированы. Посмотреть пользователей в онлайне можно командой /online');
		io.emit('system message', '<<' + users[socket.id] + '>>' + ' - ' + 'присоединяется к нам. Добро пожаловать!');
  
  });
	  
   socket.on('user message', function(msg)
   {
	if(msg == '/online')
	{
		online = ' OnLine: \n';
		for(socket.id in users)
		{
			online = online + users[socket.id] + ' ; ' + '\n';
		}
		socket.emit('system message', online);
	}
	if (msg != '/online')
    socket.broadcast.emit('chat message', '<<' + users[socket.id] + '>>' + ' : ' + msg);
   });
});


http.listen(httport, function () {
	console.log('listening on *:' + httport);
});
