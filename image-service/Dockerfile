FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p /cache && chown node:node /cache
COPY *.mjs ./
USER node
ENV CACHE_DIR=/cache
EXPOSE 3000
CMD ["node", "server.mjs"]
