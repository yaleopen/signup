FROM openjdk:8
MAINTAINER John Doe "john.doe@example.com"

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends apt-utils
# install aws-cli
RUN apt-get install -y python-minimal gettext-base && \
    wget -nv "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" && \
    unzip awscli-bundle.zip && \
    ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

# copy config setup script
COPY docker/import_config.sh /root/
WORKDIR /usr/lib/java
ENV GRAILS_VERSION 3.3.2

RUN wget https://github.com/grails/grails-core/releases/download/v${GRAILS_VERSION}/grails-${GRAILS_VERSION}.zip && \
    unzip grails-${GRAILS_VERSION}.zip && \
    rm -rf grails-${GRAILS_VERSION}.zip && \
    ln -s grails-${GRAILS_VERSION} grails

ENV GRAILS_HOME /usr/lib/java/grails
ENV PATH $GRAILS_HOME/bin:$PATH

EXPOSE 8080
WORKDIR /app
COPY . /app
RUN grails package
# copy config templates
COPY docker/*.template /app/grails-app/conf/

CMD /root/import_config.sh && \
    java -Djava.security.egd=file:/dev/./urandom -jar /app/build/libs/signup-tool-0.1.war --spring.config.location=/app/grails-app/conf/