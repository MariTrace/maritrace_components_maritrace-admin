# Step 1: Use a Node.js base image to build the app
FROM node:18 AS build

# Declare empty tokens
ARG NPM_TOKEN
ARG FONTAWESOME_TOKEN

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Configure npm, install deps, then remove tokens —
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    echo "//npm.fontawesome.com/:_authToken=${FONTAWESOME_TOKEN}" >> ~/.npmrc && \
    npm install && \
    rm ~/.npmrc

# Copy the rest of the application code
COPY . .

# Build the React app for production
ENV NODE_ENV=production
RUN npm run build

# Step 2: Use a lightweight web server to serve the app
FROM nginx:alpine

# Copy build output from previous stage to nginx html folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
