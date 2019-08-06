FROM nginx:alpine
COPY dist /usr/share/nginx/html
ADD ./nginx.conf /etc/nginx/nginx.conf
