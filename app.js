const makeWaSocket = require('@adiwajshing/baileys').default;
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const P = require('pino');
const { unlink, existsSync, mkdirSync, readFileSync } = require('fs');
const express = require('express');
const { body, validationResult } = require('express-validator');
const http = require('http');
const port = process.env.PORT || 8000;
const app = express();
const fs = require('fs');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const server = http.createServer(app);
const io = socketIO(server);
const ZDGPath = './ZDGSessions/';
const ZDGAuth = 'auth_info.json';
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use("/", express.static(__dirname + "/"))

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });

io.on('connection', async socket => {
    socket.emit('message', 'Connecting...');

    const ZDGUpdate = (ZDGsock) => {
        ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
           
           if ("qr",qr){ 
            console.log('QR RECEIVED', qr);
              qrcode.toDataURL(qr, (err, url) => {
               socket.emit("qr", url)
               socket.emit("log", "QR Code received, please scan!")
           })
           };
           if (connection === 'close') {
              const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
              if (ZDGReconnect) ZDGConnection()
              console.log(`© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
              socket.emit('message', 'Whatsapp is disconnected!');
		        
              if (ZDGReconnect === false) {
                 const removeAuth = ZDGPath + ZDGAuth
                 unlink(removeAuth, err => {
                    if (err) throw err
                 })
              }
           }

           if (connection === 'open') {
            socket.emit("log", 'Whatsapp is ready!');
            socket.emit("qr", "./check.svg")
            console.log('© BOT-ZDG -CONECTADO')
           }
           //ZDGsock.on ("qr", qr => {
            //console.log('QR RECEIVED', qr);
            //qrcode.toDataURL(qr, (err, url) => {
               // socket.emit("qr", url)
                //socket.emit("log", "QR Code received, please scan!")
            //})
        //});
        })
     }
     
     const ZDGConnection = async () => {
        const { version } = await fetchLatestBaileysVersion()
        if (!existsSync(ZDGPath)) {
           mkdirSync(ZDGPath, { recursive: true });
        }
        const { saveState, state } = useSingleFileAuthState(ZDGPath + ZDGAuth)
        const config = {
           auth: state,
           logger: P({ level: 'error' }),
           printQRInTerminal: true,
           version,
           connectTimeoutMs: 60_000,
           async getMessage(key) {
              return { conversation: 'botzg' };
           },
        }
        const ZDGsock = makeWaSocket(config);
        ZDGUpdate(ZDGsock.ev);
        ZDGsock.ev.on('creds.update', saveState);
     
        const ZDGSendMessage = async (jid, msg) => {
           await ZDGsock.presenceSubscribe(jid)
           await delay(2000)
           await ZDGsock.sendPresenceUpdate('composing', jid)
           await delay(1500)
           await ZDGsock.sendPresenceUpdate('paused', jid)
           return await ZDGsock.sendMessage(jid, msg)
        }
     
        // Send message
        app.post('/zdg-message', [
           body('jid').notEmpty(),
           body('message').notEmpty(),
        ], async (req, res) => {
           const errors = validationResult(req).formatWith(({
           msg
           }) => {
           return msg;
           });
           if (!errors.isEmpty()) {
           return res.status(422).json({
              status: false,
              message: errors.mapped()
           });
           }
        
           const jid = req.body.jid;
           const numberDDI = jid.substr(0, 2);
           const numberDDD = jid.substr(2, 2);
           const numberUser = jid.substr(-8, 8);
           const message = req.body.message;
     
           if (numberDDI !== '55') {
              ZDGSendMessage(jid, { text: message }).then(response => {
                 res.status(200).json({
                    status: true,
                    response: response
                 });
                 }).catch(err => {
                 res.status(500).json({
                    status: false,
                    response: err
                 });
                 });
           }
           if (numberDDI === '55' && numberDDD <= 30) {
              const numberZDG = "55" + numberDDD + "9" + numberUser + "@s.whatsapp.net";
              ZDGSendMessage(numberZDG, { text: message }).then(response => {
                 res.status(200).json({
                    status: true,
                    response: response
                 });
                 }).catch(err => {
                 res.status(500).json({
                    status: false,
                    response: err
                 });
                 });
           }
           if (numberDDI === '55' && numberDDD > 30) {
              const numberZDG = "55" + numberDDD + numberUser + "@s.whatsapp.net";
              ZDGSendMessage(numberZDG, { text: message }).then(response => {
                 res.status(200).json({
                    status: true,
                    response: response
                 });
                 }).catch(err => {
                 res.status(500).json({
                    status: false,
                    response: err
                 });
                 });
           }
     
        });
     }
     ZDGConnection()
   });

server.listen(port, function() {
  console.log('© BOT-ZDG - Servidor rodando na porta: ' + port);
});
