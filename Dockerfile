# Build stage
FROM node:26-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build

WORKDIR /app

ARG VITE_HA_URL=http://homeassistant.local:8123
ARG VITE_HA_TOKEN

ENV VITE_HA_URL=$VITE_HA_URL
ENV VITE_HA_TOKEN=$VITE_HA_TOKEN

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
