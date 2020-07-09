const msg91 = require("msg91-sms");

module.exports = {
    sendSMS: (mobile, msg, sender=null) => {

        //Authentication Key 
        var authkey = '224991AuVykO8pSsz5b4313bf';

        //for single number
        var number = mobile;

        //message
        var message = msg;

        //Sender ID
        var senderid = 'PUSHOP';
        if(sender != null){
            senderid = sender;
        }
        

        //Route
        var route = '4';

        //Country dial code
        var dialcode = '91';


        //send to single number
        // if (!user_info === undefined) {

        // }
        msg91.sendOne(authkey, number, message, senderid, route, dialcode, function (response) {
            //Returns Message ID, If Sent Successfully or the appropriate Error Message
            console.log(response);
            
        });
    }
}