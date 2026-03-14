FROM node:20-slim
WORKDIR /app
RUN npm install -g supergateway @thevgergroup/apollo-io-mcp@latest
COPY server.js /app/server.js
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
EXPOSE 8080
CMD ["node", "/app/server.js"]
