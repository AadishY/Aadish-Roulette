# Production Dockerfile for Aadish-Roulette Server
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Change ownership of the working directory to the node user
RUN chown node:node /usr/src/app

# Switch to 'node' user
USER node

# Install app dependencies
COPY --chown=node:node package*.json ./
RUN npm install --production

# Bundle app source
COPY --chown=node:node . .

# Expose port
EXPOSE 3001

# Production environment
ENV NODE_ENV=production

# Run the server
CMD [ "node", "index.js" ]
