#!/bin/bash
# Container runtime configuration script
# Gets config file from S3, decrypts and exports env variables, then
#   substitutes env variables into parameterized config files
# This script expects S3URL env variable with the full S3 path to the encrypted config file

# list of configuration files that contain parameters to be substituted
# - must specify full path to each file in the container
# - there needs to be a corresponding .template file in the same directory
CONFIG_FILES=(
'/app/grails-app/conf/application.yml'
)

# Jenkins parameters that will get processed by envsubst
# - if this is empty, envsubst will try to replace anything that looks like $var or ${var} in the above config files
# - otherwise, only the variables listed below will be replaced with their values from Jenkins
VARS=''

# Do not modify below this line

if [ -n "$S3URL" ]; then
  echo "Getting config file from S3 (${S3URL}) ..."
  aws --version
  if [[ $? -ne 0 ]]; then
    echo "ERROR: aws-cli not found!"
    exit 1
  fi
  aws --region us-east-1 s3 cp ${S3URL} ./config.encrypted
  aws --region us-east-1 kms decrypt --ciphertext-blob fileb://config.encrypted --output text --query Plaintext | base64 --decode > config.txt
  set -a
  source config.txt
  rm -f config.txt config.encrypted

  echo 'Substituting environment variables in config files ...'
  for CONF in "${CONFIG_FILES[@]}"; do
    echo "- ${CONF}"
    if [[ -r "${CONF}.template" ]]; then
      envsubst ${VARS} < "${CONF}.template" > "${CONF}"
      chmod 644 ${CONF}
    else
      echo "ERROR: ${CONF}.template not found!"
      exit 1
    fi
  done

else
  echo "ERROR: S3URL variable not set!"
  exit 1
fi
