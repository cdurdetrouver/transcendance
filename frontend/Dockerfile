# Use the official Nginx image to serve the static files
FROM nginx:alpine

# Copy the Nginx configuration file
COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx is running on
EXPOSE 5500

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
