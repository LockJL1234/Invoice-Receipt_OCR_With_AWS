const AWS = require('aws-sdk');
const fs = require('fs');
//create s3 object
var s3 = new AWS.S3({region : "YOUR_REGION", accessKeyId : 'YOUR_ACCESS_KEY',
                    secretAccessKey : 'YOUR_SECRET_ACCESS_KEY'});

exports.handler = (event, context, callback) => {
        let received_request =JSON.stringify(event.img);
    
        received_request=  received_request.slice(1, -1);
        var filePath = event.folder + event.imageName + "." + event.fileExt  //file name of image 
        //get byte stream of image
        let buffer = Buffer.from(received_request.substring(received_request.indexOf("base64,") + 7), 'base64')

        //parameters for uploading file to S3
        var params = {
                Key: filePath, 
                Body: buffer,
                ContentEncoding: 'base64',
                Bucket: "eoa-textract-dev"
        };
     
        // upload image file to S3 bucket
       s3.upload(params, function(err, data){
       if(err) {
           callback(err, null);
       } else {
         var res ={
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json"
                }
            };
            res.body = "Uploaded";
            callback(null, res);
        }
    });
};