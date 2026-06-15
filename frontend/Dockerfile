FROM node:26-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the code and build the Next.js app
COPY . .
RUN npm run build

# Expose the React port
EXPOSE 3000

# Start the Next.js server
CMD ["npm", "start"]