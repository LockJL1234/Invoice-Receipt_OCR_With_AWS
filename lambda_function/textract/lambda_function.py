import json
import boto3
from helper.helper import  image_extract, save_to_csv_file, pdf_extract

def lambda_handler(event, context):
    filePath= event;
    
    s3BucketName = "eoa-textract-dev" #name of bucket
    documentName = "upload/" + filePath #name of document
    
    #create textract object
    textract_client = boto3.client('textract', region_name='YOUR_REGION', aws_access_key_id='YOUR_ACCESS_KEY',
                              aws_secret_access_key='YOUR_SECRET_ACCESS_KEY')
                              
    #create s3 object
    s3_client = boto3.client('s3', region_name='ap-YOUR_REGION-1', aws_access_key_id='YOUR_ACCESS_KEY',
                              aws_secret_access_key='YOUR_SECRET_ACCESS_KEY')
    #key represent name of file to be uploaded                          
    key = "generate/" + filePath[:-4]
    
    #Trigger async Textract job if type of file is "PDF"
    if filePath.lower().endswith(".pdf"):
        extractedText = pdf_extract(textract_client, s3BucketName, documentName)
    else:
        extractedText = image_extract(textract_client, s3BucketName, documentName)
        
    #save csv file to S3 bucket
    save_to_csv_file(extractedText, s3_client, s3BucketName, key)

    return {
        'statusCode': 200,
        'body': extractedText
    }
