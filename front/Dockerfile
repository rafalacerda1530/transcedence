FROM node:lts-alpine

# Set the working directory in the container
WORKDIR /app/

COPY . .

RUN npm install

EXPOSE 3000

RUN npm install -g serve

ENV NODE_ENV prod

# Command to run the application
CMD  npm run build && serve -s build
