FROM node:20-slim
WORKDIR /app
RUN npm install -g supergateway @thevgergroup/apollo-io-mcp@latest
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
EXPOSE 8000
CMD ["/app/start.sh"]
