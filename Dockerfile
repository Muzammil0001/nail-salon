FROM node:20-alpine AS build
WORKDIR /app
ARG ENV
ENV ENV=$ENV
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  libusb-dev \
  eudev-dev \ 
  linux-headers

COPY . .
COPY .env.$ENV .env

RUN npm install -f
RUN npx prisma db push --accept-data-loss
RUN npx prisma db seed
RUN npm run build

RUN mkdir -p .next/standalone/public
RUN cp -r public/* .next/standalone/public/
RUN cp -r .next/static .next/standalone/.next/

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]