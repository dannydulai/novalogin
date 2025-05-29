export REDIS_URL=$(cat config/development.json | jq -r '.REDIS_URL')
export ACCOUNT_PG_URL=$(cat config/development.json | jq -r '.ACCOUNT_PG_URL')
npm run dev
