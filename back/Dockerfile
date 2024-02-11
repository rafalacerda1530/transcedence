FROM node:lts-alpine

# Set the working directory in the container
WORKDIR /app/

# Copy the rest of the application code to the working directory
COPY . .

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3333

RUN npx prisma generate

# Run the build script
RUN npm run build

ENV NODE_ENV prod

# Command to run the application
CMD npx prisma migrate deploy && node ./dist/main.js
