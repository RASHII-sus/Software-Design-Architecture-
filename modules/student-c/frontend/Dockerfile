FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY index.html vite.config.js ./
COPY src ./src

EXPOSE 3000
CMD ["npm", "run", "start"]
