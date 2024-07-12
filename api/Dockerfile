FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy environment variables
COPY .env .env

# Build the application
RUN npm run build

# Install dockerize
RUN apt-get update && apt-get install -y wget && \
    wget -O /usr/local/bin/dockerize https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz && \
    tar -C /usr/local/bin -xzvf /usr/local/bin/dockerize && \
    chmod +x /usr/local/bin/dockerize

EXPOSE 3000
EXPOSE 3019

# Command to run the application
CMD ["dockerize", "-wait", "tcp://elasticsearch:9200", "-timeout", "60s", "node", "dist/app.js"]
