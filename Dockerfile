FROM node:14.12

RUN apt update && apt install dnsutils -y
WORKDIR /usr/src/app
RUN npm install pm2 -g

COPY ./package.json /usr/src/app
RUN npm install
COPY . /usr/src/app

CMD ["pm2-runtime", "index.js"]