FROM node:22-alpine

WORKDIR /app

COPY . .
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "run", "dev"]

RUN npm install