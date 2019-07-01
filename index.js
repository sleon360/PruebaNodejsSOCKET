const Koa = require('koa');
const IO = require('koa-socket-2');
const unirest = require("unirest");
const app = new Koa();
const io = new IO();


var req = unirest("POST", "http://pruebanodejsapi.herokuapp.com/v1/loginUser");

io.attach(app);
var clientes = {};

io.on('private-message', (ctx, data) => {
  try {
    //NOS UNIMOS A LA SALA DE LA EMPRESA QUE PERTENECEMOS
    ctx.socket.join(clientes[ctx.socket.id]['empresa']);
    io.to(clientes[ctx.socket.id]['empresa']).emit('message', { content: data.content, de: clientes[ctx.socket.id] });
  } catch (error) {
    io.to(ctx.socket.id).emit('login', "LOGINOFF");
  }

});


io.on('login', (ctx, data) => {
  //NOS UNIMOS A LA SALA SEGUN MI SOCKET ID
  ctx.socket.join(ctx.socket.id);
  //CONSULTAMOS EL EMDPOINT LOGIN DE CUSTOMER
  req.headers({ "Content-Type": "application/json" });
  req.type("json");
  req.send({
    "email": data.email,
    "password": data.password
  });
  req.end(function (res) {
    if (res.error) {
      io.to(ctx.socket.id).emit('login', "ERROR_LOGIN");
    }
    else {
      //NOS UNIMOS A LA SALA DE LA EMPRESA QUE PERTENECEMOS
      ctx.socket.join(res.body.empresa);
      io.to(ctx.socket.id).emit('login', res.body);
      clientes[ctx.socket.id] = {
        "email": res.body.email,
        "nombresapellido": res.body.nombresapellido,
        "empresa": res.body.empresa,
        "datelogin": Date.now()
      };
    }
  });
});

io.on('disconnect', (ctx, data) => {
  //ELIMINAMOS EL CLIENTE DEL ARRAY SI SE DESCONECTA
  delete clientes[ctx.socket.id];
});


io.on('connection', (ctx, data) => {
  console.log("Se conecta...");
});


app.listen(3001);