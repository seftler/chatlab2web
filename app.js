var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var httport = process.env.PORT || 1337;
var mysql = require('mysql');
var maxid;

app.use(express.static(__dirname + '/public'));

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
  var pool  = mysql.createPool(
  {
	  connectionLimit : 10,
	  host            : 'us-cdbr-iron-east-04.cleardb.net',
	  user            : 'bc22298ade8971',
	  password        : '84cbac2b',
	  database : 'ad_27eb92d3afef4f0'
  });
  
  pool.getConnection(function(err, connection) 
  {
	  if (err)
	  {
		console.log('Ошибка');  
	  }
	  else
	  {
		connection.query( 'SELECT number FROM history WHERE number=(SELECT MAX(number) FROM history)', function(err, num) 
		{
			maxid = num[0].number;
		});
	  
	  }
    
  socket.on('disconnect', function()
  {
    console.log('ID:', socket.id,'user disconnected');
	if (users[socket.id] == undefined)
	{
		io.emit('system message', '<<гость>>' + ' - ' + 'покидает нас.');
	}
	else
	{
		io.emit('system message', '<<' + users[socket.id] + '>>' + ' - ' + 'покидает нас.');
		delete users[socket.id];
	}
  });
  
  socket.on('registration', function(nick)
  {
		users[socket.id] = nick;
		socket.emit('system message', users[socket.id] + '! Вы зарегистрированы. Посмотреть пользователей в онлайне можно командой /online');
		io.emit('system message', '<<' + users[socket.id] + '>>' + ' - ' + 'присоединяется к нам. Добро пожаловать!');
		connection.query( 'SELECT * FROM history', function(err, result) 
		{
			maxid = parseInt(maxid/10);
			console.log(maxid);
			for (var i=maxid-9; i<=maxid; i++)
			{	
				socket.emit('system message', result[i].message);
			}
		});
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
	{
		socket.broadcast.emit('chat message', '<<' + users[socket.id] + '>>' + ' : ' + msg);
		connection.query( 'INSERT INTO history (message) VALUES ("'+ Date() + ' <<' + users[socket.id] + '>>' + ' : ' + msg +'")', function(err, result) 
		{
			console.log('запись добавлена');
		});
	}
   });
  });
});


http.listen(httport, function () 
{
	console.log('listening on *:' + httport);
});
