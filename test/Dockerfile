FROM node:10-alpine

WORKDIR /test

COPY test/package.json .

RUN npm i

COPY test/ .

ENTRYPOINT ["npx", "mocha", "--timeout", "20000"]

CMD ["test.js"]
