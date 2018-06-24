# CATFACE
Making overlay cat mustache on faces in images

![Demo](https://github.com/hoangsetup/meowed/blob/master/mewed_demo.jpg?raw=true)

## Serverless Architectures
* Amazon S3: Storage
* AWS Lambda: Serverless compute
* API Gateway: Public service via http service
* Amazon Rekognition: Image and video analysis

![Serverless Architectures](https://raw.githubusercontent.com/hoangsetup/meowed/master/serverless_architecture.png)

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