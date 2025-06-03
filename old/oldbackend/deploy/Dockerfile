FROM us.gcr.io/roonclood/base/node:16.14.0-1
# CLOOD: top
RUN apt-get update && apt-get install -y  python3 make g++

CMD npm run knex migrate:latest && node .
   
