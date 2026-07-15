# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /usr/src/app

FROM base AS dependencies
COPY package*.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
