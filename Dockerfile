FROM postgisnode


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
