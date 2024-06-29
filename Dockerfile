# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Copy environment variables
COPY .env .env

# Build the TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Command to run the app
CMD [ "node", "dist/app.js" ]
