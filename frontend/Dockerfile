# Use an official Node.js 14 image as a base
FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy the package.json file
COPY package*.json ./

# Copy the .env file
COPY .env ./

# Install dependencies
RUN yarn

# Copy the rest of the code
COPY . .

# Build the application
RUN yarn run build

# Expose the port
EXPOSE 3000

# Run the command to start the development server
CMD ["npm", "run", "start"]