# Dockerfile
FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN yarn install

# Bundle app source
COPY .. .

# Copy environment variables
COPY .env .env

# Build the TypeScript code
RUN yarn run build

# Expose port
EXPOSE 3000

# Command to run the app
CMD [ "node", "dist/app.js" ]
