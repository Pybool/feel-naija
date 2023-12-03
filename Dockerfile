FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 8457

CMD ["npm", "run", "start-prod"]


