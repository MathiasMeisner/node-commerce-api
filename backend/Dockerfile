# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install && npm install -g nodemon

# Copy the entire project to the container
COPY . .

# Expose the app port
EXPOSE 3000

# Run migrations before starting the server
CMD sh -c "npx knex migrate:latest && npm run dev"
