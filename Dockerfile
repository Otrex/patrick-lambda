FROM node:16-alpine
WORKDIR /app

COPY . /app
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

RUN yarn install

CMD ["node", "./src/index.mjs"]
