FROM node:lts-alpine

# Set the working directory in the container
WORKDIR /app/

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3333

RUN npx prisma generate

# Run the build script
RUN npm run build

# Command to run the application
CMD npx prisma migrate deploy && npm run start
