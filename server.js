const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }
    console.log('Mongodb connected...');

    //Connect to socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        //Create function to send status
        sendStatus = function(s)
        {
            socket.emit('status',s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw(err);
            }
            //else emit the messages
            socket.emit('output', res);
        });

        //Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;
            //check for name and msg
            if(name=='' || message ==''){
                //send error status
                sendStatus('Please enter a name and message');
            }else{
                //insert msg to db
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    //send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                })
            } 
        });
        //handle clear
        socket.on('clear', function(data){
            //remove all chats from the collection
            chat.remove({}, function(){
                //emit cleared
                socket.emit('cleared');
            });
        }); 
    });
});