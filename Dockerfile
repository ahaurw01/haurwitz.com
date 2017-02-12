FROM node:0.10

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
RUN ./node_modules/.bin/brunch build && rm public/develop.html

CMD ["node", "server/app"]

EXPOSE 3000
