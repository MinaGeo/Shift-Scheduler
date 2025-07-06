# Build Angular app
FROM node:22 AS build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production

# Serve it using nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy Angular build files
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
