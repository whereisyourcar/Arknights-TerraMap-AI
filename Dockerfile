FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs visitor-store.mjs ./
COPY --chown=node:node dist ./dist
RUN mkdir -p /app/var && chown node:node /app/var
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4185 VISITOR_DATA_FILE=/app/var/visitors.json
EXPOSE 4185
CMD ["node", "server.mjs"]
