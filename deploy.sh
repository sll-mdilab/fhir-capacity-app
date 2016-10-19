#!/bin/bash

APP_NAME=fhir-capacity-webapp.zip

echo "Deploying application to S3..."

if [ -f $APP_NAME ];
	then
		rm $APP_NAME
fi

zip -r $APP_NAME dist
aws s3 cp $APP_NAME s3://sll-mdilab-deploy/

echo "Deployment done."
