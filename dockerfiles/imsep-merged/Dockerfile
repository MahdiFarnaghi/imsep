FROM mdillon/postgis:11

RUN apt-get update \
 && apt-get install -y --force-yes --no-install-recommends \
      apt-transport-https \
      build-essential \
      curl \
      ca-certificates \
      git \
      lsb-release \
      python-all \
      rlwrap \
 && apt-get clean \
 && apt-get autoremove \
 && rm -rf /var/lib/apt/lists

# Using Ubuntu
#curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash sudo apt-get install -y nodejs

# Using Debian, as root
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash
RUN apt-get install -y nodejs



ENV NODE_ENV production
WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
COPY ["package.json", "package-lock.json*", "./"]
#RUN npm install --production --silent && mv node_modules ../
RUN npm cache clean --force && npm install
# copy app source to image _after_ npm install so that
# application code changes don't bust the docker cache of npm install step

#COPY . .
COPY . /usr/src/app
ENV PORT 1337
ENV POSTGIS_GDAL_ENABLED_DRIVERS ENABLE_ALL
EXPOSE 1337
ENV PATH $PATH:/usr/lib/postgresql/11/bin
CMD npm start

