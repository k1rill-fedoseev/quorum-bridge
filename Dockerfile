FROM node:10-alpine

WORKDIR /work

COPY package.json .

RUN npm i

COPY . .

ENTRYPOINT ["node"]
