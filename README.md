# CATFACE
Making overlay cat mustache on faces in images

## Serverless Architectures
* Amazon S3: Storage
* AWS Lambda: Serverless compute
* API Gateway: Public service via http service
* Amazon Rekognition: Image and video analysis

![](https://images.viblo.asia/de112c4c-8adc-457a-9994-a38472d309a0.png)

## Deploy
### Requires
* Serverless >= v1.12
* AWS user cerfiticate (env, cer_file ~/.aws, ...)
* nodejs >= 8.10, npm >= 3.10

### Install
```shel
npm install
```

### Deploy
```shell
sls deploy
```