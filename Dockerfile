FROM node:8.17.0
 
WORKDIR /app
 
COPY package.json package.json
 
RUN npm install
 
COPY . .

RUN npm install
 
CMD [ "npm", "run start" ]
